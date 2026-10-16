import { SentimentType } from '@/types/feedback';

export const POSITIVE_KEYWORDS = [
  'fast', 'quick', 'efficient', 'helpful', 'prompt', 'smooth', 'excellent',
  'great', 'polite', 'courteous', 'transparent', 'solved', 'resolved', 'satisfied',
  'well-maintained', 'friendly', 'clear', 'easy', 'seamless', 'timely', 'professional',
  'thank', 'applaud', 'appreciated', 'supportive', 'clean', 'improved', 'organized',
];

export const NEGATIVE_KEYWORDS = [
  'delay', 'delayed', 'slow', 'rude', 'unhelpful', 'bribe', 'corrupt', 'harassed',
  'queue', 'waiting', 'broken', 'server down', 'glitch', 'error', 'refused',
  'crowded', 'unresponsive', 'terrible', 'worst', 'failed', 'complaint',
  'leakage', 'outage', 'dirty', 'ignored', 'arrogant', 'misinformed', 'complicated',
  'frustrated', 'poor', 'useless', 'harassment', 'long line', 'harsh',
];

/** Stable identifier for the current implementation, stored alongside the result. */
export const SENTIMENT_METHOD = 'heuristic-v1';

export type SentimentStatus = 'completed' | 'failed';

export interface SentimentAnalysisResult {
  sentiment: SentimentType;
  /** 0–100 (0 = most negative, 50 = neutral, 100 = most positive). */
  score: number;
  detectedKeywords: string[];
  method: string;
  status: SentimentStatus;
  explanation: string;
}

/**
 * Heuristic, rule-based sentiment classification.
 *
 * This is deliberately a transparent keyword + rating baseline, labelled as such
 * in the UI. It is NOT a trained model and must never be presented as AI.
 * The signature is stable so a real model can replace the body without changing callers.
 */
export function analyzeSentiment(
  text: string,
  overallRating: number,
  categoryAverage: number
): SentimentAnalysisResult {
  try {
    const normalized = (text ?? '').toLowerCase();

    const foundPositives = POSITIVE_KEYWORDS.filter((kw) => normalized.includes(kw));
    const foundNegatives = NEGATIVE_KEYWORDS.filter((kw) => normalized.includes(kw));

    const keywordDiff = foundPositives.length - foundNegatives.length;

    // Rating contribution: average of overall + category ratings, mapped to -2..+2.
    const ratingWeight = (overallRating + categoryAverage) / 2 - 3;
    const compositeScore = ratingWeight * 1.5 + keywordDiff;

    let sentiment: SentimentType = 'neutral';
    let score = 50;

    if (compositeScore >= 0.8 || (overallRating >= 4 && foundNegatives.length === 0)) {
      sentiment = 'positive';
      score = Math.min(98, Math.round(65 + compositeScore * 10));
    } else if (compositeScore <= -0.8 || (overallRating <= 2 && foundPositives.length === 0)) {
      sentiment = 'negative';
      score = Math.max(8, Math.round(35 + compositeScore * 10));
    } else {
      sentiment = 'neutral';
      score = Math.round(50 + compositeScore * 5);
    }

    score = Math.max(0, Math.min(100, score));

    const allDetected = Array.from(new Set([...foundPositives, ...foundNegatives]));

    let explanation = '';
    if (!normalized.trim()) {
      explanation = 'No text supplied; classified from ratings only.';
    } else if (sentiment === 'positive') {
      explanation = `Positive evaluation from ${foundPositives.length} constructive indicator(s) and a ${overallRating}/5 rating.`;
    } else if (sentiment === 'negative') {
      explanation = `Concern flagged from ${foundNegatives.length} friction keyword(s) and a ${overallRating}/5 rating.`;
    } else {
      explanation = `Balanced or neutral feedback with a ${overallRating}/5 rating.`;
    }

    return {
      sentiment,
      score,
      detectedKeywords: allDetected,
      method: SENTIMENT_METHOD,
      status: 'completed',
      explanation,
    };
  } catch {
    // Analysis must never break submission.
    return {
      sentiment: 'neutral',
      score: 50,
      detectedKeywords: [],
      method: SENTIMENT_METHOD,
      status: 'failed',
      explanation: 'Sentiment analysis failed; defaulted to neutral.',
    };
  }
}
