import { describe, expect, it } from 'vitest';
import { analyzeSentiment, SENTIMENT_METHOD } from '@/domain/sentiment';

describe('analyzeSentiment (heuristic baseline)', () => {
  it('classifies clearly positive feedback as positive', () => {
    const result = analyzeSentiment(
      'The staff were very helpful and the process was fast and smooth. Thank you.',
      5,
      4.5
    );
    expect(result.sentiment).toBe('positive');
    expect(result.score).toBeGreaterThan(50);
    expect(result.status).toBe('completed');
    expect(result.method).toBe(SENTIMENT_METHOD);
  });

  it('classifies clearly negative feedback as negative', () => {
    const result = analyzeSentiment(
      'There was a very long delay and the staff were rude and unhelpful. Terrible experience.',
      1,
      1.5
    );
    expect(result.sentiment).toBe('negative');
    expect(result.score).toBeLessThan(50);
    expect(result.detectedKeywords).toContain('delay');
  });

  it('classifies mixed feedback as neutral', () => {
    const result = analyzeSentiment('It was okay, nothing special happened.', 3, 3);
    expect(result.sentiment).toBe('neutral');
  });

  it('handles empty text without throwing and stays neutral', () => {
    const result = analyzeSentiment('', 3, 3);
    expect(result.sentiment).toBe('neutral');
    expect(result.score).toBe(50);
    expect(result.detectedKeywords).toHaveLength(0);
    expect(result.status).toBe('completed');
  });

  it('always returns a score within 0–100', () => {
    const samples = ['', 'fast', 'delay delay delay', 'great wonderful excellent'];
    for (const text of samples) {
      const result = analyzeSentiment(text, 1, 1);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });

  it('never labels itself as a trained model / AI', () => {
    const result = analyzeSentiment('good service', 4, 4);
    expect(result.method).toBe('heuristic-v1');
    expect(result.explanation.toLowerCase()).not.toContain('ai');
    expect(result.explanation.toLowerCase()).not.toContain('machine learning');
  });
});
