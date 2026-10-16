import { FeedbackRecord } from '@/types/feedback';

const COLUMNS = [
  'reference_id',
  'created_at',
  'district',
  'local_area',
  'department',
  'service',
  'overall_rating',
  'helpfulness',
  'communication',
  'professionalism',
  'response_time',
  'sentiment',
  'sentiment_score',
  'summary_comment',
  'is_anonymous',
] as const;

function escapeCsv(value: string | number | boolean): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Build a CSV document from feedback records. Anonymous records never include
 * citizen identity (no such column exists). Mirrors the backend export contract.
 */
export function feedbackToCsv(feedbacks: FeedbackRecord[]): string {
  const header = COLUMNS.join(',');
  const rows = feedbacks.map((f) =>
    [
      f.referenceId,
      f.createdAt,
      f.location.district,
      f.location.localArea,
      f.departmentName,
      f.serviceName,
      f.overallRating,
      f.categoryRatings.helpfulness,
      f.categoryRatings.communication,
      f.categoryRatings.professionalism,
      f.categoryRatings.responseTime,
      f.sentiment,
      f.sentimentScore,
      f.summaryComment,
      f.isAnonymous ? 'yes' : 'no',
    ]
      .map(escapeCsv)
      .join(',')
  );

  return [header, ...rows].join('\r\n');
}
