import { kvs } from '@forge/kvs';

const API_KEY_SECRET = 'anthropic-api-key';

export async function saveApiKey(apiKey) {
  await kvs.setSecret(API_KEY_SECRET, apiKey);
}

export async function getApiKey() {
  return await kvs.getSecret(API_KEY_SECRET);
}

export async function hasApiKey() {
  const key = await kvs.getSecret(API_KEY_SECRET);
  return key != null && key.length > 0;
}
