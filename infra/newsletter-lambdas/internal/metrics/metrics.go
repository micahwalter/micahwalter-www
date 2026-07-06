package metrics

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	cwtypes "github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
)

const namespace = "Newsletter/Subscribe"

var (
	client *cloudwatch.Client
	once   sync.Once
)

// Init creates the CloudWatch client used for subscribe metrics.
func Init(cfg aws.Config) {
	once.Do(func() {
		client = cloudwatch.NewFromConfig(cfg)
	})
}

// PublishCount emits a count metric; failures are logged and ignored.
func PublishCount(ctx context.Context, metricName string) {
	if client == nil {
		return
	}

	_, err := client.PutMetricData(ctx, &cloudwatch.PutMetricDataInput{
		Namespace: aws.String(namespace),
		MetricData: []cwtypes.MetricDatum{
			{
				MetricName: aws.String(metricName),
				Value:      aws.Float64(1),
				Unit:       cwtypes.StandardUnitCount,
				Timestamp:  aws.Time(time.Now().UTC()),
			},
		},
	})
	if err != nil {
		slog.Warn("metrics: put failed", "metric", metricName, "err", err)
	}
}
