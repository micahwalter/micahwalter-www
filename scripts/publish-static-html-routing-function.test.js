const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildUpdateFunctionArgs } = require('./publish-static-html-routing-function');

describe('buildUpdateFunctionArgs', () => {
  it('passes function code as a fileb blob, not FunctionCode= shorthand', () => {
    const args = buildUpdateFunctionArgs({
      name: 'micahwalter-www-static-html-routing',
      etag: 'ETAG',
      comment: 'routing',
      runtime: 'cloudfront-js-1.0',
      codePath: '/tmp/static-html-routing.js',
    });
    const codeFlag = args.indexOf('--function-code');
    assert.ok(codeFlag >= 0);
    assert.equal(args[codeFlag + 1], 'fileb:///tmp/static-html-routing.js');
    assert.equal(
      args.some((arg) => String(arg).startsWith('FunctionCode=')),
      false,
    );
  });
});
