export interface AssessmentEvidence {
  id: string;
  testTitle: string;
  category: string;
  percentage: number;
  score: number;
  maxScore: number;
  completedAt: string;
  categoryScores: Record<string, number>;
  strengths: string[];
  improvementAreas: string[];
  improvementSuggestions: string[];
  questionResults: Array<{
    questionId: string;
    question: string;
    category: string;
    selectedOptionIndex: number | null;
    correct: boolean;
    earnedPoints: number;
    maxPoints: number;
  }>;
}

export interface CandidateFeedbackFacts {
  applicationStatus: string;
  rejectionReason: string | null;
  rejectionReasonUpdatedAt: string | null;
  assessmentScope: 'candidate-wide; not linked to a specific application';
  assessments: AssessmentEvidence[];
}

export interface FeedbackAssistantReply {
  recordedFacts: CandidateFeedbackFacts;
  recommendations: string[];
  recommendationSource: 'gemini' | 'deterministic';
  fallbackNotice?: string;
}

export type RecommendationProvider = (
  question: string,
  assessments: AssessmentEvidence[]
) => Promise<unknown>;

const deterministicRecommendations = (assessments: AssessmentEvidence[]): string[] => {
  const areas = assessments.flatMap((attempt) => attempt.improvementAreas);
  const uniqueAreas = [...new Set(areas)].slice(0, 5);
  if (uniqueAreas.length) {
    return uniqueAreas.map((area) =>
      `Practice ${area} with short, timed exercises. Review each answer and write down the step that was difficult.`
    );
  }
  if (assessments.length) {
    return ['Continue practicing with new questions in the categories shown in your saved assessment results.'];
  }
  return ['Complete an assessment to receive recommendations based on saved evaluation evidence.'];
};

const safeModelRecommendations = (result: unknown): string[] | null => {
  let parsed: unknown = result;
  if (typeof result === 'string') {
    try {
      parsed = JSON.parse(result.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as any).recommendations)) return null;
  const recommendations = (parsed as any).recommendations;
  if (recommendations.length < 1 || recommendations.length > 5) return null;
  const blockedClaim = /\b(?:you scored|your score|you answered|you were rejected|rejected because|interview feedback|recruiter said|\d+\s*%)\b/i;
  const cleaned = recommendations.map((item: unknown) => typeof item === 'string' ? item.trim() : '');
  if (cleaned.some((item: string) => !item || item.length > 280 || blockedClaim.test(item))) return null;
  return cleaned;
};

export async function createCandidateFeedbackReply(
  question: string,
  recordedFacts: CandidateFeedbackFacts,
  provider?: RecommendationProvider
): Promise<FeedbackAssistantReply> {
  const fallback = deterministicRecommendations(recordedFacts.assessments);
  if (!provider) {
    return {
      recordedFacts,
      recommendations: fallback,
      recommendationSource: 'deterministic',
      fallbackNotice: 'AI coaching is not configured. These rule-based suggestions use the saved assessment categories.'
    };
  }

  try {
    const recommendations = safeModelRecommendations(await provider(question, recordedFacts.assessments));
    if (!recommendations) throw new Error('AI recommendations did not match the expected safe format.');
    return { recordedFacts, recommendations, recommendationSource: 'gemini' };
  } catch {
    return {
      recordedFacts,
      recommendations: fallback,
      recommendationSource: 'deterministic',
      fallbackNotice: 'AI coaching is unavailable. These rule-based suggestions use the saved assessment categories.'
    };
  }
}
