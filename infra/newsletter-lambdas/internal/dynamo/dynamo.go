// Package dynamo provides a typed DynamoDB client for the newsletter_subscribers table.
package dynamo

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	ddbtypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

const (
	StatusPending      = "PENDING"
	StatusActive       = "ACTIVE"
	StatusUnsubscribed = "UNSUBSCRIBED"
)

// Subscriber mirrors the newsletter_subscribers DynamoDB schema.
type Subscriber struct {
	Email             string `dynamodbav:"email"`
	Name              string `dynamodbav:"name,omitempty"`
	Status            string `dynamodbav:"status"`
	ConfirmationToken string `dynamodbav:"confirmation_token,omitempty"`
	SubscribedAt      string `dynamodbav:"subscribed_at,omitempty"`
	ConfirmedAt       string `dynamodbav:"confirmed_at,omitempty"`
	UnsubscribedAt    string `dynamodbav:"unsubscribed_at,omitempty"`
	Source            string `dynamodbav:"source,omitempty"`
	IPAddress         string `dynamodbav:"ip_address,omitempty"`
}

// Client wraps the DynamoDB SDK client with newsletter-specific operations.
type Client struct {
	db        *dynamodb.Client
	tableName string
}

// NewClient returns a new DynamoDB client using the provided AWS config.
func NewClient(cfg aws.Config, tableName string) *Client {
	return &Client{
		db:        dynamodb.NewFromConfig(cfg),
		tableName: tableName,
	}
}

// Get retrieves a subscriber by email. Returns (nil, nil) when not found.
func (c *Client) Get(ctx context.Context, email string) (*Subscriber, error) {
	result, err := c.db.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(c.tableName),
		Key: map[string]ddbtypes.AttributeValue{
			"email": &ddbtypes.AttributeValueMemberS{Value: email},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("dynamo.Get: %w", err)
	}
	if result.Item == nil {
		return nil, nil
	}
	var sub Subscriber
	if err := attributevalue.UnmarshalMap(result.Item, &sub); err != nil {
		return nil, fmt.Errorf("dynamo.Get unmarshal: %w", err)
	}
	return &sub, nil
}

// Put writes a subscriber record, replacing any existing item with the same email.
func (c *Client) Put(ctx context.Context, sub *Subscriber) error {
	item, err := attributevalue.MarshalMap(sub)
	if err != nil {
		return fmt.Errorf("dynamo.Put marshal: %w", err)
	}
	_, err = c.db.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(c.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("dynamo.Put: %w", err)
	}
	return nil
}

// ActivateSubscriber transitions a subscriber to ACTIVE, writing confirmed_at
// and removing the confirmation_token.
func (c *Client) ActivateSubscriber(ctx context.Context, email, confirmedAt string) error {
	_, err := c.db.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(c.tableName),
		Key: map[string]ddbtypes.AttributeValue{
			"email": &ddbtypes.AttributeValueMemberS{Value: email},
		},
		UpdateExpression: aws.String(
			"SET #st = :status, confirmed_at = :confirmed_at REMOVE confirmation_token",
		),
		ExpressionAttributeNames: map[string]string{
			"#st": "status", // status is a DynamoDB reserved word
		},
		ExpressionAttributeValues: map[string]ddbtypes.AttributeValue{
			":status":       &ddbtypes.AttributeValueMemberS{Value: StatusActive},
			":confirmed_at": &ddbtypes.AttributeValueMemberS{Value: confirmedAt},
		},
	})
	if err != nil {
		return fmt.Errorf("dynamo.ActivateSubscriber: %w", err)
	}
	return nil
}

// UnsubscribeSubscriber transitions a subscriber to UNSUBSCRIBED, writing unsubscribed_at.
func (c *Client) UnsubscribeSubscriber(ctx context.Context, email, unsubscribedAt string) error {
	_, err := c.db.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(c.tableName),
		Key: map[string]ddbtypes.AttributeValue{
			"email": &ddbtypes.AttributeValueMemberS{Value: email},
		},
		UpdateExpression: aws.String(
			"SET #st = :status, unsubscribed_at = :unsubscribed_at",
		),
		ExpressionAttributeNames: map[string]string{
			"#st": "status",
		},
		ExpressionAttributeValues: map[string]ddbtypes.AttributeValue{
			":status":          &ddbtypes.AttributeValueMemberS{Value: StatusUnsubscribed},
			":unsubscribed_at": &ddbtypes.AttributeValueMemberS{Value: unsubscribedAt},
		},
	})
	if err != nil {
		return fmt.Errorf("dynamo.UnsubscribeSubscriber: %w", err)
	}
	return nil
}
