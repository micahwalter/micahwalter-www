// Package dynamo provides typed DynamoDB clients for the newsletter_subscribers
// and newsletter_sends tables.
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
	SendStatusSent   = "SENT"
	SendStatusFailed = "FAILED"
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

// QueryActiveSubscribers returns all ACTIVE subscribers, paginated.
// It queries the StatusIndex GSI on newsletter_subscribers.
func (c *Client) QueryActiveSubscribers(ctx context.Context) ([]*Subscriber, error) {
	var subscribers []*Subscriber
	var lastKey map[string]ddbtypes.AttributeValue

	for {
		input := &dynamodb.QueryInput{
			TableName:              aws.String(c.tableName),
			IndexName:              aws.String("StatusIndex"),
			KeyConditionExpression: aws.String("#st = :status"),
			ExpressionAttributeNames: map[string]string{
				"#st": "status",
			},
			ExpressionAttributeValues: map[string]ddbtypes.AttributeValue{
				":status": &ddbtypes.AttributeValueMemberS{Value: StatusActive},
			},
			ExclusiveStartKey: lastKey,
		}

		result, err := c.db.Query(ctx, input)
		if err != nil {
			return nil, fmt.Errorf("dynamo.QueryActiveSubscribers: %w", err)
		}

		for _, item := range result.Items {
			var sub Subscriber
			if err := attributevalue.UnmarshalMap(item, &sub); err != nil {
				return nil, fmt.Errorf("dynamo.QueryActiveSubscribers unmarshal: %w", err)
			}
			subscribers = append(subscribers, &sub)
		}

		if result.LastEvaluatedKey == nil {
			break
		}
		lastKey = result.LastEvaluatedKey
	}

	return subscribers, nil
}

// ---------------------------------------------------------------------------
// newsletter_sends table
// ---------------------------------------------------------------------------

// SendRecord mirrors the newsletter_sends DynamoDB schema.
// PK: emailId (N), SK: email (S)
type SendRecord struct {
	EmailID       int    `dynamodbav:"emailId"`
	Email         string `dynamodbav:"email"`
	SentAt        string `dynamodbav:"sentAt,omitempty"`
	Status        string `dynamodbav:"status"`
	FailureReason string `dynamodbav:"failureReason,omitempty"`
}

// SendsClient wraps DynamoDB operations for the newsletter_sends table.
type SendsClient struct {
	db        *dynamodb.Client
	tableName string
}

// NewSendsClient returns a new SendsClient using the provided AWS config.
func NewSendsClient(cfg aws.Config, tableName string) *SendsClient {
	return &SendsClient{
		db:        dynamodb.NewFromConfig(cfg),
		tableName: tableName,
	}
}

// GetSend retrieves a send record for (emailId, email). Returns (nil, nil) when not found.
func (c *SendsClient) GetSend(ctx context.Context, emailID int, email string) (*SendRecord, error) {
	emailIDAttr, err := attributevalue.Marshal(emailID)
	if err != nil {
		return nil, fmt.Errorf("dynamo.GetSend marshal emailId: %w", err)
	}
	result, err := c.db.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(c.tableName),
		Key: map[string]ddbtypes.AttributeValue{
			"emailId": emailIDAttr,
			"email":   &ddbtypes.AttributeValueMemberS{Value: email},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("dynamo.GetSend: %w", err)
	}
	if result.Item == nil {
		return nil, nil
	}
	var rec SendRecord
	if err := attributevalue.UnmarshalMap(result.Item, &rec); err != nil {
		return nil, fmt.Errorf("dynamo.GetSend unmarshal: %w", err)
	}
	return &rec, nil
}

// PutSend writes a send record, replacing any existing item with the same (emailId, email).
func (c *SendsClient) PutSend(ctx context.Context, rec *SendRecord) error {
	item, err := attributevalue.MarshalMap(rec)
	if err != nil {
		return fmt.Errorf("dynamo.PutSend marshal: %w", err)
	}
	_, err = c.db.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(c.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("dynamo.PutSend: %w", err)
	}
	return nil
}
