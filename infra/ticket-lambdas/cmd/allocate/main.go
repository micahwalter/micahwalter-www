package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"

	"github.com/micahwalter/ticket-lambdas/internal/httpresp"
	"github.com/micahwalter/ticket-lambdas/internal/tickets"
)

var ticketsClient *tickets.Client

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		slog.Error("failed to load AWS config", "err", err)
		os.Exit(1)
	}
	ticketsClient = tickets.NewClient(cfg, os.Getenv("DYNAMODB_TABLE_NAME"), os.Getenv("DYNAMODB_REGION"))
}

// HandleAllocate mints the next post id for IAM-authenticated callers.
// API Gateway must enforce AWS_IAM on POST /allocate; this handler does not
// load ticket-server-secrets or verify a Bearer token.
func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	id, err := ticketsClient.Next(ctx)
	if err != nil {
		slog.Error("allocate: dynamodb increment failed", "err", err)
		return httpresp.Message(500, "Internal error"), nil
	}

	slog.Info("allocate: issued id", "id", id, "requestId", req.RequestContext.RequestID)
	return httpresp.JSON(200, map[string]int64{"id": id}), nil
}

func main() {
	lambda.Start(handler)
}
