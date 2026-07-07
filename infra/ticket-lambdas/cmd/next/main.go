package main

import (
	"context"
	"log/slog"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"

	"github.com/micahwalter/ticket-lambdas/internal/httpresp"
	"github.com/micahwalter/ticket-lambdas/internal/secrets"
	"github.com/micahwalter/ticket-lambdas/internal/sessiontoken"
	"github.com/micahwalter/ticket-lambdas/internal/tickets"
)

var (
	secClient    *secrets.Client
	ticketsClient *tickets.Client
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		slog.Error("failed to load AWS config", "err", err)
		os.Exit(1)
	}
	secClient = secrets.NewClient(cfg, os.Getenv("SECRET_ARN"))
	ticketsClient = tickets.NewClient(cfg, os.Getenv("DYNAMODB_TABLE_NAME"), os.Getenv("DYNAMODB_REGION"))
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	token := bearerToken(req.Headers)
	if token == "" {
		return httpresp.Message(401, "Authorization required"), nil
	}

	secret, err := secClient.Get(ctx)
	if err != nil {
		slog.Error("next: failed to load secrets", "err", err)
		return httpresp.Message(500, "Internal error"), nil
	}

	if err := sessiontoken.Verify(token, secret.HMAC); err != nil {
		return httpresp.Message(401, "Invalid or expired token"), nil
	}

	id, err := ticketsClient.Next(ctx)
	if err != nil {
		slog.Error("next: dynamodb increment failed", "err", err)
		return httpresp.Message(500, "Internal error"), nil
	}

	return httpresp.JSON(200, map[string]int64{"id": id}), nil
}

func bearerToken(headers map[string]string) string {
	auth := headers["authorization"]
	if auth == "" {
		auth = headers["Authorization"]
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(auth, prefix) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(auth, prefix))
}

func main() {
	lambda.Start(handler)
}
