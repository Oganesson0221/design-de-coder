import type { OnboardingAnswers, ArchComponent } from "@/stores/project";

export function buildPersonaGeneratorPrompt(
  answers: OnboardingAnswers,
  components: ArchComponent[]
): string {
  const componentSummary = components
    .map((c) => `- ${c.name} (${c.kind}): ${c.description}`)
    .join("\n");

  return `You are an expert in inclusive design and bias detection for software systems.

## Task
Generate 5-7 diverse test personas who might interact with the following system. These personas should represent a wide range of backgrounds, abilities, and circumstances to help identify potential biases in the system design.

## System Under Analysis

**Idea:** ${answers.idea || "Not specified"}

**Target Audience:** ${answers.audience || "Not specified"}

**User Flow:** ${answers.flow || "Not specified"}

**Architecture Components:**
${componentSummary || "No components defined yet"}

## Persona Generation Guidelines

Generate personas that cover these dimensions of diversity:
1. **Language & Communication** - Non-native speakers, different literacy levels
2. **Physical & Cognitive Abilities** - Visual, auditory, motor, cognitive considerations
3. **Economic Circumstances** - Different income levels, device access, connectivity
4. **Cultural Background** - Different cultural norms, trust levels, privacy expectations
5. **Technical Proficiency** - From digital natives to those unfamiliar with technology
6. **Life Circumstances** - Career gaps, non-traditional schedules, caregiving responsibilities
7. **Geographic Factors** - Rural/urban, different time zones, regulatory environments

Always include:
- A "default user" that matches the stated target audience (baseline for comparison)
- At least 4-6 personas representing potentially underserved or marginalized groups

For each persona, think critically about HOW they would interact with this specific system and what barriers they might face.

## Output Format

Return valid JSON with this exact structure:
{
  "personas": [
    {
      "id": "persona-1",
      "name": "Short descriptive name (e.g., 'Non-native English Speaker')",
      "description": "2-3 sentence background describing this persona's situation",
      "characteristics": ["trait1", "trait2", "trait3"],
      "potentialChallenges": ["challenge they might face with this system", "another potential issue"]
    }
  ]
}`;
}

export const PERSONA_GENERATOR_SYSTEM = `You are an inclusive design expert specializing in bias detection. You generate diverse, realistic test personas to stress-test software systems for accessibility and fairness issues. Your personas are specific, nuanced, and relevant to the system being analyzed. Always respond with valid JSON only, no additional text.`;
