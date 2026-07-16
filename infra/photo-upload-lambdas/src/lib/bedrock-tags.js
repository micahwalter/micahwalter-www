/**
 * Bedrock vision tags — same intent as scripts/tag-photos.js.
 */

const {
  BedrockRuntimeClient,
  ConverseCommand,
} = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({});
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-6';

const PROMPT = `Analyze this photo and suggest 3-8 relevant tags that describe:
- Main subject matter (people, objects, animals, architecture, etc.)
- Location type (urban, nature, indoor, outdoor, beach, mountain, etc.)
- Mood/atmosphere (serene, dramatic, vibrant, peaceful, energetic, etc.)
- Visual style (minimalist, colorful, black-and-white, vintage, etc.)
- Notable features (sunset, reflection, pattern, texture, bokeh, etc.)

Provide ONLY the tags as a comma-separated list, lowercase, using hyphens for multi-word tags.
Example format: street-photography, urban, night, city-lights, noir

Tags:`;

function imageFormat(contentType, key) {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('png') || (key && key.endsWith('.png'))) return 'png';
  if (ct.includes('webp') || (key && key.endsWith('.webp'))) return 'webp';
  if (ct.includes('gif') || (key && key.endsWith('.gif'))) return 'gif';
  return 'jpeg';
}

/**
 * @param {Buffer} imageBuffer
 * @param {{ contentType?: string, key?: string }} meta
 * @returns {Promise<string[]>}
 */
async function suggestTags(imageBuffer, meta = {}) {
  try {
    const format = imageFormat(meta.contentType, meta.key);
    const command = new ConverseCommand({
      modelId: MODEL_ID,
      messages: [
        {
          role: 'user',
          content: [
            {
              image: {
                format,
                source: { bytes: imageBuffer },
              },
            },
            { text: PROMPT },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 1024 },
    });

    const response = await client.send(command);
    const responseText = (response.output?.message?.content || [])
      .map((c) => c.text || '')
      .join(' ')
      .trim();

    return responseText
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0 && tag.length < 30);
  } catch (err) {
    console.error('Bedrock tagging failed:', err.message);
    return [];
  }
}

module.exports = { suggestTags, imageFormat, MODEL_ID };
