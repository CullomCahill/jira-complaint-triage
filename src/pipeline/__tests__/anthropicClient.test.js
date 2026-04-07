// @forge/api is auto-mocked via __mocks__/@forge/api.js
import { parseJsonResponse } from '../anthropicClient.js';

describe('parseJsonResponse', () => {
  test('parses plain JSON', () => {
    const result = parseJsonResponse('{"is_defect": true, "bug_id": "T-1"}');
    expect(result).toEqual({ is_defect: true, bug_id: 'T-1' });
  });

  test('strips ```json ... ``` fencing', () => {
    const fenced = '```json\n{"score": 3}\n```';
    expect(parseJsonResponse(fenced)).toEqual({ score: 3 });
  });

  test('strips ``` ... ``` fencing (no language tag)', () => {
    const fenced = '```\n{"score": 3}\n```';
    expect(parseJsonResponse(fenced)).toEqual({ score: 3 });
  });

  test('throws on malformed JSON', () => {
    expect(() => parseJsonResponse('not json at all')).toThrow(SyntaxError);
  });

  test('throws on empty string', () => {
    expect(() => parseJsonResponse('')).toThrow();
  });
});
