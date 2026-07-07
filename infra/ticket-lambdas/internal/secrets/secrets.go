// Package secrets loads ticket-server credentials from Secrets Manager.
//
// Expected JSON: { "passcode": "...", "hmac": "..." }
package secrets

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

// TicketSecrets holds the passcode and HMAC signing key for session tokens.
type TicketSecrets struct {
	Passcode string `json:"passcode"`
	HMAC     string `json:"hmac"`
}

// Client fetches and caches secrets from Secrets Manager.
type Client struct {
	sm        *secretsmanager.Client
	secretARN string
	mu        sync.RWMutex
	cached    *TicketSecrets
}

// NewClient returns a secrets Client for the given secret ARN or name.
func NewClient(cfg aws.Config, secretARN string) *Client {
	return &Client{
		sm:        secretsmanager.NewFromConfig(cfg),
		secretARN: secretARN,
	}
}

// Get returns cached ticket secrets, fetching on first call.
func (c *Client) Get(ctx context.Context) (*TicketSecrets, error) {
	c.mu.RLock()
	if c.cached != nil {
		s := c.cached
		c.mu.RUnlock()
		return s, nil
	}
	c.mu.RUnlock()

	c.mu.Lock()
	defer c.mu.Unlock()
	if c.cached != nil {
		return c.cached, nil
	}

	result, err := c.sm.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(c.secretARN),
	})
	if err != nil {
		return nil, fmt.Errorf("secrets.Get: %w", err)
	}

	var s TicketSecrets
	if err := json.Unmarshal([]byte(aws.ToString(result.SecretString)), &s); err != nil {
		return nil, fmt.Errorf("secrets.Get unmarshal: %w", err)
	}
	if s.Passcode == "" || s.HMAC == "" {
		return nil, fmt.Errorf("secrets.Get: passcode and hmac must be set")
	}

	c.cached = &s
	return &s, nil
}
