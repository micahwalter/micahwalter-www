const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { extractCloudFrontFunctionCode } = require('./extract-from-template');

const TEMPLATE = fs.readFileSync(path.join(__dirname, '..', 'infra.yml'), 'utf8');

describe('extractCloudFrontFunctionCode', () => {
  it('extracts syntactically valid StaticHTMLRoutingFunction source under 10KB', () => {
    const src = extractCloudFrontFunctionCode(TEMPLATE, 'StaticHTMLRoutingFunction');
    assert.match(src, /^function handler\(event\) \{/);
    assert.match(src, /function isShareCrawler\(/);
    assert.match(src, /function rewriteShareCrawler\(/);
    assert.ok(Buffer.byteLength(src, 'utf8') < 10240, 'CloudFront Function max is 10KB');
    new vm.Script(src, { filename: 'StaticHTMLRoutingFunction.js' });
  });

  it('extracts the apex redirect function', () => {
    const src = extractCloudFrontFunctionCode(TEMPLATE, 'ApexRedirectFunction');
    assert.match(src, /function handler\(event\) \{/);
    new vm.Script(src, { filename: 'ApexRedirectFunction.js' });
  });
});
