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

export async function deleteApiKey() {
  await kvs.deleteSecret(API_KEY_SECRET);
}

// Product context — stored as regular (non-secret) KVS entries

const KEYS = {
  userNeeds: 'product-user-needs',
  productRequirements: 'product-requirements',
  defectCriteria: 'product-defect-criteria',
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

export async function saveDefectCriteria(criteria) {
  await kvs.set(KEYS.defectCriteria, criteria);
}

export async function getDefectCriteria() {
  return await kvs.get(KEYS.defectCriteria) ?? { must_meet_both: [] };
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

export async function getProductContext() {
  const [userNeeds, productRequirements, defectCriteria] = await Promise.all([
    getUserNeeds(),
    getProductRequirements(),
    getDefectCriteria(),
  ]);
  return { userNeeds, productRequirements, defectCriteria };
}
