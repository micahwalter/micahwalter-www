package passcode

import (
	"crypto/subtle"
)

// Equal compares passcodes in constant time.
func Equal(a, b string) bool {
	ba := []byte(a)
	bb := []byte(b)
	if len(ba) != len(bb) {
		return false
	}
	return subtle.ConstantTimeCompare(ba, bb) == 1
}
