import { kvs } from '@forge/kvs';
import { DEFAULT_RISK_MATRIX } from './pipeline/riskMatrix.js';

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

export async function deleteApiKey() {
  await kvs.deleteSecret(API_KEY_SECRET);
}

// Product context — stored as regular (non-secret) KVS entries

const KEYS = {
  userNeeds: 'product-user-needs',
  productRequirements: 'product-requirements',
};

export async function saveUserNeeds(userNeeds) {
  await kvs.set(KEYS.userNeeds, userNeeds);
}

export async function getUserNeeds() {
  return await kvs.get(KEYS.userNeeds) ?? [];
}

export async function saveProductRequirements(requirements) {
  await kvs.set(KEYS.productRequirements, requirements);
}

export async function getProductRequirements() {
  return await kvs.get(KEYS.productRequirements) ?? [];
}


export async function saveProductInfo(productInfo) {
  await kvs.set('product-info', productInfo);
}

export async function getProductInfo() {
  return await kvs.get('product-info') ?? {
    name: 'MindBridge',
    type: 'regulated mental health Software as Medical Device (SaMD)',
    description: 'a CBT-based therapeutic chatbot',
  };
}

export async function savePostCommentSetting(enabled) {
  await kvs.set('setting-post-comment', enabled);
}

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

export async function saveProbabilityScale(scale) {
  await kvs.set('probability-scale', scale);
}

export async function getProbabilityScale() {
  return await kvs.get('probability-scale') ?? DEFAULT_PROBABILITY_SCALE;
}

export async function saveSeverityScale(scale) {
  await kvs.set('severity-scale', scale);
}

export async function getSeverityScale() {
  return await kvs.get('severity-scale') ?? DEFAULT_SEVERITY_SCALE;
}

export async function saveRiskMatrix(matrix) {
  await kvs.set('risk-matrix', matrix);
}

export async function getRiskMatrix() {
  return await kvs.get('risk-matrix') ?? DEFAULT_RISK_MATRIX;
}

export async function saveAdditionalContext(text) {
  await kvs.set('product-additional-context', text);
}

export async function getAdditionalContext() {
  return await kvs.get('product-additional-context') ?? '';
}

export async function getProductContext() {
  const [userNeeds, productRequirements, additionalContext] = await Promise.all([
    getUserNeeds(),
    getProductRequirements(),
    getAdditionalContext(),
  ]);
  return { userNeeds, productRequirements, additionalContext };
}
