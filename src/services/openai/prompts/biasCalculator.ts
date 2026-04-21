import type { OnboardingAnswers } from "@/stores/project";
import type { Persona, PersonaJourneyResult } from "@/types/bias";

export function buildBiasCalculatorPrompt(
  personas: Persona[],
  journeyResults: PersonaJourneyResult[],
  answers: OnboardingAnswers
): string {
  const resultsTable = journeyResults
    .map(
      (r) =>
        `| ${r.personaName} | ${r.outcomeLabel} | ${r.problem || "None"} | ${r.problemCategory || "N/A"} |`
    )
    .join("\n");

  const frictionDetails = journeyResults
    .filter((r) => r.frictionPoints.length > 0)
    .map((r) => `**${r.personaName}:** ${r.frictionPoints.join("; ")}`)
    .join("\n");

  const journeyNarratives = journeyResults
    .map((r) => `**${r.personaName}:** ${r.journeyNarrative}`)
    .join("\n");

  return `You are a bias analysis expert calculating a comprehensive bias score for a software system based on simulated user journeys.

## System Context

**Idea:** ${answers.idea || "Not specified"}
**Target Audience:** ${answers.audience || "Not specified"}
**User Flow:** ${answers.flow || "Not specified"}

## Persona Simulation Results

| Persona | Outcome | Problem | Category |
|---------|---------|---------|----------|
${resultsTable}

## Journey Narratives

${journeyNarratives}

## Friction Point Details

${frictionDetails || "No significant friction points identified."}

## Bias Metrics to Calculate

Calculate scores (0-100, where 100 = excellent/no bias, 0 = severe bias) for each metric:

1. **Accessibility Inclusion** (weight: 20%)
   - Can users with various physical and cognitive abilities complete the core flow?
   - Consider vision, hearing, motor, and cognitive accessibility

2. **Language & Literacy Equity** (weight: 15%)
   - Are there language barriers, literacy assumptions, or excessive jargon?
   - Consider non-native speakers and varying education levels

3. **Economic Accessibility** (weight: 15%)
   - Are there cost barriers, device requirements, or connectivity assumptions?
   - Consider users with limited income or older technology

4. **Cultural Sensitivity** (weight: 15%)
   - Does the system respect diverse cultural norms and expectations?
   - Consider naming conventions, privacy expectations, trust levels

5. **Demographic Neutrality** (weight: 15%)
   - Are there assumptions about age, gender, professional experience?
   - Consider career gaps, non-traditional backgrounds

6. **Technical Barrier Level** (weight: 10%)
   - What technical skills are assumed? Is it beginner-friendly?
   - Consider digital literacy across generations

7. **Geographic Fairness** (weight: 10%)
   - Does location affect the user experience?
   - Consider rural/urban, international users, timezone issues

## Scoring Guidelines

- **90-100**: Excellent - Actively inclusive design, accommodates diverse users
- **70-89**: Good - Minor improvements possible, most users can succeed
- **50-69**: Moderate Concern - Several groups may struggle or be excluded
- **30-49**: Significant Issues - Major barriers for multiple user groups
- **0-29**: Critical - System effectively excludes significant populations

## Output Format

Return valid JSON with this exact structure:
{
  "overallScore": <number 0-100, weighted average of metrics>,
  "scoreLabel": "One of: Excellent, Good, Moderate Concern, Significant Issues, Critical",
  "metrics": [
    {
      "name": "Accessibility Inclusion",
      "score": <number 0-100>,
      "weight": 0.20,
      "description": "1-2 sentence explanation of this score",
      "findings": ["specific finding from simulations", "another finding"]
    },
    {
      "name": "Language & Literacy Equity",
      "score": <number>,
      "weight": 0.15,
      "description": "explanation",
      "findings": ["finding1", "finding2"]
    },
    {
      "name": "Economic Accessibility",
      "score": <number>,
      "weight": 0.15,
      "description": "explanation",
      "findings": ["finding1"]
    },
    {
      "name": "Cultural Sensitivity",
      "score": <number>,
      "weight": 0.15,
      "description": "explanation",
      "findings": ["finding1"]
    },
    {
      "name": "Demographic Neutrality",
      "score": <number>,
      "weight": 0.15,
      "description": "explanation",
      "findings": ["finding1"]
    },
    {
      "name": "Technical Barrier Level",
      "score": <number>,
      "weight": 0.10,
      "description": "explanation",
      "findings": ["finding1"]
    },
    {
      "name": "Geographic Fairness",
      "score": <number>,
      "weight": 0.10,
      "description": "explanation",
      "findings": ["finding1"]
    }
  ],
  "explanation": "2-3 paragraph explanation of the overall bias score. Explain which groups face the most barriers, what patterns emerged across personas, and why the score is what it is. Be specific and reference the simulation results.",
  "methodology": "Brief 2-3 sentence description of how the analysis was performed and what it measured.",
  "recommendations": [
    {
      "id": "rec-1",
      "priority": "critical|high|medium|low",
      "title": "Short actionable recommendation title",
      "description": "Detailed recommendation explaining what to change and why",
      "affectedPersonas": ["names of personas who would benefit"],
      "implementationHint": "Technical or design suggestion for how to implement this"
    }
  ]
}

Generate 3-6 recommendations, prioritized from most to least important. Focus on actionable changes to the system design.`;
}

export const BIAS_CALCULATOR_SYSTEM = `You are a fairness and inclusion analyst specializing in software systems. You calculate comprehensive bias scores using established metrics and provide actionable, specific recommendations. Your analysis is data-driven, based on the simulation results provided, and your recommendations are practical and implementable. Always respond with valid JSON only, no additional text.`;
