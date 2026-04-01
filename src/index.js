import Resolver from '@forge/resolver';
import { saveApiKey, hasApiKey, deleteApiKey, getApiKey } from './storage.js';
import { runPipeline } from './pipeline/runPipeline.js';

const resolver = new Resolver();

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

resolver.define('runTriage', async (req) => {
  const { bug, productContext, defectCriteria } = req.payload;
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key saved. Please configure your Anthropic API key in settings.');
  return await runPipeline(bug, productContext, defectCriteria, apiKey);
});

export const handler = resolver.getDefinitions();