import { SentimentType } from '@/types/feedback';

const POSITIVE_KEYWORDS = [
  'fast', 'quick', 'efficient', 'helpful', 'prompt', 'smooth', 'excellent',
  'great', 'polite', 'courteous', 'transparent', 'solved', 'resolved', 'satisfied',
  'well-maintained', 'friendly', 'clear', 'easy', 'seamless', 'timely', 'professional',
  'thank', 'applaud', 'appreciated', 'supportive', 'clean', 'improved', 'organized'
];

const NEGATIVE_KEYWORDS = [
  'delay', 'delayed', 'slow', 'rude', 'unhelpful', 'bribe', 'corrupt', 'harassed',
  'queue', 'waiting', 'broken', 'server down', 'glitch', 'error', 'refused',
  'crowded', 'unresponsive', 'terrible', 'worst', 'failed', 'complaint',
  'leakage', 'outage', 'dirty', 'ignored', 'arrogant', 'misinformed', 'complicated',
  'frustrated', 'poor', 'useless', 'harassment', 'long line', 'harsh'
];

export interface SentimentAnalysisResult {
  sentiment: SentimentType;
  score: number; // 0 - 100 (0=most negative, 50=neutral, 100=most positive)
  detectedKeywords: string[];
  explanation: string;
  isPrototypeClassifier: boolean;
}

/**
 * Prototype rule-based sentiment classification.
 * Transparently labeled as a heuristic baseline intended to be replaced with
 * a trained Transformer / LLM sentiment pipeline in production.
 */
export function analyzeSentiment(
  text: string,
  overallRating: number,
  categoryAverage: number
): SentimentAnalysisResult {
  const normalized = (text || '').toLowerCase();
  
  const foundPositives: string[] = [];
  const foundNegatives: string[] = [];

  POSITIVE_KEYWORDS.forEach((kw) => {
    if (normalized.includes(kw)) {
      foundPositives.push(kw);
    }
  });

  NEGATIVE_KEYWORDS.forEach((kw) => {
    if (normalized.includes(kw)) {
      foundNegatives.push(kw);
    }
  });

  // Calculate text balance: positive words +1, negative words -1
  const keywordDiff = foundPositives.length - foundNegatives.length;

  // Rating contribution (1-5 mapped to -2 to +2 scale)
  const ratingWeight = ((overallRating + categoryAverage) / 2) - 3; // -2 to +2

  // Total polarity composite
  const compositeScore = ratingWeight * 1.5 + keywordDiff;

  let sentiment: SentimentType = 'neutral';
  let score = 50;

  if (compositeScore >= 0.8 || (overallRating >= 4 && foundNegatives.length === 0)) {
    sentiment = 'positive';
    score = Math.min(98, Math.round(65 + (compositeScore * 10)));
  } else if (compositeScore <= -0.8 || (overallRating <= 2 && foundPositives.length === 0)) {
    sentiment = 'negative';
    score = Math.max(8, Math.round(35 + (compositeScore * 10)));
  } else {
    sentiment = 'neutral';
    score = Math.round(50 + (compositeScore * 5));
  }

  // Combine unique detected keywords
  const allDetected = Array.from(new Set([...foundPositives, ...foundNegatives]));

  let explanation = '';
  if (sentiment === 'positive') {
    explanation = `Positive evaluation based on ${foundPositives.length} constructive indicators and high rating (${overallRating}/5).`;
  } else if (sentiment === 'negative') {
    explanation = `Concern flagged based on ${foundNegatives.length} friction keywords and low rating (${overallRating}/5).`;
  } else {
    explanation = `Balanced or neutral feedback with steady rating (${overallRating}/5).`;
  }

  return {
    sentiment,
    score,
    detectedKeywords: allDetected,
    explanation,
    isPrototypeClassifier: true,
  };
}
