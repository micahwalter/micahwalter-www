package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"

	"github.com/micahwalter/ticket-lambdas/internal/httpresp"
	"github.com/micahwalter/ticket-lambdas/internal/passcode"
	"github.com/micahwalter/ticket-lambdas/internal/secrets"
	"github.com/micahwalter/ticket-lambdas/internal/sessiontoken"
)

var (
	secClient *secrets.Client
	tokenTTL  time.Duration
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		slog.Error("failed to load AWS config", "err", err)
		os.Exit(1)
	}
	secClient = secrets.NewClient(cfg, os.Getenv("SECRET_ARN"))

	secs := 1800
	if v := os.Getenv("TOKEN_TTL"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			secs = n
		}
	}
	tokenTTL = time.Duration(secs) * time.Second
}

type authRequest struct {
	Passcode string `json:"passcode"`
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var body authRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return httpresp.Message(400, "Invalid request body"), nil
	}
	if body.Passcode == "" {
		return httpresp.Message(400, "Passcode is required"), nil
	}

	secret, err := secClient.Get(ctx)
	if err != nil {
		slog.Error("auth: failed to load secrets", "err", err)
		return httpresp.Message(500, "Internal error"), nil
	}

	if !passcode.Equal(body.Passcode, secret.Passcode) {
		time.Sleep(time.Second)
		return httpresp.Message(401, "Incorrect passcode"), nil
	}

	token, err := sessiontoken.Sign(secret.HMAC, tokenTTL)
	if err != nil {
		slog.Error("auth: failed to sign token", "err", err)
		return httpresp.Message(500, "Internal error"), nil
	}

	return httpresp.JSON(200, map[string]any{
		"token":     token,
		"expiresIn": int(tokenTTL.Seconds()),
	}), nil
}

func main() {
	lambda.Start(handler)
}
