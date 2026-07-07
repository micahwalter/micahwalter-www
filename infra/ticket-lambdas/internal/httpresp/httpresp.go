package httpresp

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

// JSON returns an API Gateway HTTP response with a JSON body.
func JSON(statusCode int, body any) events.APIGatewayV2HTTPResponse {
	b, _ := json.Marshal(body)
	return events.APIGatewayV2HTTPResponse{
		StatusCode: statusCode,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       string(b),
	}
}

// Message returns a JSON { "message": "..." } response.
func Message(statusCode int, message string) events.APIGatewayV2HTTPResponse {
	return JSON(statusCode, map[string]string{"message": message})
}
