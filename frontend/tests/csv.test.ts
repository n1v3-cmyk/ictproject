import { describe, expect, it } from 'vitest';
import { feedbackToCsv } from '@/domain/csv';
import { makeFeedback } from './fixtures';

describe('feedbackToCsv', () => {
  it('emits a header and one row per record', () => {
    const csv = feedbackToCsv([
      makeFeedback({ referenceId: 'CC-KL-2026-1001' }),
      makeFeedback({ referenceId: 'CC-KL-2026-1002' }),
    ]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('reference_id');
    expect(lines[0]).toContain('sentiment_score');
  });

  it('escapes commas, quotes and newlines', () => {
    const csv = feedbackToCsv([
      makeFeedback({ summaryComment: 'Delay, "long" queues\nand confusion' }),
    ]);
    const row = csv.split('\r\n')[1];
    expect(row).toContain('"Delay, ""long"" queues\nand confusion"');
  });

  it('never includes citizen identity columns', () => {
    const csv = feedbackToCsv([makeFeedback({ isAnonymous: false, citizenName: 'Anita', citizenContact: '999' })]);
    expect(csv).not.toContain('citizen_name');
    expect(csv).not.toContain('Anita');
    expect(csv).not.toContain('999');
  });
});
