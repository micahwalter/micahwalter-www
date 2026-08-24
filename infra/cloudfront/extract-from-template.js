/**
 * Pull AWS::CloudFront::Function source out of a CloudFormation YAML template.
 * Used by tests and by the infra-deploy Function publish fallback.
 */

function extractCloudFrontFunctionCode(yaml, logicalId) {
  const header = `  ${logicalId}:`;
  const start = yaml.indexOf(header);
  if (start === -1) {
    throw new Error(`CloudFormation resource ${logicalId} not found in template`);
  }

  const rest = yaml.slice(start);
  const codeKeyMatch = rest.match(/      FunctionCode: (?:!Sub )?\|\n/);
  if (!codeKeyMatch) {
    throw new Error(`FunctionCode block for ${logicalId} not found`);
  }

  const after = rest.slice(codeKeyMatch.index + codeKeyMatch[0].length);
  const end = after.indexOf('\n      FunctionConfig:');
  if (end === -1) {
    throw new Error(`FunctionConfig for ${logicalId} not found after FunctionCode`);
  }

  return after
    .slice(0, end)
    .split('\n')
    .map((line) => (line.startsWith('        ') ? line.slice(8) : line))
    .join('\n');
}

module.exports = { extractCloudFrontFunctionCode };
