import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import {
  saveApiKey, hasApiKey, deleteApiKey, getApiKey,
  saveUserNeeds, getUserNeeds,
  saveProductRequirements, getProductRequirements,
  saveDefectCriteria, getDefectCriteria,
  getProductContext,
  savePostCommentSetting, getPostCommentSetting,
  saveProductInfo, getProductInfo,
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

/**
 * Builds an Atlassian Document Format (ADF) body for the risk assessment comment.
 */
function buildCommentAdf(report) {
  const t = (text, ...marks) => ({
    type: 'text',
    text,
    ...(marks.length ? { marks: marks.map(type => ({ type })) } : {}),
  });
  const para = (...content) => ({ type: 'paragraph', content });
  const rule = () => ({ type: 'rule' });
  const heading = (level, text) => ({ type: 'heading', attrs: { level }, content: [t(text)] });

  const refsBlock = (refs) => {
    if (!refs?.length) return [];
    return [
      rule(),
      heading(4, 'Evidence'),
      {
        type: 'bulletList',
        content: refs.map(r => ({
          type: 'listItem',
          content: [para(t(`${r.step} \u2014 ${r.source}: `, 'strong'), t(`\u201c${r.quote}\u201d`, 'em'))],
        })),
      },
    ];
  };

  if (report.classification === 'NON-DEFECT') {
    return {
      version: 1, type: 'doc',
      content: [
        { type: 'panel', attrs: { panelType: 'note' }, content: [para(t('NON-DEFECT', 'strong'))] },
        heading(3, `${report.bug_id} \u2014 Complaint Risk Assessment`),
        para(t(report.defect_summary)),
        para(t(report.disposition, 'em')),
        ...refsBlock(report.references),
        rule(),
        para(t(`Generated: ${new Date(report.generated_at).toLocaleString()}`, 'em')),
      ],
    };
  }

  const ra = report.risk_assessment;
  const panelTypeMap = { HIGH: 'error', MEDIUM: 'warning', LOW: 'success' };

  return {
    version: 1, type: 'doc',
    content: [
      {
        type: 'panel',
        attrs: { panelType: panelTypeMap[ra.risk_level] || 'info' },
        content: [para(t(`${ra.risk_level} RISK \u2014 Risk Score: ${ra.risk_score}`, 'strong'))],
      },
      heading(3, `${report.bug_id} \u2014 Complaint Risk Assessment`),
      para(t(report.defect_summary)),
      rule(),
      para(t('Disposition: ', 'strong'), t(report.disposition)),
      para(t('Failed Requirements: ', 'strong'), t(report.failed_requirements.join(', ') || 'None')),
      para(t('Failed User Needs: ', 'strong'), t(report.failed_user_needs.join(', ') || 'None')),
      rule(),
      para(t(`Probability: ${ra.probability_score} \u2014 ${ra.probability_label}`, 'strong')),
      para(t(ra.probability_rationale)),
      para(t(`Severity: ${ra.severity_score} \u2014 ${ra.severity_label}`, 'strong')),
      para(t(ra.severity_rationale)),
      ...refsBlock(report.references),
      rule(),
      para(t(`Generated: ${new Date(report.generated_at).toLocaleString()}`, 'em')),
    ],
  };
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

  const [issueRes, commentsRes] = await Promise.all([
    api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`),
    api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment?maxResults=50&orderBy=created`),
  ]);
  const data = await issueRes.json();
  const commentsData = await commentsRes.json();
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
    comments: (commentsData.comments || []).map(c => ({
      author: c.author?.displayName || 'Unknown',
      date: c.created ? c.created.split('T')[0] : '',
      body: adfToText(c.body),
    })),
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

resolver.define('getProductInfo', async () => {
  return await getProductInfo();
});

resolver.define('saveProductInfo', async (req) => {
  await saveProductInfo(req.payload);
  return { success: true };
});

resolver.define('getPostCommentSetting', async () => {
  return { enabled: await getPostCommentSetting() };
});

resolver.define('savePostCommentSetting', async (req) => {
  await savePostCommentSetting(req.payload.enabled);
  return { success: true };
});

resolver.define('runTriage', async (req) => {
  const issueKey = req.context.extension.issue.key;
  const { bug } = req.payload;
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key saved. Please configure your Anthropic API key in settings.');

  const { userNeeds, productRequirements, defectCriteria } = await getProductContext();

  if (!userNeeds.length || !productRequirements.length) {
    throw new Error('Product context not configured. Please add user needs and product requirements in Settings.');
  }
  if (!defectCriteria.must_meet_both?.length) {
    throw new Error('Defect criteria not configured. Please add defect criteria in Settings.');
  }

  const productContext = {
    user_needs: userNeeds,
    product_requirements: productRequirements,
  };

  const productInfo = await getProductInfo();

  const report = await runPipeline(bug, productContext, defectCriteria, apiKey, productInfo);

  const postCommentEnabled = await getPostCommentSetting();
  if (postCommentEnabled) {
    try {
      const commentRes = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: buildCommentAdf(report) }),
      });
      if (!commentRes.ok) {
        const errBody = await commentRes.text();
        console.error('Comment post failed:', commentRes.status, errBody);
      }
    } catch (e) {
      console.error('Failed to post risk assessment comment:', e);
    }
  }

  return report;
});

export const handler = resolver.getDefinitions();