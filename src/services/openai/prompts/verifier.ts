import type { OnboardingAnswers, ArchComponent } from "@/stores/project";
import type { Persona } from "@/types/bias";

export function buildVerifierPrompt(
  persona: Persona,
  answers: OnboardingAnswers,
  components: ArchComponent[]
): string {
  const componentSummary = components
    .map((c) => `- ${c.name} (${c.kind}): ${c.description}`)
    .join("\n");

  return `You are simulating how a specific user persona would experience a software system. Your goal is to identify friction points, barriers, and potential bias in the user experience.

## Persona to Simulate

**Name:** ${persona.name}
**Background:** ${persona.description}
**Key Characteristics:** ${persona.characteristics.join(", ")}
**Expected Challenges:** ${persona.potentialChallenges.join(", ")}

## System Being Tested

**Idea:** ${answers.idea || "Not specified"}
**Target Audience:** ${answers.audience || "Not specified"}
**Intended User Flow:** ${answers.flow || "Not specified"}

**Architecture Components:**
${componentSummary || "No components defined"}

## Simulation Instructions

Walk through the intended user flow as this persona and consider:
1. Can they discover and access the system?
2. Can they understand the interface and instructions?
3. Can they complete the core user flow successfully?
4. What specific moments cause difficulty or exclusion?
5. Would they abandon the process? At what point?

## Bias Categories to Consider

- **language**: Language barriers, literacy requirements, jargon, idioms
- **accessibility**: Physical or cognitive accessibility barriers, screen reader support, color contrast
- **economic**: Cost barriers, device requirements, bandwidth/data needs, payment methods
- **cultural**: Cultural assumptions, trust issues, privacy concerns, naming conventions
- **technical**: Technical skill requirements, assumed prior knowledge
- **temporal**: Time-based barriers, availability assumptions, timezone issues
- **geographic**: Location-based limitations, regional restrictions
- **demographic**: Age, gender, or other demographic assumptions
- **experience**: Professional experience or credential requirements
- **trust**: Security concerns, data privacy, institutional trust, verification barriers

## Outcome Categories

- **success**: Persona can complete the core flow without significant barriers
- **partial**: Persona can use the system but with notable friction or workarounds
- **rejected**: Persona is explicitly denied access or service
- **filtered**: Persona is quietly excluded through design choices (e.g., requirements they can't meet)
- **abandoned**: Persona would likely give up due to frustration or barriers

## Output Format

Return valid JSON with this exact structure:
{
  "personaId": "${persona.id}",
  "personaName": "${persona.name}",
  "outcome": "success|partial|rejected|filtered|abandoned",
  "outcomeLabel": "Human-readable outcome (e.g., 'Successfully completed', 'Filtered out early')",
  "problem": "Brief description of the main issue encountered, or null if successful",
  "problemCategory": "one of the bias categories listed above, or null if successful",
  "journeyNarrative": "2-3 sentences describing what happened when this persona tried to use the system",
  "frictionPoints": ["specific moment of difficulty 1", "specific moment 2"]
}`;
}

export const VERIFIER_SYSTEM = `You are a user experience researcher simulating how different users interact with software systems. You identify friction points, accessibility issues, and potential bias with empathy and precision. You think critically about edge cases and barriers that might not be obvious to the system designers. Always respond with valid JSON only, no additional text.`;
