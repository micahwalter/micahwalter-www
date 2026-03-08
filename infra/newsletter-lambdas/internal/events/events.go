// Package events provides a typed EventBridge client for emitting newsletter
// domain events onto the newsletter-bus. All events share a common envelope
// and follow past-tense naming (e.g. SignupRequested, SubscriberConfirmed).
package events

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/eventbridge"
	ebtypes "github.com/aws/aws-sdk-go-v2/service/eventbridge/types"
)

const (
	sourceSubscribers = "newsletter.subscribers"
	sourceCampaigns   = "newsletter.campaigns"
	v1                = "1"

	DetailTypeSignupRequested         = "SignupRequested"
	DetailTypeConfirmationResent      = "ConfirmationResent"
	DetailTypeSubscriberConfirmed     = "SubscriberConfirmed"
	DetailTypeUnsubscribeRequested    = "UnsubscribeRequested"
	DetailTypeNewsletterSendRequested = "NewsletterSendRequested"
)

// Client wraps the EventBridge SDK client.
type Client struct {
	eb      *eventbridge.Client
	busName string
}

// NewClient returns a new EventBridge client using the provided AWS config.
func NewClient(cfg aws.Config, busName string) *Client {
	return &Client{
		eb:      eventbridge.NewFromConfig(cfg),
		busName: busName,
	}
}

// --- Event detail structs ---

type SignupRequestedDetail struct {
	EventID           string `json:"eventId"`
	OccurredAt        string `json:"occurredAt"`
	Version           string `json:"version"`
	Email             string `json:"email"`
	Name              string `json:"name"`
	Source            string `json:"source"`
	IPAddress         string `json:"ipAddress"`
	ConfirmationToken string `json:"confirmationToken"`
}

type ConfirmationResentDetail struct {
	EventID           string `json:"eventId"`
	OccurredAt        string `json:"occurredAt"`
	Version           string `json:"version"`
	Email             string `json:"email"`
	Name              string `json:"name"`
	ConfirmationToken string `json:"confirmationToken"`
}

type SubscriberConfirmedDetail struct {
	EventID          string `json:"eventId"`
	OccurredAt       string `json:"occurredAt"`
	Version          string `json:"version"`
	Email            string `json:"email"`
	Name             string `json:"name"`
	ConfirmedAt      string `json:"confirmedAt"`
	UnsubscribeToken string `json:"unsubscribeToken"`
}

type UnsubscribeRequestedDetail struct {
	EventID        string `json:"eventId"`
	OccurredAt     string `json:"occurredAt"`
	Version        string `json:"version"`
	Email          string `json:"email"`
	Name           string `json:"name"`
	UnsubscribedAt string `json:"unsubscribedAt"`
	Via            string `json:"via"` // "email-link" or "manual-form"
}

// NewsletterSendRequestedDetail is emitted by the blog email:send CLI command.
// Source: newsletter.campaigns
//
// When TestEmail is non-empty, the dispatch Lambda sends only to that address
// and skips all DynamoDB subscriber queries and newsletter_sends writes.
type NewsletterSendRequestedDetail struct {
	EventID          string `json:"eventId"`
	OccurredAt       string `json:"occurredAt"`
	Version          string `json:"version"`
	EmailID          int    `json:"emailId"`
	Slug             string `json:"slug"`
	Title            string `json:"title"`
	HTMLBody         string `json:"htmlBody"`
	TextBody         string `json:"textBody"`
	ViewInBrowserURL string `json:"viewInBrowserUrl"`
	TestEmail        string `json:"testEmail,omitempty"` // non-empty → test send to single address
}

// --- Emit methods ---

func (c *Client) EmitSignupRequested(ctx context.Context, d SignupRequestedDetail) error {
	d.EventID = newID()
	d.OccurredAt = now()
	d.Version = v1
	return c.put(ctx, sourceSubscribers, DetailTypeSignupRequested, d)
}

func (c *Client) EmitConfirmationResent(ctx context.Context, d ConfirmationResentDetail) error {
	d.EventID = newID()
	d.OccurredAt = now()
	d.Version = v1
	return c.put(ctx, sourceSubscribers, DetailTypeConfirmationResent, d)
}

func (c *Client) EmitSubscriberConfirmed(ctx context.Context, d SubscriberConfirmedDetail) error {
	d.EventID = newID()
	d.OccurredAt = now()
	d.Version = v1
	return c.put(ctx, sourceSubscribers, DetailTypeSubscriberConfirmed, d)
}

func (c *Client) EmitUnsubscribeRequested(ctx context.Context, d UnsubscribeRequestedDetail) error {
	d.EventID = newID()
	d.OccurredAt = now()
	d.Version = v1
	return c.put(ctx, sourceSubscribers, DetailTypeUnsubscribeRequested, d)
}

func (c *Client) EmitNewsletterSendRequested(ctx context.Context, d NewsletterSendRequestedDetail) error {
	d.EventID = newID()
	d.OccurredAt = now()
	d.Version = v1
	return c.put(ctx, sourceCampaigns, DetailTypeNewsletterSendRequested, d)
}

// put marshals detail and calls EventBridge PutEvents.
func (c *Client) put(ctx context.Context, source, detailType string, detail interface{}) error {
	detailJSON, err := json.Marshal(detail)
	if err != nil {
		return fmt.Errorf("events.put marshal: %w", err)
	}
	out, err := c.eb.PutEvents(ctx, &eventbridge.PutEventsInput{
		Entries: []ebtypes.PutEventsRequestEntry{
			{
				EventBusName: aws.String(c.busName),
				Source:       aws.String(source),
				DetailType:   aws.String(detailType),
				Detail:       aws.String(string(detailJSON)),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("events.put PutEvents: %w", err)
	}
	if out.FailedEntryCount > 0 {
		return fmt.Errorf("events.put: %d entries failed; first error: %s",
			out.FailedEntryCount, aws.ToString(out.Entries[0].ErrorMessage))
	}
	return nil
}

// newID returns a pseudo-random UUID v4 string using crypto/rand.
func newID() string {
	b := make([]byte, 16)
	rand.Read(b) //nolint:errcheck — crypto/rand.Read never errors on supported platforms
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func now() string {
	return time.Now().UTC().Format(time.RFC3339)
}
