package main

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/mail"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"

	"github.com/micahwalter/newsletter-lambdas/internal/dynamo"
	evts "github.com/micahwalter/newsletter-lambdas/internal/events"
	"github.com/micahwalter/newsletter-lambdas/internal/secrets"
	"github.com/micahwalter/newsletter-lambdas/internal/token"
)

var (
	db        *dynamo.Client
	evtClient *evts.Client
	secClient *secrets.Client
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		slog.Error("failed to load AWS config", "err", err)
		os.Exit(1)
	}
	db = dynamo.NewClient(cfg, os.Getenv("DYNAMODB_TABLE_NAME"))
	evtClient = evts.NewClient(cfg, os.Getenv("EVENT_BUS_NAME"))
	secClient = secrets.NewClient(cfg, os.Getenv("HMAC_SECRET_ARN"))
}

type unsubscribeRequest struct {
	Token string `json:"token,omitempty"`
	Email string `json:"email,omitempty"`
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var body unsubscribeRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return response(400, "Invalid request body"), nil
	}

	var email, via string

	switch {
	case strings.TrimSpace(body.Token) != "":
		// Path A — signed link from email
		keys, err := secClient.Keys(ctx)
		if err != nil {
			slog.Error("unsubscribe: failed to load secrets", "err", err)
			return response(500, "Internal error"), nil
		}
		resolved, err := token.Verify(strings.TrimSpace(body.Token), keys.Current, keys.Previous)
		if err != nil {
			if errors.Is(err, token.ErrExpired) {
				return response(400, "Unsubscribe link has expired — please use the form to unsubscribe"), nil
			}
			return response(400, "Invalid unsubscribe link"), nil
		}
		email = resolved
		via = "email-link"

	case strings.TrimSpace(body.Email) != "":
		// Path B — manual form submission
		email = strings.TrimSpace(strings.ToLower(body.Email))
		if !validEmail(email) {
			return response(400, "Invalid email address"), nil
		}
		via = "manual-form"

	default:
		return response(400, "Token or email is required"), nil
	}

	sub, err := db.Get(ctx, email)
	if err != nil {
		slog.Error("unsubscribe: DynamoDB get failed", "err", err)
		return response(500, "Internal error"), nil
	}

	// Idempotent and non-revealing: return 200 regardless of whether the record
	// exists or is already unsubscribed. Do not reveal record existence.
	if sub == nil || sub.Status == dynamo.StatusUnsubscribed {
		return response(200, "You have been unsubscribed"), nil
	}

	unsubscribedAt := time.Now().UTC().Format(time.RFC3339)

	if err := db.UnsubscribeSubscriber(ctx, email, unsubscribedAt); err != nil {
		slog.Error("unsubscribe: DynamoDB update failed", "err", err)
		return response(500, "Internal error"), nil
	}

	if err := evtClient.EmitUnsubscribeRequested(ctx, evts.UnsubscribeRequestedDetail{
		Email:          email,
		Name:           sub.Name,
		UnsubscribedAt: unsubscribedAt,
		Via:            via,
	}); err != nil {
		slog.Error("unsubscribe: emit UnsubscribeRequested failed", "err", err)
		// Don't fail — subscriber is already unsubscribed in DynamoDB.
	}

	slog.Info("unsubscribe: subscriber unsubscribed", "via", via)
	return response(200, "You have been unsubscribed"), nil
}

func main() {
	lambda.Start(handler)
}

func validEmail(s string) bool {
	_, err := mail.ParseAddress(s)
	return err == nil && strings.Contains(s, "@")
}

func response(statusCode int, message string) events.APIGatewayV2HTTPResponse {
	body, _ := json.Marshal(map[string]string{"message": message})
	return events.APIGatewayV2HTTPResponse{
		StatusCode: statusCode,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       string(body),
	}
}
