// Package formtoken issues and verifies HMAC-signed form load tokens used for
// time-based bot detection. A token encodes the time the subscribe form was
// loaded. On submission the Lambda verifies:
//
//   - The HMAC signature matches (prevents token forgery).
//   - At least 3 seconds have elapsed (bots submit in < 1s).
//   - No more than 1 hour has elapsed (prevents replay with stale tokens).
//
// Token structure (same scheme as the token package):
//
//	payload   = base64url( "form" + "|" + issued_at_unix )
//	signature = HMAC-SHA256( payload, secret )
//	token     = payload + "." + signature
package formtoken

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

var (
	ErrInvalid  = errors.New("formtoken: invalid")
	ErrTooFast  = errors.New("formtoken: submitted too fast")
	ErrExpired  = errors.New("formtoken: expired")
)

const (
	minAge = 3 * time.Second
	maxAge = time.Hour
)

// Issue creates a signed form token recording the current time.
func Issue(secret string) (string, error) {
	if secret == "" {
		return "", fmt.Errorf("formtoken: secret must not be empty")
	}
	issuedAt := time.Now().Unix()
	payload := base64.RawURLEncoding.EncodeToString(
		[]byte("form|" + strconv.FormatInt(issuedAt, 10)),
	)
	sig := sign(payload, secret)
	return payload + "." + sig, nil
}

// Verify validates a form token's signature and timing.
// It tries currentSecret first, then previousSecret (for key rotation).
func Verify(tok, currentSecret, previousSecret string) error {
	parts := strings.SplitN(tok, ".", 2)
	if len(parts) != 2 {
		return ErrInvalid
	}
	payload, providedSig := parts[0], parts[1]

	if !verifySig(payload, providedSig, currentSecret) {
		if previousSecret == "" || !verifySig(payload, providedSig, previousSecret) {
			return ErrInvalid
		}
	}

	raw, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		return ErrInvalid
	}

	fields := strings.SplitN(string(raw), "|", 2)
	if len(fields) != 2 || fields[0] != "form" {
		return ErrInvalid
	}

	issuedAt, err := strconv.ParseInt(fields[1], 10, 64)
	if err != nil {
		return ErrInvalid
	}

	age := time.Since(time.Unix(issuedAt, 0))
	if age < minAge {
		return ErrTooFast
	}
	if age > maxAge {
		return ErrExpired
	}
	return nil
}

func sign(payload, key string) string {
	mac := hmac.New(sha256.New, []byte(key))
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func verifySig(payload, providedSig, key string) bool {
	expected := sign(payload, key)
	return subtle.ConstantTimeCompare([]byte(providedSig), []byte(expected)) == 1
}
