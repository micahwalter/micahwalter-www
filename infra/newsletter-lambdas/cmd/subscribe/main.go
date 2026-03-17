package main

import (
	"context"
	"encoding/json"
	"fmt"
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
	db         *dynamo.Client
	evtClient  *evts.Client
	secClient  *secrets.Client
	siteURL    string
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
	siteURL = os.Getenv("SITE_URL")
}

type subscribeRequest struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	Website string `json:"website"`
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var body subscribeRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return response(400, "Invalid request body"), nil
	}

	// Honeypot: real users never fill this hidden field; bots typically do.
	// Return a fake 202 to avoid alerting bot operators.
	if body.Website != "" {
		slog.Info("subscribe: honeypot triggered", "ip", req.RequestContext.HTTP.SourceIP)
		return response(202, "Check your inbox to confirm your subscription"), nil
	}

	email := strings.TrimSpace(strings.ToLower(body.Email))
	name := strings.TrimSpace(body.Name)

	if !validEmail(email) {
		return response(400, "Invalid email address"), nil
	}
	if name == "" {
		name = "there"
	}

	keys, err := secClient.Keys(ctx)
	if err != nil {
		slog.Error("subscribe: failed to load secrets", "err", err)
		return response(500, "Internal error"), nil
	}

	existing, err := db.Get(ctx, email)
	if err != nil {
		slog.Error("subscribe: DynamoDB get failed", "email", hashEmail(email), "err", err)
		return response(500, "Internal error"), nil
	}

	if existing != nil && existing.Status == dynamo.StatusActive {
		return response(409, "This email is already subscribed"), nil
	}

	confirmToken, err := token.Sign(email, 24*time.Hour, keys.Current)
	if err != nil {
		slog.Error("subscribe: token sign failed", "err", err)
		return response(500, "Internal error"), nil
	}

	now := time.Now().UTC().Format(time.RFC3339)
	ipAddress := req.RequestContext.HTTP.SourceIP

	if existing != nil && existing.Status == dynamo.StatusPending {
		// Resend: update token and re-emit ConfirmationResent
		sub := *existing
		sub.ConfirmationToken = confirmToken
		sub.SubscribedAt = now
		if err := db.Put(ctx, &sub); err != nil {
			slog.Error("subscribe: DynamoDB put (resend) failed", "email", hashEmail(email), "err", err)
			return response(500, "Internal error"), nil
		}
		if err := evtClient.EmitConfirmationResent(ctx, evts.ConfirmationResentDetail{
			Email:             email,
			Name:              name,
			ConfirmationToken: confirmToken,
		}); err != nil {
			slog.Error("subscribe: emit ConfirmationResent failed", "err", err)
			return response(500, "Internal error"), nil
		}
		slog.Info("subscribe: confirmation resent", "email", hashEmail(email))
		return response(202, "Check your inbox to confirm your subscription"), nil
	}

	// New subscriber or re-subscribe after unsubscribing
	sub := &dynamo.Subscriber{
		Email:             email,
		Name:              name,
		Status:            dynamo.StatusPending,
		ConfirmationToken: confirmToken,
		SubscribedAt:      now,
		Source:            "website-form",
		IPAddress:         ipAddress,
	}
	if err := db.Put(ctx, sub); err != nil {
		slog.Error("subscribe: DynamoDB put failed", "email", hashEmail(email), "err", err)
		return response(500, "Internal error"), nil
	}
	if err := evtClient.EmitSignupRequested(ctx, evts.SignupRequestedDetail{
		Email:             email,
		Name:              name,
		Source:            "website-form",
		IPAddress:         ipAddress,
		ConfirmationToken: confirmToken,
	}); err != nil {
		slog.Error("subscribe: emit SignupRequested failed", "err", err)
		return response(500, "Internal error"), nil
	}

	slog.Info("subscribe: signup requested", "email", hashEmail(email))
	return response(202, "Check your inbox to confirm your subscription"), nil
}

func main() {
	lambda.Start(handler)
}

// validEmail returns true if s is a syntactically valid email address.
func validEmail(s string) bool {
	_, err := mail.ParseAddress(s)
	return err == nil && strings.Contains(s, "@")
}

// hashEmail returns a short non-reversible identifier for log correlation
// without logging raw PII.
func hashEmail(email string) string {
	h := fmt.Sprintf("%x", []byte(email))
	if len(h) > 8 {
		return h[:8] + "..."
	}
	return h
}

func response(statusCode int, message string) events.APIGatewayV2HTTPResponse {
	body, _ := json.Marshal(map[string]string{"message": message})
	return events.APIGatewayV2HTTPResponse{
		StatusCode: statusCode,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       string(body),
	}
}
