// newsletter-dispatch-fn processes NewsletterSendRequested events from SQS.
//
// For each event it:
//  1. Creates/updates an SES template with the rendered HTML and text body
//  2. Queries all ACTIVE subscribers from DynamoDB (paginated)
//  3. Generates a signed 90-day unsubscribe token per subscriber
//  4. Skips any subscriber already recorded in newsletter_sends (idempotency)
//  5. Sends via SES SendBulkTemplatedEmail in batches of 50
//  6. Records SENT/FAILED results in newsletter_sends
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	sestypes "github.com/aws/aws-sdk-go-v2/service/ses/types"

	"github.com/micahwalter/newsletter-lambdas/internal/dynamo"
	evts "github.com/micahwalter/newsletter-lambdas/internal/events"
	"github.com/micahwalter/newsletter-lambdas/internal/secrets"
	"github.com/micahwalter/newsletter-lambdas/internal/token"
)

const (
	sesBatchSize    = 50
	unsubscribeTTL  = 90 * 24 * time.Hour
)

var (
	subscribersDB *dynamo.Client
	sendsDB       *dynamo.SendsClient
	sesClient     *ses.Client
	secClient     *secrets.Client
	senderEmail   string
	siteURL       string
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		slog.Error("dispatch: failed to load AWS config", "err", err)
		os.Exit(1)
	}
	subscribersDB = dynamo.NewClient(cfg, os.Getenv("SUBSCRIBERS_TABLE"))
	sendsDB = dynamo.NewSendsClient(cfg, os.Getenv("SENDS_TABLE"))
	sesClient = ses.NewFromConfig(cfg)
	secClient = secrets.NewClient(cfg, os.Getenv("HMAC_SECRET_ARN"))
	senderEmail = os.Getenv("SES_FROM_ADDRESS")
	siteURL = os.Getenv("SITE_URL")
}

// eventEnvelope is the EventBridge event structure as delivered via SQS.
type eventEnvelope struct {
	DetailType string          `json:"detail-type"`
	Detail     json.RawMessage `json:"detail"`
}

func handler(ctx context.Context, sqsEvent events.SQSEvent) (events.SQSEventResponse, error) {
	var failures []events.SQSBatchItemFailure

	for _, record := range sqsEvent.Records {
		if err := processRecord(ctx, record); err != nil {
			slog.Error("dispatch: failed to process SQS record",
				"messageId", record.MessageId, "err", err)
			failures = append(failures, events.SQSBatchItemFailure{
				ItemIdentifier: record.MessageId,
			})
		}
	}

	return events.SQSEventResponse{BatchItemFailures: failures}, nil
}

func processRecord(ctx context.Context, record events.SQSMessage) error {
	var envelope eventEnvelope
	if err := json.Unmarshal([]byte(record.Body), &envelope); err != nil {
		return fmt.Errorf("unmarshal envelope: %w", err)
	}

	if envelope.DetailType != evts.DetailTypeNewsletterSendRequested {
		slog.Warn("dispatch: unexpected detail-type, skipping", "detail-type", envelope.DetailType)
		return nil
	}

	var detail evts.NewsletterSendRequestedDetail
	if err := json.Unmarshal(envelope.Detail, &detail); err != nil {
		return fmt.Errorf("unmarshal NewsletterSendRequested: %w", err)
	}

	return dispatch(ctx, detail)
}

func dispatch(ctx context.Context, detail evts.NewsletterSendRequestedDetail) error {
	logger := slog.With("emailId", detail.EmailID, "slug", detail.Slug)
	logger.Info("dispatch: starting send", "title", detail.Title)

	// Fetch HMAC secret (cached after cold start)
	keys, err := secClient.Keys(ctx)
	if err != nil {
		return fmt.Errorf("dispatch: fetch HMAC secret: %w", err)
	}

	// Create/update SES template for this campaign
	templateName := fmt.Sprintf("newsletter-campaign-%d", detail.EmailID)
	if err := upsertTemplate(ctx, templateName, detail.Title, detail.HTMLBody, detail.TextBody); err != nil {
		return fmt.Errorf("dispatch: upsert SES template: %w", err)
	}
	logger.Info("dispatch: SES template ready", "template", templateName)

	// Query all ACTIVE subscribers
	subscribers, err := subscribersDB.QueryActiveSubscribers(ctx)
	if err != nil {
		return fmt.Errorf("dispatch: query active subscribers: %w", err)
	}
	logger.Info("dispatch: active subscribers queried", "count", len(subscribers))

	// Build batches, skipping already-sent subscribers
	var sent, skipped, failed int
	var batch []sestypes.BulkEmailDestination

	flush := func() error {
		if len(batch) == 0 {
			return nil
		}
		results, err := sendBatch(ctx, templateName, batch)
		if err != nil {
			return err
		}
		// Record results
		now := time.Now().UTC().Format(time.RFC3339)
		for i, dest := range batch {
			email := dest.Destination.ToAddresses[0]
			rec := &dynamo.SendRecord{
				EmailID: detail.EmailID,
				Email:   email,
				SentAt:  now,
				Status:  dynamo.SendStatusSent,
			}
			if results[i].Status == sestypes.BulkEmailStatusFailed {
				rec.Status = dynamo.SendStatusFailed
				rec.FailureReason = aws.ToString(results[i].Error)
				rec.SentAt = ""
				failed++
			} else {
				sent++
			}
			if putErr := sendsDB.PutSend(ctx, rec); putErr != nil {
				slog.Error("dispatch: failed to write send record",
					"email", email, "err", putErr)
			}
		}
		batch = batch[:0]
		return nil
	}

	for _, sub := range subscribers {
		// Idempotency check
		existing, err := sendsDB.GetSend(ctx, detail.EmailID, sub.Email)
		if err != nil {
			slog.Error("dispatch: failed idempotency check", "email", sub.Email, "err", err)
			continue
		}
		if existing != nil && existing.Status == dynamo.SendStatusSent {
			skipped++
			continue
		}

		// Generate unsubscribe token
		unsubToken, err := token.Sign(sub.Email, unsubscribeTTL, keys.Current)
		if err != nil {
			slog.Error("dispatch: failed to sign token", "email", sub.Email, "err", err)
			continue
		}

		unsubLink := fmt.Sprintf("%s/newsletter/unsubscribe?token=%s", siteURL, unsubToken)
		viewLink := detail.ViewInBrowserURL

		templateData, _ := json.Marshal(map[string]string{
			"name":               nameOrFallback(sub.Name),
			"unsubscribe_link":   unsubLink,
			"view_in_browser_url": viewLink,
		})

		batch = append(batch, sestypes.BulkEmailDestination{
			Destination: &sestypes.Destination{
				ToAddresses: []string{sub.Email},
			},
			ReplacementTemplateData: aws.String(string(templateData)),
		})

		if len(batch) == sesBatchSize {
			if err := flush(); err != nil {
				return fmt.Errorf("dispatch: flush batch: %w", err)
			}
		}
	}

	// Flush remainder
	if err := flush(); err != nil {
		return fmt.Errorf("dispatch: flush final batch: %w", err)
	}

	logger.Info("dispatch: send complete",
		"sent", sent,
		"skipped", skipped,
		"failed", failed,
		"total", len(subscribers),
	)
	return nil
}

// upsertTemplate creates or replaces the SES template for a campaign.
func upsertTemplate(ctx context.Context, name, subject, htmlBody, textBody string) error {
	tmpl := &sestypes.Template{
		TemplateName: aws.String(name),
		SubjectPart:  aws.String(subject),
		HtmlPart:     aws.String(htmlBody),
		TextPart:     aws.String(textBody),
	}

	// Try create first; if it already exists, update instead.
	_, err := sesClient.CreateTemplate(ctx, &ses.CreateTemplateInput{Template: tmpl})
	if err != nil {
		// UpdateTemplate if already exists
		_, updateErr := sesClient.UpdateTemplate(ctx, &ses.UpdateTemplateInput{Template: tmpl})
		if updateErr != nil {
			return fmt.Errorf("upsertTemplate: %w", updateErr)
		}
	}
	return nil
}

// sendBatch sends a single batch of up to 50 destinations.
func sendBatch(ctx context.Context, templateName string, batch []sestypes.BulkEmailDestination) ([]sestypes.BulkEmailDestinationStatus, error) {
	out, err := sesClient.SendBulkTemplatedEmail(ctx, &ses.SendBulkTemplatedEmailInput{
		Source:                   aws.String(senderEmail),
		Template:                 aws.String(templateName),
		DefaultTemplateData:      aws.String(`{"name":"there","unsubscribe_link":"","view_in_browser_url":""}`),
		Destinations:             batch,
	})
	if err != nil {
		return nil, fmt.Errorf("sendBatch: %w", err)
	}
	return out.Status, nil
}

func nameOrFallback(name string) string {
	if name == "" {
		return "there"
	}
	return name
}

func main() {
	lambda.Start(handler)
}
