// Package secrets provides a cached Secrets Manager client for HMAC key retrieval.
// Keys are fetched once at Lambda cold start and cached in memory. The secret
// JSON format supports dual-key rotation:
//
//	{ "current": "key1", "previous": "key2" }
//
// When rotating keys, set "previous" to the old "current" value and update
// "current" to the new key. Deploy updated Lambdas that verify with current,
// falling back to previous. After all previous-signed tokens expire, clear
// "previous".
package secrets

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type HMACKeys struct {
	Current  string `json:"current"`
	Previous string `json:"previous"`
}

// Client fetches and caches HMAC keys from Secrets Manager.
type Client struct {
	sm        *secretsmanager.Client
	secretARN string
	mu        sync.RWMutex
	keys      *HMACKeys
}

// NewClient returns a new secrets Client. Keys are fetched lazily on first call
// to Keys(), then cached for the lifetime of the Lambda execution environment.
func NewClient(cfg aws.Config, secretARN string) *Client {
	return &Client{
		sm:        secretsmanager.NewFromConfig(cfg),
		secretARN: secretARN,
	}
}

// Keys returns the cached HMAC keys, fetching from Secrets Manager if needed.
func (c *Client) Keys(ctx context.Context) (*HMACKeys, error) {
	c.mu.RLock()
	if c.keys != nil {
		keys := c.keys
		c.mu.RUnlock()
		return keys, nil
	}
	c.mu.RUnlock()

	c.mu.Lock()
	defer c.mu.Unlock()
	if c.keys != nil {
		return c.keys, nil
	}

	result, err := c.sm.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(c.secretARN),
	})
	if err != nil {
		return nil, fmt.Errorf("secrets.Keys: %w", err)
	}

	var keys HMACKeys
	if err := json.Unmarshal([]byte(aws.ToString(result.SecretString)), &keys); err != nil {
		return nil, fmt.Errorf("secrets.Keys unmarshal: %w", err)
	}
	if keys.Current == "" {
		return nil, fmt.Errorf("secrets.Keys: 'current' key is empty")
	}

	c.keys = &keys
	return &keys, nil
}
