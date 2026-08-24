#!/usr/bin/env node
/**
 * Publish StaticHTMLRoutingFunction from infra/infra.yml via the CloudFront
 * API. CloudFormation stack updates that only change Function code still
 * PATCH the distribution, which has failed this workflow before. Updating
 * the Function in place does not require a distribution update.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { extractCloudFrontFunctionCode } = require('../infra/cloudfront/extract-from-template');

const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'infra', 'infra.yml');
const DEFAULT_NAME = 'micahwalter-www-static-html-routing';

function awsJson(args) {
  const result = spawnSync('aws', args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || '').trim();
    const error = new Error(err || `aws ${args.join(' ')} failed (${result.status})`);
    error.exitCode = result.status;
    throw error;
  }
  return result.stdout ? JSON.parse(result.stdout) : {};
}

function resolveFunctionName() {
  if (process.env.CLOUDFRONT_FUNCTION_NAME) {
    return process.env.CLOUDFRONT_FUNCTION_NAME;
  }
  try {
    awsJson(['cloudfront', 'describe-function', '--name', DEFAULT_NAME]);
    return DEFAULT_NAME;
  } catch (err) {
    const listed = awsJson(['cloudfront', 'list-functions']);
    const items = listed.FunctionList?.Items || [];
    const match = items.find((item) => String(item.Name).endsWith('static-html-routing'));
    if (!match) {
      throw new Error(
        `CloudFront Function ${DEFAULT_NAME} not found. ${err.message}\nAvailable: ${items.map((i) => i.Name).join(', ') || '(none)'}`,
      );
    }
    return match.Name;
  }
}

function main() {
  const yaml = fs.readFileSync(TEMPLATE, 'utf8');
  const source = extractCloudFrontFunctionCode(yaml, 'StaticHTMLRoutingFunction');
  new vm.Script(source, { filename: 'StaticHTMLRoutingFunction.js' });
  const size = Buffer.byteLength(source, 'utf8');
  if (size > 10240) {
    throw new Error(`Function source is ${size} bytes; CloudFront limit is 10240`);
  }

  const codePath = path.join('/tmp', 'static-html-routing.js');
  fs.writeFileSync(codePath, source);

  const name = resolveFunctionName();
  const described = awsJson(['cloudfront', 'describe-function', '--name', name]);
  const etag = described.ETag;
  const config = described.FunctionSummary.FunctionConfig;
  const comment = config.Comment || 'Static HTML routing';
  const runtime = config.Runtime || 'cloudfront-js-1.0';

  console.log(`Updating CloudFront Function ${name} (${size} bytes, runtime ${runtime})`);
  const updated = awsJson([
    'cloudfront',
    'update-function',
    '--name',
    name,
    '--if-match',
    etag,
    '--function-config',
    JSON.stringify({ Comment: comment, Runtime: runtime }),
    '--function-code',
    `FunctionCode=fileb://${codePath}`,
  ]);
  const newEtag = updated.ETag;
  console.log(`Publishing ${name} (ETag ${newEtag})`);
  awsJson(['cloudfront', 'publish-function', '--name', name, '--if-match', newEtag]);
  console.log(`Published CloudFront Function ${name}`);
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
