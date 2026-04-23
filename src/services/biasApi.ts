const API_BASE = "http://localhost:3001";

export interface BiasProjectData {
  projectId: string;
  requirements: {
    project_id: string;
    requirements_markdown: string;
    version: number;
  } | null;
  schema: {
    project_id: string;
    schema_json: {
      collections: Array<{
        name: string;
        description: string;
        fields: Array<{ name: string; type: string; description: string }>;
      }>;
    };
    version: number;
  } | null;
  existingBias: BiasResult | null;
}

export interface PersonaAnalysis {
  persona: string;
  impact: string;
  risk_level: "low" | "medium" | "high";
  mitigation: string;
}

export interface BiasMetric {
  metric: string;
  definition: string;
  target: string;
  current_score: number;
  bias_scoring_strategy: string;
}

export interface BiasRecommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  affectedPersonas: string[];
  implementationHint: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  potentialChallenges: string[];
}

export interface JourneyResult {
  personaId: string;
  personaName: string;
  outcome: "success" | "partial" | "rejected" | "filtered" | "abandoned";
  outcomeLabel: string;
  problem: string | null;
  problemCategory: string | null;
  journeyNarrative: string;
  frictionPoints: string[];
}

export interface UnbiasJson {
  bias_types: string[];
  detection_points: Array<{
    point: string;
    risk: string;
    impacted_personas: string[];
  }>;
  mitigation_strategies: Array<{
    strategy: string;
    owner: string;
    implementation: string;
  }>;
  validation_checks: Array<{
    check: string;
    method: string;
    pass_criteria: string;
  }>;
  personas_analysis: PersonaAnalysis[];
  metrics: BiasMetric[];
  overall_score: number;
  score_label: string;
  explanation: string;
  methodology: string;
  recommendations: BiasRecommendation[];
  personas: Persona[];
  journey_results: JourneyResult[];
}

export interface BiasResult {
  project_id: string;
  unbias_json: UnbiasJson;
  version: number;
  updated_at: string;
}

export interface GenerateBiasResponse {
  success: boolean;
  projectId: string;
  version: number;
  result: UnbiasJson;
}

export interface GetBiasResultResponse {
  projectId: string;
  version: number;
  updatedAt: string;
  result: UnbiasJson;
}

class BiasApiService {
  async getProjectData(projectId: string): Promise<BiasProjectData> {
    const response = await fetch(`${API_BASE}/api/bias/project/${projectId}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Failed to fetch project: ${response.status}`);
    }
    return response.json();
  }

  async generateBiasAnalysis(projectId: string): Promise<GenerateBiasResponse> {
    const response = await fetch(`${API_BASE}/api/bias/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Failed to generate bias analysis: ${response.status}`);
    }
    return response.json();
  }

  async getBiasResult(projectId: string): Promise<GetBiasResultResponse> {
    const response = await fetch(`${API_BASE}/api/bias/result/${projectId}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Failed to fetch bias result: ${response.status}`);
    }
    return response.json();
  }

  async listProjects(): Promise<{ projects: Array<{ _id: string; latestVersion: number; updatedAt: string }> }> {
    const response = await fetch(`${API_BASE}/api/bias/projects`);
    if (!response.ok) {
      throw new Error("Failed to list projects");
    }
    return response.json();
  }
}

export const biasApi = new BiasApiService();
