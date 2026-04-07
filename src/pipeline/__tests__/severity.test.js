jest.mock('../anthropicClient.js', () => ({
  callAnthropic: jest.fn(),
  parseJsonResponse: jest.requireActual('../anthropicClient.js').parseJsonResponse,
}));

import { assessSeverity } from '../severity.js';
import { callAnthropic } from '../anthropicClient.js';

const DEFECT = {
  bug_id: 'TEST-001',
  summary: 'Login fails on iOS 17, blocking core workflows.',
  failed_requirements: ['PR-01'],
  failed_user_needs: ['UN-01'],
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
  { label: 'Negligible',   description: 'No meaningful impact on user' },
  { label: 'Minor',        description: 'Temporary inconvenience' },
  { label: 'Moderate',     description: 'Disrupts normal use' },
  { label: 'Severe',       description: 'Significant harm or therapeutic failure' },
  { label: 'Catastrophic', description: 'Serious patient safety event' },
];

const VALID_RESPONSE = JSON.stringify({
  bug_id: 'TEST-001',
  severity_score: 4,
  severity_label: 'Severe',
  rationale: 'Blocks all users from accessing therapeutic content.',
  references: [],
});

beforeEach(() => {
  callAnthropic.mockReset();
});

describe('assessSeverity — output shape', () => {
  test('returns correct fields', async () => {
    callAnthropic.mockResolvedValue(VALID_RESPONSE);
    const result = await assessSeverity(DEFECT, BUG, 'test-key', PRODUCT_INFO, '', SCALE);

    expect(result.bug_id).toBe('TEST-001');
    expect(result.severity_score).toBe(4);
    expect(result.severity_label).toBe('Severe');
    expect(typeof result.rationale).toBe('string');
    expect(Array.isArray(result.references)).toBe(true);
  });
});

describe('assessSeverity — error handling', () => {
  test('throws on malformed JSON response', async () => {
    callAnthropic.mockResolvedValue('not json');
    await expect(assessSeverity(DEFECT, BUG, 'test-key', PRODUCT_INFO, '', SCALE)).rejects.toThrow(SyntaxError);
  });

  test('throws when API call fails', async () => {
    callAnthropic.mockRejectedValue(new Error('Anthropic API error 500: Internal Server Error'));
    await expect(assessSeverity(DEFECT, BUG, 'test-key', PRODUCT_INFO, '', SCALE)).rejects.toThrow('500');
  });
});

describe('assessSeverity — prompt construction', () => {
  test('scale labels appear in the prompt', async () => {
    callAnthropic.mockResolvedValue(VALID_RESPONSE);
    await assessSeverity(DEFECT, BUG, 'test-key', PRODUCT_INFO, '', SCALE);

    const prompt = callAnthropic.mock.calls[0][0];
    expect(prompt).toContain('Negligible');
    expect(prompt).toContain('Catastrophic');
  });

  test('failed_user_needs appear in the prompt', async () => {
    callAnthropic.mockResolvedValue(VALID_RESPONSE);
    await assessSeverity(DEFECT, BUG, 'test-key', PRODUCT_INFO, '', SCALE);

    const prompt = callAnthropic.mock.calls[0][0];
    expect(prompt).toContain('UN-01');
  });

  test('additional context appears in the prompt when provided', async () => {
    callAnthropic.mockResolvedValue(VALID_RESPONSE);
    await assessSeverity(DEFECT, BUG, 'test-key', PRODUCT_INFO, 'Used by high-risk patients.', SCALE);

    const prompt = callAnthropic.mock.calls[0][0];
    expect(prompt).toContain('Used by high-risk patients.');
  });

  test('no additional context section when empty', async () => {
    callAnthropic.mockResolvedValue(VALID_RESPONSE);
    await assessSeverity(DEFECT, BUG, 'test-key', PRODUCT_INFO, '', SCALE);

    const prompt = callAnthropic.mock.calls[0][0];
    expect(prompt).not.toContain('ADDITIONAL CONTEXT');
  });
});
