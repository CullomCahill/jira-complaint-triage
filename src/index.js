import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { saveApiKey, hasApiKey, deleteApiKey, getApiKey } from './storage.js';
import { callAnthropic } from './pipeline/anthropicClient.js';

const resolver = new Resolver();

resolver.define('fetchLabels', async (req) => {
  const key = req.context.extension.issue.key;

  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${key}?fields=labels`);

  const data = await res.json();

  const label = data.fields.labels;
  if (label == undefined) {
    console.warn(`${key}: Failed to find labels`);
    return [];
  }

  return label;
});

resolver.define('saveApiKey', async (req) => {
  const { apiKey } = req.payload;
  await saveApiKey(apiKey);
  return { success: true };
});

resolver.define('getApiKeyStatus', async () => {
  const exists = await hasApiKey();
  return { exists };
});

resolver.define('deleteApiKey', async () => {
  await deleteApiKey();
  return { success: true };
});

resolver.define('testAnthropicCall', async () => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key saved.');
  const response = await callAnthropic('Say "Forge connection successful!" and nothing else.', apiKey);
  return { response };
});

export const handler = resolver.getDefinitions();
