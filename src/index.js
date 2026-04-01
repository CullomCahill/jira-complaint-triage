import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { saveApiKey, hasApiKey, deleteApiKey, getApiKey } from './storage.js';
import { callAnthropic } from './pipeline/anthropicClient.js';
import { classifyDefect } from './pipeline/defectClassification.js';
import { assessProbability } from './pipeline/probability.js';
import { assessSeverity } from './pipeline/severity.js';
import { calculateRisk } from './pipeline/riskScoring.js';

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

resolver.define('testDefectClassification', async () => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key saved.');

  const sampleBug = {
    id: 'BUG-201',
    title: 'Chatbot recommends breathing exercise during active panic disclosure',
    description: 'A user described an active panic attack in detail and the chatbot responded by suggesting a 4-7-8 breathing exercise. The clinical team flagged this because the breathing exercise module is designed for general relaxation, not acute panic intervention. The appropriate response should have been to acknowledge distress and offer grounding techniques or crisis resources.',
    component: 'AI/ML Algorithms',
    reported_by: 'Clinical Team',
    date_reported: '2025-02-08',
    in_released_product: true,
    related_feature: 'CBT thought challenging module',
  };

  const productContext = {
    user_needs: [
      { id: 'UN-002', description: 'User shall receive evidence-based CBT therapeutic exercises including thought challenging, cognitive distortion identification, and alternative thought generation.' },
      { id: 'UN-005', description: 'User shall be connected to crisis resources immediately when expressing distress or suicidal ideation.' },
      { id: 'UN-009', description: 'User shall be able to interact with the chatbot using natural language and receive contextually appropriate therapeutic responses.' },
    ],
    product_requirements: [
      { id: 'PR-003', description: 'The CBT thought challenging module shall guide the user through all required steps in sequence.', traces_to: 'UN-002' },
      { id: 'PR-005', description: 'The crisis detection algorithm shall identify crisis-related language and initiate the crisis escalation protocol within 2 seconds of detection.', traces_to: 'UN-005' },
      { id: 'PR-012', description: 'The sentiment analysis model shall accurately classify user emotional state, accounting for common linguistic patterns including sarcasm, minimization, and indirect expression of distress.', traces_to: 'UN-009' },
    ],
  };

  const defectCriteria = {
    must_meet_both: [
      'It is included in the released product (not deprecated or unreleased features)',
      'It is a deviation from the intended function of the core product (fails a User Need or Product Requirement)',
    ],
  };

  const result = await classifyDefect(sampleBug, productContext, defectCriteria, apiKey);
  return result;
});

resolver.define('testProbabilityAssessment', async () => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key saved.');

  const sampleBug = {
    id: 'BUG-201',
    title: 'Chatbot recommends breathing exercise during active panic disclosure',
    description: 'A user described an active panic attack in detail and the chatbot responded by suggesting a 4-7-8 breathing exercise. The clinical team flagged this because the breathing exercise module is designed for general relaxation, not acute panic intervention. The appropriate response should have been to acknowledge distress and offer grounding techniques or crisis resources.',
    component: 'AI/ML Algorithms',
    reported_by: 'Clinical Team',
    date_reported: '2025-02-08',
    in_released_product: true,
    related_feature: 'CBT thought challenging module',
  };

  const productContext = {
    user_needs: [
      { id: 'UN-002', description: 'User shall receive evidence-based CBT therapeutic exercises including thought challenging, cognitive distortion identification, and alternative thought generation.' },
      { id: 'UN-005', description: 'User shall be connected to crisis resources immediately when expressing distress or suicidal ideation.' },
      { id: 'UN-009', description: 'User shall be able to interact with the chatbot using natural language and receive contextually appropriate therapeutic responses.' },
    ],
    product_requirements: [
      { id: 'PR-003', description: 'The CBT thought challenging module shall guide the user through all required steps in sequence.', traces_to: 'UN-002' },
      { id: 'PR-005', description: 'The crisis detection algorithm shall identify crisis-related language and initiate the crisis escalation protocol within 2 seconds of detection.', traces_to: 'UN-005' },
      { id: 'PR-012', description: 'The sentiment analysis model shall accurately classify user emotional state, accounting for common linguistic patterns including sarcasm, minimization, and indirect expression of distress.', traces_to: 'UN-009' },
    ],
  };

  const defectCriteria = {
    must_meet_both: [
      'It is included in the released product (not deprecated or unreleased features)',
      'It is a deviation from the intended function of the core product (fails a User Need or Product Requirement)',
    ],
  };

  const defect = await classifyDefect(sampleBug, productContext, defectCriteria, apiKey);
  const probability = await assessProbability(defect, sampleBug, apiKey);
  return { defect, probability };
});

resolver.define('testSeverityAssessment', async () => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key saved.');

  const sampleBug = {
    id: 'BUG-201',
    title: 'Chatbot recommends breathing exercise during active panic disclosure',
    description: 'A user described an active panic attack in detail and the chatbot responded by suggesting a 4-7-8 breathing exercise. The clinical team flagged this because the breathing exercise module is designed for general relaxation, not acute panic intervention. The appropriate response should have been to acknowledge distress and offer grounding techniques or crisis resources.',
    component: 'AI/ML Algorithms',
    reported_by: 'Clinical Team',
    date_reported: '2025-02-08',
    in_released_product: true,
    related_feature: 'CBT thought challenging module',
  };

  const productContext = {
    user_needs: [
      { id: 'UN-002', description: 'User shall receive evidence-based CBT therapeutic exercises including thought challenging, cognitive distortion identification, and alternative thought generation.' },
      { id: 'UN-005', description: 'User shall be connected to crisis resources immediately when expressing distress or suicidal ideation.' },
      { id: 'UN-009', description: 'User shall be able to interact with the chatbot using natural language and receive contextually appropriate therapeutic responses.' },
    ],
    product_requirements: [
      { id: 'PR-003', description: 'The CBT thought challenging module shall guide the user through all required steps in sequence.', traces_to: 'UN-002' },
      { id: 'PR-005', description: 'The crisis detection algorithm shall identify crisis-related language and initiate the crisis escalation protocol within 2 seconds of detection.', traces_to: 'UN-005' },
      { id: 'PR-012', description: 'The sentiment analysis model shall accurately classify user emotional state, accounting for common linguistic patterns including sarcasm, minimization, and indirect expression of distress.', traces_to: 'UN-009' },
    ],
  };

  const defectCriteria = {
    must_meet_both: [
      'It is included in the released product (not deprecated or unreleased features)',
      'It is a deviation from the intended function of the core product (fails a User Need or Product Requirement)',
    ],
  };

  const defect = await classifyDefect(sampleBug, productContext, defectCriteria, apiKey);
  const [probability, severity] = await Promise.all([
    assessProbability(defect, sampleBug, apiKey),
    assessSeverity(defect, sampleBug, apiKey),
  ]);

  return { defect, probability, severity };
});

resolver.define('testRiskScoring', async () => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key saved.');

  const sampleBug = {
    id: 'BUG-201',
    title: 'Chatbot recommends breathing exercise during active panic disclosure',
    description: 'A user described an active panic attack in detail and the chatbot responded by suggesting a 4-7-8 breathing exercise. The clinical team flagged this because the breathing exercise module is designed for general relaxation, not acute panic intervention. The appropriate response should have been to acknowledge distress and offer grounding techniques or crisis resources.',
    component: 'AI/ML Algorithms',
    reported_by: 'Clinical Team',
    date_reported: '2025-02-08',
    in_released_product: true,
    related_feature: 'CBT thought challenging module',
  };

  const productContext = {
    user_needs: [
      { id: 'UN-002', description: 'User shall receive evidence-based CBT therapeutic exercises including thought challenging, cognitive distortion identification, and alternative thought generation.' },
      { id: 'UN-005', description: 'User shall be connected to crisis resources immediately when expressing distress or suicidal ideation.' },
      { id: 'UN-009', description: 'User shall be able to interact with the chatbot using natural language and receive contextually appropriate therapeutic responses.' },
    ],
    product_requirements: [
      { id: 'PR-003', description: 'The CBT thought challenging module shall guide the user through all required steps in sequence.', traces_to: 'UN-002' },
      { id: 'PR-005', description: 'The crisis detection algorithm shall identify crisis-related language and initiate the crisis escalation protocol within 2 seconds of detection.', traces_to: 'UN-005' },
      { id: 'PR-012', description: 'The sentiment analysis model shall accurately classify user emotional state, accounting for common linguistic patterns including sarcasm, minimization, and indirect expression of distress.', traces_to: 'UN-009' },
    ],
  };

  const defectCriteria = {
    must_meet_both: [
      'It is included in the released product (not deprecated or unreleased features)',
      'It is a deviation from the intended function of the core product (fails a User Need or Product Requirement)',
    ],
  };

  const defect = await classifyDefect(sampleBug, productContext, defectCriteria, apiKey);
  const [probability, severity] = await Promise.all([
    assessProbability(defect, sampleBug, apiKey),
    assessSeverity(defect, sampleBug, apiKey),
  ]);
  const report = calculateRisk(defect, probability, severity);

  return report;
});

export const handler = resolver.getDefinitions();
