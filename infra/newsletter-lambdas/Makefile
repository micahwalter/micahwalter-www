SHELL := /bin/bash
.DEFAULT_GOAL := help

PROFILE       ?= www
REGION        ?= us-east-1
ARTIFACTS_BUCKET := micahwalter-newsletter-artifacts
ARTIFACTS_PREFIX := newsletter/lambda

BOOTSTRAP_STACK := micahwalter-newsletter-bootstrap
STACK_NAME      := micahwalter-newsletter

FUNCTIONS := subscribe confirm unsubscribe email dispatch formtoken

DIST := dist

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

.PHONY: upload
upload: ## Upload built zip files to the artifacts S3 bucket
	@for fn in $(FUNCTIONS); do \
		echo "  uploading $$fn.zip..."; \
		AWS_PROFILE=$(PROFILE) aws s3 cp $(DIST)/$$fn.zip \
			s3://$(ARTIFACTS_BUCKET)/$(ARTIFACTS_PREFIX)/$$fn.zip \
			--region $(REGION); \
	done
	@echo "Upload complete."

# ---------------------------------------------------------------------------
# Deploy bootstrap stack (run once to create the artifacts bucket)
# ---------------------------------------------------------------------------

.PHONY: deploy-bootstrap
deploy-bootstrap: ## Deploy the bootstrap stack (creates the artifacts S3 bucket)
	AWS_PROFILE=$(PROFILE) aws cloudformation deploy \
		--stack-name $(BOOTSTRAP_STACK) \
		--template-file ../newsletter-bootstrap.yml \
		--region $(REGION) \
		--capabilities CAPABILITY_NAMED_IAM
	@echo "Bootstrap stack deployed. Bucket: $(ARTIFACTS_BUCKET)"

# ---------------------------------------------------------------------------
# Deploy main stack
# ---------------------------------------------------------------------------

.PHONY: deploy
deploy: ## Deploy the main newsletter CloudFormation stack
	AWS_PROFILE=$(PROFILE) aws cloudformation deploy \
		--stack-name $(STACK_NAME) \
		--template-file ../newsletter.yml \
		--region $(REGION) \
		--capabilities CAPABILITY_NAMED_IAM \
		--parameter-overrides \
			LambdaArtifactsBucket=$(ARTIFACTS_BUCKET) \
			LambdaArtifactsKeyPrefix=$(ARTIFACTS_PREFIX)
	@echo ""
	@echo "Stack deployed. API endpoint:"
	@AWS_PROFILE=$(PROFILE) aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
		--output text

# ---------------------------------------------------------------------------
# Update Lambdas only (faster than full stack deploy when only code changed)
# ---------------------------------------------------------------------------

.PHONY: update-functions
update-functions: ## Build, upload, then force-update all Lambda function code
	$(MAKE) build
	$(MAKE) upload
	@for fn in $(FUNCTIONS); do \
		echo "  updating newsletter-$$fn..."; \
		AWS_PROFILE=$(PROFILE) aws lambda update-function-code \
			--function-name newsletter-$$fn \
			--s3-bucket $(ARTIFACTS_BUCKET) \
			--s3-key $(ARTIFACTS_PREFIX)/$$fn.zip \
			--region $(REGION) \
			--no-cli-pager; \
	done
	@echo "Function code updated."

# ---------------------------------------------------------------------------
# Show outputs
# ---------------------------------------------------------------------------

.PHONY: outputs
outputs: ## Print CloudFormation stack outputs
	@AWS_PROFILE=$(PROFILE) aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query "Stacks[0].Outputs" \
		--output table

# ---------------------------------------------------------------------------
# Clean
# ---------------------------------------------------------------------------

.PHONY: clean
clean: ## Remove build artifacts
	rm -rf $(DIST)

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

.PHONY: help
help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
