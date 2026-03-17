package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"

	"github.com/micahwalter/newsletter-lambdas/internal/formtoken"
	"github.com/micahwalter/newsletter-lambdas/internal/secrets"
)

var secClient *secrets.Client

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		slog.Error("failed to load AWS config", "err", err)
		os.Exit(1)
	}
	secClient = secrets.NewClient(cfg, os.Getenv("HMAC_SECRET_ARN"))
}

func handler(ctx context.Context, _ events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	keys, err := secClient.Keys(ctx)
	if err != nil {
		slog.Error("formtoken: failed to load secrets", "err", err)
		return response(500, "Internal error"), nil
	}

	tok, err := formtoken.Issue(keys.Current)
	if err != nil {
		slog.Error("formtoken: failed to issue token", "err", err)
		return response(500, "Internal error"), nil
	}

	body, _ := json.Marshal(map[string]string{"token": tok})
	return events.APIGatewayV2HTTPResponse{
		StatusCode: 200,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       string(body),
	}, nil
}

func main() {
	lambda.Start(handler)
}

func response(statusCode int, message string) events.APIGatewayV2HTTPResponse {
	body, _ := json.Marshal(map[string]string{"message": message})
	return events.APIGatewayV2HTTPResponse{
		StatusCode: statusCode,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       string(body),
	}
}
