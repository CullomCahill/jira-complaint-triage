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

/** Persists the list of user needs to KVS. */
export async function saveUserNeeds(userNeeds) {
  await kvs.set(KEYS.userNeeds, userNeeds);
}

/** Retrieves the stored user needs, defaulting to an empty array. */
export async function getUserNeeds() {
  return await kvs.get(KEYS.userNeeds) ?? [];
}

/** Persists the list of product requirements to KVS. */
export async function saveProductRequirements(requirements) {
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

/** Retrieves product metadata, defaulting to the MindBridge SaMD profile. */
export async function getProductInfo() {
  return await kvs.get('product-info') ?? {
    name: 'MindBridge',
    type: 'regulated mental health Software as Medical Device (SaMD)',
    description: 'a CBT-based therapeutic chatbot',
  };
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
  { label: 'Remote',    description: 'unlikely to occur' },
  { label: 'Low',       description: 'could occur but rare' },
  { label: 'Moderate',  description: 'may occur occasionally' },
  { label: 'High',      description: 'likely to occur' },
  { label: 'Very High', description: 'almost certain to occur' },
];

const DEFAULT_SEVERITY_SCALE = [
  { label: 'Negligible', description: 'no impact on therapeutic experience' },
  { label: 'Minor',      description: 'slight inconvenience, user can continue' },
  { label: 'Moderate',   description: 'disrupts session but user can recover' },
  { label: 'Major',      description: 'prevents therapeutic function or causes distress' },
  { label: 'Critical',   description: 'potential for clinical harm or safety event' },
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
