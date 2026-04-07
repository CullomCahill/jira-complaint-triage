jest.mock('../anthropicClient.js', () => ({
  callAnthropic: jest.fn(),
  parseJsonResponse: jest.requireActual('../anthropicClient.js').parseJsonResponse,
}));

import { assessProbability } from '../probability.js';
import { callAnthropic } from '../anthropicClient.js';

const DEFECT = {
  bug_id: 'TEST-001',
  summary: 'Login fails on iOS 17, blocking core workflows.',
  failed_requirements: ['PR-01'],
};

const BUG = {
  id: 'TEST-001',
  title: 'Login fails on iOS 17',
  description: 'Users on iOS 17 cannot log in.',
  component: 'Authentication',
  reported_by: 'test@example.com',
  comments: [],
};

const PRODUCT_INFO = { name: 'MindBridge', type: 'SaMD', description: 'Digital therapeutic app' };

const SCALE = [
  { label: 'Rare',       description: 'Extremely unlikely to occur' },
  { label: 'Unlikely',   description: 'Low chance of occurrence' },
  { label: 'Moderate',   description: 'Possible under normal use' },
  { label: 'Likely',     description: 'Expected to occur regularly' },
  { label: 'Almost Certain', description: 'Will almost certainly occur' },
];

const VALID_RESPONSE = JSON.stringify({
  bug_id: 'TEST-001',
  probability_score: 3,
  probability_label: 'Moderate',
  rationale: 'Affects all iOS 17 users during login.',
  references: [],
});

beforeEach(() => {
  callAnthropic.mockReset();
});

describe('assessProbability — output shape', () => {
  test('returns correct fields', async () => {
    callAnthropic.mockResolvedValue(VALID_RESPONSE);
    const result = await assessProbability(DEFECT, BUG, 'test-key', PRODUCT_INFO, '', SCALE);

    expect(result.bug_id).toBe('TEST-001');
    expect(result.probability_score).toBe(3);
    expect(result.probability_label).toBe('Moderate');
    expect(typeof result.rationale).toBe('string');
    expect(Array.isArray(result.references)).toBe(true);
  });
});

describe('assessProbability — error handling', () => {
  test('throws on malformed JSON response', async () => {
    callAnthropic.mockResolvedValue('not json');
    await expect(assessProbability(DEFECT, BUG, 'test-key', PRODUCT_INFO, '', SCALE)).rejects.toThrow(SyntaxError);
  });

  test('throws when API call fails', async () => {
    callAnthropic.mockRejectedValue(new Error('Anthropic API error 429: Rate limit'));
    await expect(assessProbability(DEFECT, BUG, 'test-key', PRODUCT_INFO, '', SCALE)).rejects.toThrow('429');
  });
});

describe('assessProbability — prompt construction', () => {
  test('scale labels appear in the prompt', async () => {
    callAnthropic.mockResolvedValue(VALID_RESPONSE);
    await assessProbability(DEFECT, BUG, 'test-key', PRODUCT_INFO, '', SCALE);

    const prompt = callAnthropic.mock.calls[0][0];
    expect(prompt).toContain('Rare');
    expect(prompt).toContain('Almost Certain');
  });

  test('additional context appears in the prompt when provided', async () => {
    callAnthropic.mockResolvedValue(VALID_RESPONSE);
    await assessProbability(DEFECT, BUG, 'test-key', PRODUCT_INFO, 'Used by high-risk patients.', SCALE);

    const prompt = callAnthropic.mock.calls[0][0];
    expect(prompt).toContain('Used by high-risk patients.');
  });

  test('no additional context section when empty', async () => {
    callAnthropic.mockResolvedValue(VALID_RESPONSE);
    await assessProbability(DEFECT, BUG, 'test-key', PRODUCT_INFO, '', SCALE);

    const prompt = callAnthropic.mock.calls[0][0];
    expect(prompt).not.toContain('ADDITIONAL CONTEXT');
  });
});
