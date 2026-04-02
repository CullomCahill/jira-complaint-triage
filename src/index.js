import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import {
  saveApiKey, hasApiKey, deleteApiKey, getApiKey,
  saveUserNeeds, getUserNeeds,
  saveProductRequirements, getProductRequirements,
  saveDefectCriteria, getDefectCriteria,
  getProductContext,
} from './storage.js';
import { runPipeline } from './pipeline/runPipeline.js';

/**
 * Extracts plain text from Jira's Atlassian Document Format (ADF).
 */
function adfToText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.content) return node.content.map(adfToText).join('');
  return '';
}

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

resolver.define('getIssueData', async (req) => {
  const issueKey = req.context.extension.issue.key;

  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`);
  const data = await res.json();
  const f = data.fields;

  // Extract well-known fields with friendly names
  const bug = {
    id: issueKey,
    title: f.summary || '',
    description: adfToText(f.description),
    reported_by: f.reporter?.displayName || 'Unknown',
    date_reported: f.created ? f.created.split('T')[0] : '',
    issue_type: f.issuetype?.name || '',
    status: f.status?.name || '',
    priority: f.priority?.name || '',
    components: f.components?.map(c => c.name) || [],
    labels: f.labels || [],
  };

  // Append any custom fields that have values, using their raw key
  for (const [key, val] of Object.entries(f)) {
    if (!key.startsWith('customfield_') || val === null || val === undefined) continue;
    // Flatten simple values; skip deeply nested objects (e.g. ADF blocks)
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      bug[key] = val;
    } else if (val && typeof val === 'object' && 'value' in val) {
      bug[key] = val.value; // handles select/radio custom fields
    }
  }

  return bug;
});

resolver.define('getProductContext', async () => {
  return await getProductContext();
});

resolver.define('saveUserNeeds', async (req) => {
  await saveUserNeeds(req.payload.userNeeds);
  return { success: true };
});

resolver.define('saveProductRequirements', async (req) => {
  await saveProductRequirements(req.payload.productRequirements);
  return { success: true };
});

resolver.define('saveDefectCriteria', async (req) => {
  await saveDefectCriteria(req.payload.defectCriteria);
  return { success: true };
});

resolver.define('runTriage', async (req) => {
  const { bug, productContext, defectCriteria } = req.payload;
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key saved. Please configure your Anthropic API key in settings.');
  return await runPipeline(bug, productContext, defectCriteria, apiKey);
});

export const handler = resolver.getDefinitions();