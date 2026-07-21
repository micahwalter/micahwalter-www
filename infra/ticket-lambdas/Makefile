SHELL := /bin/bash
.DEFAULT_GOAL := help

PROFILE          ?= www
REGION           ?= us-east-1
SECONDARY_REGION ?= us-east-2
ARTIFACTS_BUCKET := micahwalter-newsletter-artifacts
ARTIFACTS_BUCKET_SECONDARY := micahwalter-newsletter-artifacts-secondary
ARTIFACTS_PREFIX := tickets/lambda

STACK_NAME           := micahwalter-tickets
STACK_NAME_SECONDARY := micahwalter-tickets-secondary

FUNCTIONS := auth next allocate

DIST := dist

.PHONY: build
build: ## Compile all Lambda functions for linux/arm64
	@mkdir -p $(DIST)
	@for fn in $(FUNCTIONS); do \
		echo "  building $$fn..."; \
		GOOS=linux GOARCH=arm64 go build -tags lambda.norpc \
			-o $(DIST)/$$fn/bootstrap \
			./cmd/$$fn/; \
		(cd $(DIST)/$$fn && zip -q ../$$fn.zip bootstrap); \
		echo "  -> dist/$$fn.zip"; \
	done
	@echo "Build complete."

.PHONY: upload
upload: ## Upload built zip files to the primary (us-east-1) artifacts S3 bucket
	@for fn in $(FUNCTIONS); do \
		echo "  uploading $$fn.zip..."; \
		AWS_PROFILE=$(PROFILE) aws s3 cp $(DIST)/$$fn.zip \
			s3://$(ARTIFACTS_BUCKET)/$(ARTIFACTS_PREFIX)/$$fn.zip \
			--region $(REGION); \
	done
	@echo "Upload complete."

.PHONY: upload-secondary
upload-secondary: ## Upload built zip files to the secondary (us-east-2) artifacts S3 bucket
	@for fn in $(FUNCTIONS); do \
		echo "  uploading $$fn.zip to secondary..."; \
		AWS_PROFILE=$(PROFILE) aws s3 cp $(DIST)/$$fn.zip \
			s3://$(ARTIFACTS_BUCKET_SECONDARY)/$(ARTIFACTS_PREFIX)/$$fn.zip \
			--region $(SECONDARY_REGION); \
	done
	@echo "Upload to secondary complete."

.PHONY: deploy
deploy: ## Deploy the primary tickets CloudFormation stack
	AWS_PROFILE=$(PROFILE) aws cloudformation deploy \
		--stack-name $(STACK_NAME) \
		--template-file ../tickets.yml \
		--region $(REGION) \
		--capabilities CAPABILITY_NAMED_IAM \
		--parameter-overrides \
			LambdaArtifactsBucket=$(ARTIFACTS_BUCKET) \
			LambdaArtifactsKeyPrefix=$(ARTIFACTS_PREFIX)

.PHONY: deploy-secondary
deploy-secondary: ## Deploy the secondary tickets CloudFormation stack
	AWS_PROFILE=$(PROFILE) aws cloudformation deploy \
		--stack-name $(STACK_NAME_SECONDARY) \
		--template-file ../tickets-secondary.yml \
		--region $(SECONDARY_REGION) \
		--capabilities CAPABILITY_NAMED_IAM \
		--parameter-overrides \
			LambdaArtifactsBucket=$(ARTIFACTS_BUCKET_SECONDARY) \
			LambdaArtifactsKeyPrefix=$(ARTIFACTS_PREFIX)

.PHONY: update-functions
update-functions: ## Build, upload, then force-update all Lambda function code (primary)
	$(MAKE) build
	$(MAKE) upload
	@for fn in $(FUNCTIONS); do \
		echo "  updating tickets-$$fn ($(REGION))..."; \
		AWS_PROFILE=$(PROFILE) aws lambda update-function-code \
			--function-name tickets-$$fn \
			--s3-bucket $(ARTIFACTS_BUCKET) \
			--s3-key $(ARTIFACTS_PREFIX)/$$fn.zip \
			--region $(REGION) \
			--no-cli-pager; \
	done

.PHONY: update-functions-secondary
update-functions-secondary: ## Build, upload, then force-update all secondary Lambda function code
	$(MAKE) build
	$(MAKE) upload-secondary
	@for fn in $(FUNCTIONS); do \
		echo "  updating tickets-$$fn ($(SECONDARY_REGION))..."; \
		AWS_PROFILE=$(PROFILE) aws lambda update-function-code \
			--function-name tickets-$$fn \
			--s3-bucket $(ARTIFACTS_BUCKET_SECONDARY) \
			--s3-key $(ARTIFACTS_PREFIX)/$$fn.zip \
			--region $(SECONDARY_REGION) \
			--no-cli-pager; \
	done

.PHONY: clean
clean: ## Remove build artifacts
	rm -rf $(DIST)

.PHONY: help
help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-26s\033[0m %s\n", $$1, $$2}'
