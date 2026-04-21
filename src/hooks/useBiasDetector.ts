import { useCallback } from "react";
import { useBiasStore } from "@/stores/bias";
import { openaiClient } from "@/services/openai";
import {
  buildPersonaGeneratorPrompt,
  PERSONA_GENERATOR_SYSTEM,
} from "@/services/openai/prompts/personaGenerator";
import {
  buildVerifierPrompt,
  VERIFIER_SYSTEM,
} from "@/services/openai/prompts/verifier";
import {
  buildBiasCalculatorPrompt,
  BIAS_CALCULATOR_SYSTEM,
} from "@/services/openai/prompts/biasCalculator";
import type {
  Persona,
  PersonaJourneyResult,
  BiasAnalysisResult,
  BiasDetectionResult,
} from "@/types/bias";

// TODO: Replace with MongoDB integration later
import {
  MOCK_HIRING_SYSTEM_ANSWERS,
  MOCK_HIRING_SYSTEM_COMPONENTS,
} from "@/data/mockHiringSystem";

export function useBiasDetector() {
  // TODO: Replace mock data with MongoDB fetch
  const answers = MOCK_HIRING_SYSTEM_ANSWERS;
  const components = MOCK_HIRING_SYSTEM_COMPONENTS;

  const {
    status,
    error,
    personas,
    journeyResults,
    result,
    setStatus,
    setError,
    setPersonas,
    addJourneyResult,
    setResult,
    reset,
    clearError,
  } = useBiasStore();

  const generateBiasReport = useCallback(async () => {
    reset();

    try {
      // Step 1: Generate personas
      setStatus("generating-personas");
      const personaPrompt = buildPersonaGeneratorPrompt(answers, components);
      const personaResponse = await openaiClient.chatWithRetry([
        { role: "system", content: PERSONA_GENERATOR_SYSTEM },
        { role: "user", content: personaPrompt },
      ]);

      let generatedPersonas: Persona[];
      try {
        const parsed = JSON.parse(personaResponse);
        generatedPersonas = parsed.personas;
      } catch {
        throw new Error("Failed to parse persona response from AI");
      }
      setPersonas(generatedPersonas);

      // Step 2: Simulate journeys for each persona
      setStatus("simulating-journeys");
      const journeyResultsList: PersonaJourneyResult[] = [];

      for (const persona of generatedPersonas) {
        const verifierPrompt = buildVerifierPrompt(persona, answers, components);
        const verifierResponse = await openaiClient.chatWithRetry([
          { role: "system", content: VERIFIER_SYSTEM },
          { role: "user", content: verifierPrompt },
        ]);

        try {
          const journeyResult = JSON.parse(verifierResponse) as PersonaJourneyResult;
          journeyResultsList.push(journeyResult);
          addJourneyResult(journeyResult);
        } catch {
          journeyResultsList.push({
            personaId: persona.id,
            personaName: persona.name,
            outcome: "abandoned",
            outcomeLabel: "Analysis failed",
            problem: "Could not analyze this persona",
            problemCategory: null,
            journeyNarrative: "The analysis could not be completed for this persona.",
            frictionPoints: [],
          });
        }
      }

      // Step 3: Calculate bias score
      setStatus("calculating-score");
      const calculatorPrompt = buildBiasCalculatorPrompt(
        generatedPersonas,
        journeyResultsList,
        answers
      );
      const calculatorResponse = await openaiClient.chatWithRetry([
        { role: "system", content: BIAS_CALCULATOR_SYSTEM },
        { role: "user", content: calculatorPrompt },
      ]);

      let analysis: BiasAnalysisResult;
      try {
        analysis = JSON.parse(calculatorResponse) as BiasAnalysisResult;
      } catch {
        throw new Error("Failed to parse bias analysis from AI");
      }

      // Build final result
      const finalResult: BiasDetectionResult = {
        personas: generatedPersonas,
        journeyResults: journeyResultsList,
        analysis,
        generatedAt: new Date(),
        inputSummary: {
          idea: answers.idea,
          audience: answers.audience,
          componentCount: components.length,
        },
      };

      setResult(finalResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError({
        stage: useBiasStore.getState().status,
        message,
        retryable: true,
      });
    }
  }, [reset, setStatus, setPersonas, addJourneyResult, setResult, setError]);

  return {
    status,
    error,
    personas,
    journeyResults,
    result,
    generateBiasReport,
    reset,
    clearError,
  };
}
