package main

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
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

type confirmRequest struct {
	Token string `json:"token"`
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var body confirmRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return response(400, "Invalid request body"), nil
	}

	tokenStr := strings.TrimSpace(body.Token)
	if tokenStr == "" {
		return response(400, "Token is required"), nil
	}

	keys, err := secClient.Keys(ctx)
	if err != nil {
		slog.Error("confirm: failed to load secrets", "err", err)
		return response(500, "Internal error"), nil
	}

	email, err := token.Verify(tokenStr, keys.Current, keys.Previous)
	if err != nil {
		if errors.Is(err, token.ErrExpired) {
			return response(410, "Confirmation link has expired — please subscribe again"), nil
		}
		return response(400, "Invalid confirmation link — please subscribe again"), nil
	}

	sub, err := db.Get(ctx, email)
	if err != nil {
		slog.Error("confirm: DynamoDB get failed", "err", err)
		return response(500, "Internal error"), nil
	}

	// Idempotent: already confirmed
	if sub != nil && sub.Status == dynamo.StatusActive {
		return response(200, "Subscription confirmed"), nil
	}

	if sub == nil || sub.Status != dynamo.StatusPending {
		// Token is valid but subscriber is gone or unsubscribed — treat as invalid
		return response(400, "Invalid confirmation link — please subscribe again"), nil
	}

	confirmedAt := time.Now().UTC().Format(time.RFC3339)

	// Generate a 90-day unsubscribe token to include in the welcome email
	unsubToken, err := token.Sign(email, 90*24*time.Hour, keys.Current)
	if err != nil {
		slog.Error("confirm: unsubscribe token sign failed", "err", err)
		return response(500, "Internal error"), nil
	}

	if err := db.ActivateSubscriber(ctx, email, confirmedAt); err != nil {
		slog.Error("confirm: DynamoDB activate failed", "err", err)
		return response(500, "Internal error"), nil
	}

	if err := evtClient.EmitSubscriberConfirmed(ctx, evts.SubscriberConfirmedDetail{
		Email:            email,
		Name:             sub.Name,
		ConfirmedAt:      confirmedAt,
		UnsubscribeToken: unsubToken,
	}); err != nil {
		slog.Error("confirm: emit SubscriberConfirmed failed", "err", err)
		// Don't fail the request — the subscriber is confirmed in DynamoDB.
		// The welcome email will be missed but the subscription is valid.
	}

	slog.Info("confirm: subscriber confirmed", "email", hashEmail(email))
	return response(200, "Subscription confirmed"), nil
}

func main() {
	lambda.Start(handler)
}

func hashEmail(email string) string {
	h := []byte(email)
	if len(h) > 4 {
		return string(h[:4]) + "..."
	}
	return string(h)
}

func response(statusCode int, message string) events.APIGatewayV2HTTPResponse {
	body, _ := json.Marshal(map[string]string{"message": message})
	return events.APIGatewayV2HTTPResponse{
		StatusCode: statusCode,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       string(body),
	}
}
