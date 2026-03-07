package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	sestypes "github.com/aws/aws-sdk-go-v2/service/ses/types"

	evts "github.com/micahwalter/newsletter-lambdas/internal/events"
)

const (
	templateConfirmation = "newsletter-confirmation"
	templateWelcome      = "newsletter-welcome"
	templateGoodbye      = "newsletter-goodbye"
)

var (
	sesClient   *ses.Client
	senderEmail string
	siteURL     string
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		slog.Error("failed to load AWS config", "err", err)
		os.Exit(1)
	}
	sesClient = ses.NewFromConfig(cfg)
	senderEmail = os.Getenv("SENDER_EMAIL")
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
			slog.Error("email: failed to process SQS record",
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

	switch envelope.DetailType {
	case evts.DetailTypeSignupRequested, evts.DetailTypeConfirmationResent:
		return sendConfirmationEmail(ctx, envelope.Detail)
	case evts.DetailTypeSubscriberConfirmed:
		return sendWelcomeEmail(ctx, envelope.Detail)
	case evts.DetailTypeUnsubscribeRequested:
		return sendGoodbyeEmail(ctx, envelope.Detail)
	default:
		slog.Warn("email: unrecognised detail-type, skipping", "detail-type", envelope.DetailType)
		return nil
	}
}

func sendConfirmationEmail(ctx context.Context, raw json.RawMessage) error {
	var detail evts.SignupRequestedDetail
	if err := json.Unmarshal(raw, &detail); err != nil {
		return fmt.Errorf("unmarshal SignupRequested: %w", err)
	}

	confirmLink := fmt.Sprintf("%s/newsletter/confirm?token=%s", siteURL, detail.ConfirmationToken)

	templateData, _ := json.Marshal(map[string]string{
		"name":              nameOrFallback(detail.Name),
		"confirmation_link": confirmLink,
	})

	return sendTemplated(ctx, detail.Email, templateConfirmation, string(templateData))
}

func sendWelcomeEmail(ctx context.Context, raw json.RawMessage) error {
	var detail evts.SubscriberConfirmedDetail
	if err := json.Unmarshal(raw, &detail); err != nil {
		return fmt.Errorf("unmarshal SubscriberConfirmed: %w", err)
	}

	unsubLink := fmt.Sprintf("%s/newsletter/unsubscribe?token=%s", siteURL, detail.UnsubscribeToken)

	templateData, _ := json.Marshal(map[string]string{
		"name":             nameOrFallback(detail.Name),
		"unsubscribe_link": unsubLink,
	})

	return sendTemplated(ctx, detail.Email, templateWelcome, string(templateData))
}

func sendGoodbyeEmail(ctx context.Context, raw json.RawMessage) error {
	var detail evts.UnsubscribeRequestedDetail
	if err := json.Unmarshal(raw, &detail); err != nil {
		return fmt.Errorf("unmarshal UnsubscribeRequested: %w", err)
	}

	templateData, _ := json.Marshal(map[string]string{
		"name": nameOrFallback(detail.Name),
	})

	return sendTemplated(ctx, detail.Email, templateGoodbye, string(templateData))
}

func sendTemplated(ctx context.Context, toEmail, templateName, templateData string) error {
	_, err := sesClient.SendTemplatedEmail(ctx, &ses.SendTemplatedEmailInput{
		Source: aws.String(senderEmail),
		Destination: &sestypes.Destination{
			ToAddresses: []string{toEmail},
		},
		Template:     aws.String(templateName),
		TemplateData: aws.String(templateData),
	})
	if err != nil {
		return fmt.Errorf("SES SendTemplatedEmail (%s): %w", templateName, err)
	}
	slog.Info("email: sent", "template", templateName)
	return nil
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
