import { fetch } from '@forge/api';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

/**
 * Makes a single call to the Anthropic API.
 * @param {string} prompt - The user message content
 * @param {string} apiKey - The Anthropic API key
 * @param {number} maxTokens
 * @returns {string} The text content of the response
 */
export async function callAnthropic(prompt, apiKey, maxTokens = 1024) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Parses a JSON response from the LLM, stripping markdown fencing if present.
 * @param {string} text
 * @returns {object}
 */
export function parseJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim());
}
