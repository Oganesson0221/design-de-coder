export interface Persona {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  potentialChallenges: string[];
}

export type BiasCategory =
  | "language"
  | "accessibility"
  | "economic"
  | "cultural"
  | "technical"
  | "temporal"
  | "geographic"
  | "demographic"
  | "experience"
  | "trust";

export type PersonaOutcome =
  | "success"
  | "partial"
  | "rejected"
  | "filtered"
  | "abandoned";

export interface PersonaJourneyResult {
  personaId: string;
  personaName: string;
  outcome: PersonaOutcome;
  outcomeLabel: string;
  problem: string | null;
  problemCategory: BiasCategory | null;
  journeyNarrative: string;
  frictionPoints: string[];
}

export interface BiasMetric {
  name: string;
  score: number;
  weight: number;
  description: string;
  findings: string[];
}

export type RecommendationPriority = "critical" | "high" | "medium" | "low";

export interface BiasRecommendation {
  id: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
  affectedPersonas: string[];
  implementationHint: string;
}

export interface BiasAnalysisResult {
  overallScore: number;
  scoreLabel: string;
  metrics: BiasMetric[];
  explanation: string;
  methodology: string;
  recommendations: BiasRecommendation[];
}

export interface BiasDetectionResult {
  personas: Persona[];
  journeyResults: PersonaJourneyResult[];
  analysis: BiasAnalysisResult;
  generatedAt: Date;
  inputSummary: {
    idea: string;
    audience: string;
    componentCount: number;
  };
}

export type BiasDetectionStatus =
  | "idle"
  | "generating-personas"
  | "simulating-journeys"
  | "calculating-score"
  | "complete"
  | "error";

export interface BiasDetectionError {
  stage: BiasDetectionStatus;
  message: string;
  retryable: boolean;
}
