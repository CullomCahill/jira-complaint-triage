// Mock callAnthropic so no real API call is made.
// parseJsonResponse runs for real — it's pure string parsing.
jest.mock('../anthropicClient.js', () => ({
  callAnthropic: jest.fn(),
  parseJsonResponse: jest.requireActual('../anthropicClient.js').parseJsonResponse,
}));

import { classifyDefect } from '../defectClassification.js';
import { callAnthropic } from '../anthropicClient.js';

const BUG = {
  id: 'TEST-001',
  title: 'Login fails on iOS 17',
  description: 'Users on iOS 17 cannot log in. The app crashes on the auth screen.',
  component: 'Authentication',
  reported_by: 'test@example.com',
  date_reported: '2025-01-01',
};

const PRODUCT_CONTEXT = {
  user_needs: [{ id: 'UN-01', description: 'Users can securely log in' }],
  product_requirements: [{ id: 'PR-01', description: 'App must support iOS 15+' }],
  additional_context: '',
};

const PRODUCT_INFO = { name: 'MindBridge', type: 'SaMD', description: 'Digital therapeutic app' };

const VALID_DEFECT_RESPONSE = JSON.stringify({
  bug_id: 'TEST-001',
  is_defect: true,
  deviates_from_intended_function: true,
  failed_requirements: ['PR-01'],
  failed_user_needs: ['UN-01'],
  rationale: 'Login failure directly violates PR-01 and UN-01.',
  summary: 'Users on iOS 17 cannot authenticate, blocking core therapeutic workflows.',
  references: [],
});

const VALID_NON_DEFECT_RESPONSE = JSON.stringify({
  bug_id: 'TEST-001',
  is_defect: false,
  deviates_from_intended_function: false,
  failed_requirements: [],
  failed_user_needs: [],
  rationale: 'This is a feature request, not a deviation from any requirement.',
  summary: 'Not a defect.',
  references: [],
});

beforeEach(() => {
  callAnthropic.mockReset();
});

describe('classifyDefect — output shape', () => {
  test('returns correct fields for a DEFECT', async () => {
    callAnthropic.mockResolvedValue(VALID_DEFECT_RESPONSE);
    const result = await classifyDefect(BUG, PRODUCT_CONTEXT, 'test-key', PRODUCT_INFO);

    expect(result.bug_id).toBe('TEST-001');
    expect(result.is_defect).toBe(true);
    expect(result.failed_requirements).toEqual(['PR-01']);
    expect(result.failed_user_needs).toEqual(['UN-01']);
    expect(typeof result.rationale).toBe('string');
    expect(typeof result.summary).toBe('string');
    expect(Array.isArray(result.references)).toBe(true);
  });

  test('returns is_defect: false for a NON-DEFECT', async () => {
    callAnthropic.mockResolvedValue(VALID_NON_DEFECT_RESPONSE);
    const result = await classifyDefect(BUG, PRODUCT_CONTEXT, 'test-key', PRODUCT_INFO);

    expect(result.is_defect).toBe(false);
    expect(result.failed_requirements).toEqual([]);
  });
});

describe('classifyDefect — error handling', () => {
  test('throws when API returns malformed JSON', async () => {
    callAnthropic.mockResolvedValue('this is not json');
    await expect(classifyDefect(BUG, PRODUCT_CONTEXT, 'test-key', PRODUCT_INFO)).rejects.toThrow(SyntaxError);
  });

  test('throws when API call itself fails', async () => {
    callAnthropic.mockRejectedValue(new Error('Anthropic API error 401: Unauthorized'));
    await expect(classifyDefect(BUG, PRODUCT_CONTEXT, 'test-key', PRODUCT_INFO)).rejects.toThrow('401');
  });
});

describe('classifyDefect — input edge cases', () => {
  test('handles empty bug description without throwing before API call', async () => {
    callAnthropic.mockResolvedValue(VALID_DEFECT_RESPONSE);
    const emptyBug = { ...BUG, description: '' };
    await expect(classifyDefect(emptyBug, PRODUCT_CONTEXT, 'test-key', PRODUCT_INFO)).resolves.toBeDefined();
    expect(callAnthropic).toHaveBeenCalledTimes(1);
  });

  test('handles bug with no comments field', async () => {
    callAnthropic.mockResolvedValue(VALID_DEFECT_RESPONSE);
    const bugNoComments = { ...BUG };
    delete bugNoComments.comments;
    await expect(classifyDefect(bugNoComments, PRODUCT_CONTEXT, 'test-key', PRODUCT_INFO)).resolves.toBeDefined();
  });

  test('handles additional_context present in productContext', async () => {
    callAnthropic.mockResolvedValue(VALID_DEFECT_RESPONSE);
    const contextWithExtra = { ...PRODUCT_CONTEXT, additional_context: 'This product is used in clinical trials.' };
    await classifyDefect(BUG, contextWithExtra, 'test-key', PRODUCT_INFO);

    const promptSent = callAnthropic.mock.calls[0][0];
    expect(promptSent).toContain('This product is used in clinical trials.');
  });
});
