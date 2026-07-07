// Package sessiontoken implements HMAC-signed session tokens for the ticket API.
//
// Token structure (matches photo-upload):
//
//	payload   = base64url(JSON { "exp": unix_seconds })
//	signature = HMAC-SHA256(payload, hmac_key)
//	token     = payload + "." + signature
package sessiontoken

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

var ErrInvalid = errors.New("sessiontoken: invalid")

type payload struct {
	Exp int64 `json:"exp"`
}

// Sign creates a session token valid for ttl.
func Sign(hmacKey string, ttl time.Duration) (string, error) {
	if hmacKey == "" {
		return "", fmt.Errorf("sessiontoken: hmac key must not be empty")
	}
	exp := time.Now().Add(ttl).Unix()
	raw, err := json.Marshal(payload{Exp: exp})
	if err != nil {
		return "", err
	}
	p := base64.RawURLEncoding.EncodeToString(raw)
	sig := sign(p, hmacKey)
	return p + "." + sig, nil
}

// Verify validates a session token and returns nil on success.
func Verify(token, hmacKey string) error {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return ErrInvalid
	}
	p, providedSig := parts[0], parts[1]
	if !verifySig(p, providedSig, hmacKey) {
		return ErrInvalid
	}

	raw, err := base64.RawURLEncoding.DecodeString(p)
	if err != nil {
		return ErrInvalid
	}
	var pl payload
	if err := json.Unmarshal(raw, &pl); err != nil {
		return ErrInvalid
	}
	if pl.Exp <= time.Now().Unix() {
		return ErrInvalid
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
