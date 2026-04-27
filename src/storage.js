import { kvs } from '@forge/kvs';
import { DEFAULT_RISK_MATRIX } from './pipeline/riskMatrix.js';

const API_KEY_SECRET = 'anthropic-api-key';

/** Stores the Anthropic API key as a KVS secret. */
export async function saveApiKey(apiKey) {
  await kvs.setSecret(API_KEY_SECRET, apiKey);
}

/** Retrieves the stored Anthropic API key. */
export async function getApiKey() {
  return await kvs.getSecret(API_KEY_SECRET);
}

/** Returns true if an Anthropic API key has been saved. */
export async function hasApiKey() {
  const key = await kvs.getSecret(API_KEY_SECRET);
  return key != null && key.length > 0;
}

/** Deletes the stored Anthropic API key. */
export async function deleteApiKey() {
  await kvs.deleteSecret(API_KEY_SECRET);
}

// Product context — stored as regular (non-secret) KVS entries

const KEYS = {
  userNeeds: 'product-user-needs',
  productRequirements: 'product-requirements',
};

/** Persists the list of user needs to KVS.
 * Throws a human-readable error if the payload exceeds Forge KVS limits (~64KB per key).
 */
export async function saveUserNeeds(userNeeds) {
  const bytes = JSON.stringify(userNeeds).length;
  if (bytes > 60000) throw new Error(`User Needs is too large to save (${Math.round(bytes / 1024)}KB). Forge Storage has a 64KB per-key limit. Reduce the number or length of entries.`);
  await kvs.set(KEYS.userNeeds, userNeeds);
}

/** Retrieves the stored user needs, defaulting to an empty array. */
export async function getUserNeeds() {
  return await kvs.get(KEYS.userNeeds) ?? [];
}

/** Persists the list of product requirements to KVS.
 * Throws a human-readable error if the payload exceeds Forge KVS limits (~64KB per key).
 */
export async function saveProductRequirements(requirements) {
  const bytes = JSON.stringify(requirements).length;
  if (bytes > 60000) throw new Error(`Product Requirements is too large to save (${Math.round(bytes / 1024)}KB). Forge Storage has a 64KB per-key limit. Reduce the number or length of entries.`);
  await kvs.set(KEYS.productRequirements, requirements);
}

/** Retrieves the stored product requirements, defaulting to an empty array. */
export async function getProductRequirements() {
  return await kvs.get(KEYS.productRequirements) ?? [];
}


/** Persists product metadata (name, type, description) to KVS. */
export async function saveProductInfo(productInfo) {
  await kvs.set('product-info', productInfo);
}

/** Retrieves product metadata. Returns empty strings if not yet configured. */
export async function getProductInfo() {
  return await kvs.get('product-info') ?? { name: '', type: '', description: '' };
}

/** Persists the "post comment after triage" toggle setting. */
export async function savePostCommentSetting(enabled) {
  await kvs.set('setting-post-comment', enabled);
}

/** Retrieves the post-comment setting, defaulting to true. */
export async function getPostCommentSetting() {
  const val = await kvs.get('setting-post-comment');
  return val ?? true; // default on
}

const DEFAULT_PROBABILITY_SCALE = [
  { label: 'Remote',    description: 'Theoretically possible but highly unlikely in practice. Would require an unusual or rare chain of events. No prior reports or known instances.' },
  { label: 'Low',       description: 'Could occur but infrequently. Affects a small subset of users or requires an edge-case configuration. Sporadic reports possible.' },
  { label: 'Moderate',  description: 'Occurs occasionally under known conditions. A recognizable usage pattern or scenario that a portion of users will encounter.' },
  { label: 'High',      description: 'Likely to occur in normal use. Affects a broad user population or triggers under common, predictable conditions.' },
  { label: 'Very High', description: 'Occurs frequently or consistently. Most or all users in the affected scenario will encounter this reliably.' },
];

const DEFAULT_SEVERITY_SCALE = [
  { label: 'Negligible',           description: 'No injury or inconvenience. User notices nothing or a trivial annoyance.' },
  { label: 'Minor',                description: 'Temporary, reversible harm. No medical intervention needed. This is where most mental health app issues land — a mood tracker glitches, CBT content does not load, etc.' },
  { label: 'Serious / Moderate',   description: 'Requires medical intervention, but not life-threatening. Reversible injury.' },
  { label: 'Critical / Severe',    description: 'Permanent or serious irreversible harm. Think significant psychological deterioration, missed critical clinical intervention.' },
  { label: 'Catastrophic',         description: 'Death or permanent severe disability.' },
];

/** Persists a custom probability scale to KVS. */
export async function saveProbabilityScale(scale) {
  await kvs.set('probability-scale', scale);
}

/** Retrieves the probability scale, defaulting to the 5-level Remote–Very High scale. */
export async function getProbabilityScale() {
  return await kvs.get('probability-scale') ?? DEFAULT_PROBABILITY_SCALE;
}

/** Persists a custom severity scale to KVS. */
export async function saveSeverityScale(scale) {
  await kvs.set('severity-scale', scale);
}

/** Retrieves the severity scale, defaulting to the 5-level Negligible–Critical scale. */
export async function getSeverityScale() {
  return await kvs.get('severity-scale') ?? DEFAULT_SEVERITY_SCALE;
}

/** Persists a custom 5×5 risk matrix to KVS. */
export async function saveRiskMatrix(matrix) {
  await kvs.set('risk-matrix', matrix);
}

/** Retrieves the risk matrix, defaulting to the ISO 14971-aligned DEFAULT_RISK_MATRIX. */
export async function getRiskMatrix() {
  return await kvs.get('risk-matrix') ?? DEFAULT_RISK_MATRIX;
}

/** Persists free-text additional product context used to inform triage prompts. */
export async function saveAdditionalContext(text) {
  await kvs.set('product-additional-context', text);
}

/** Retrieves the additional product context, defaulting to an empty string. */
export async function getAdditionalContext() {
  return await kvs.get('product-additional-context') ?? '';
}

/** Retrieves all product context fields (user needs, requirements, additional context) in one call. */
export async function getProductContext() {
  const [userNeeds, productRequirements, additionalContext] = await Promise.all([
    getUserNeeds(),
    getProductRequirements(),
    getAdditionalContext(),
  ]);
  return { userNeeds, productRequirements, additionalContext };
}
