// Package tickets allocates monotonic post IDs from DynamoDB.
package tickets

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	ddbtypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

const partitionKey = "post-ids"

// Client performs atomic counter increments against a DynamoDB table.
type Client struct {
	db        *dynamodb.Client
	tableName string
}

// NewClient returns a DynamoDB tickets client. region overrides cfg.Region when
// set (secondary Lambdas write to the primary table in us-east-1).
func NewClient(cfg aws.Config, tableName, region string) *Client {
	if region != "" {
		cfg.Region = region
	}
	return &Client{
		db:        dynamodb.NewFromConfig(cfg),
		tableName: tableName,
	}
}

// Next atomically increments the counter and returns the new ID.
func (c *Client) Next(ctx context.Context) (int64, error) {
	out, err := c.db.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(c.tableName),
		Key: map[string]ddbtypes.AttributeValue{
			"partition": &ddbtypes.AttributeValueMemberS{Value: partitionKey},
		},
		UpdateExpression: aws.String("SET #v = if_not_exists(#v, :start) + :inc"),
		ExpressionAttributeNames: map[string]string{
			"#v": "value",
		},
		ExpressionAttributeValues: map[string]ddbtypes.AttributeValue{
			":inc":   &ddbtypes.AttributeValueMemberN{Value: "1"},
			":start": &ddbtypes.AttributeValueMemberN{Value: "0"},
		},
		ReturnValues: ddbtypes.ReturnValueUpdatedNew,
	})
	if err != nil {
		return 0, fmt.Errorf("tickets.Next: %w", err)
	}

	attr, ok := out.Attributes["value"]
	if !ok {
		return 0, fmt.Errorf("tickets.Next: missing value attribute")
	}
	n, ok := attr.(*ddbtypes.AttributeValueMemberN)
	if !ok {
		return 0, fmt.Errorf("tickets.Next: value is not a number")
	}

	var id int64
	if _, err := fmt.Sscan(n.Value, &id); err != nil {
		return 0, fmt.Errorf("tickets.Next: parse value: %w", err)
	}
	return id, nil
}
