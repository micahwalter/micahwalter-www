# Build + package the photo-upload Lambdas into a single deployment zip.
# All three functions (auth / init / process) share one zip and differ only by
# their Handler, so we build once.

DIST := dist
ZIP := $(DIST)/photo-upload.zip
# Lambda functions run on arm64; sharp ships platform-specific native binaries,
# so we must fetch the linux-arm64 build even when building on an x64 runner.
SHARP_VERSION := 0.34.5

.PHONY: build clean

build: clean
	npm install --omit=dev
	# Replace sharp with the linux/arm64 prebuilt binary for the Lambda runtime.
	rm -rf node_modules/sharp node_modules/@img
	npm install --omit=dev --os=linux --cpu=arm64 sharp@$(SHARP_VERSION)
	mkdir -p $(DIST)
	zip -rq $(ZIP) src node_modules
	@echo "Built $(ZIP) ($$(du -h $(ZIP) | cut -f1))"

clean:
	rm -rf $(DIST)
