// Package token implements HMAC-SHA256 signed tokens for newsletter confirmation
// and unsubscribe links. Token structure:
//
//	payload   = base64url( email + "|" + expires_unix_ts )
//	signature = HMAC-SHA256( payload, secret )
//	token     = payload + "." + signature
//
// Verification supports dual-key rotation: try current secret first, fall back
// to previous. This allows zero-downtime key rotation.
package token

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
	ErrInvalid = errors.New("token: invalid")
	ErrExpired = errors.New("token: expired")
)

// Sign creates a signed token for email that expires after ttl.
func Sign(email string, ttl time.Duration, secret string) (string, error) {
	if email == "" {
		return "", fmt.Errorf("token: email must not be empty")
	}
	if secret == "" {
		return "", fmt.Errorf("token: secret must not be empty")
	}
	expires := time.Now().Add(ttl).Unix()
	payload := base64.RawURLEncoding.EncodeToString(
		[]byte(email + "|" + strconv.FormatInt(expires, 10)),
	)
	sig := sign(payload, secret)
	return payload + "." + sig, nil
}

// Verify validates a token against current and (optionally) previous secrets.
// Returns the email embedded in the token on success.
// Returns ErrInvalid if the signature does not match either secret.
// Returns ErrExpired if the token is syntactically valid but past its expiry.
func Verify(token, currentSecret, previousSecret string) (string, error) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return "", ErrInvalid
	}
	payload, providedSig := parts[0], parts[1]

	if !verifySig(payload, providedSig, currentSecret) {
		if previousSecret == "" || !verifySig(payload, providedSig, previousSecret) {
			return "", ErrInvalid
		}
	}

	raw, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		return "", ErrInvalid
	}

	fields := strings.SplitN(string(raw), "|", 2)
	if len(fields) != 2 {
		return "", ErrInvalid
	}
	email := fields[0]
	expiresAt, err := strconv.ParseInt(fields[1], 10, 64)
	if err != nil {
		return "", ErrInvalid
	}
	if time.Now().Unix() > expiresAt {
		return "", ErrExpired
	}
	return email, nil
}

// sign computes HMAC-SHA256(payload, key) and returns it as base64url.
func sign(payload, key string) string {
	mac := hmac.New(sha256.New, []byte(key))
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

// verifySig performs a constant-time comparison of the provided signature
// against the expected HMAC for the given payload and key.
func verifySig(payload, providedSig, key string) bool {
	expected := sign(payload, key)
	return subtle.ConstantTimeCompare([]byte(providedSig), []byte(expected)) == 1
}
