import { create } from "zustand";
import type {
  BiasDetectionStatus,
  BiasDetectionResult,
  BiasDetectionError,
  Persona,
  PersonaJourneyResult,
} from "@/types/bias";

interface BiasState {
  status: BiasDetectionStatus;
  error: BiasDetectionError | null;
  personas: Persona[];
  journeyResults: PersonaJourneyResult[];
  result: BiasDetectionResult | null;
  history: BiasDetectionResult[];

  setStatus: (status: BiasDetectionStatus) => void;
  setError: (error: BiasDetectionError | null) => void;
  setPersonas: (personas: Persona[]) => void;
  addJourneyResult: (result: PersonaJourneyResult) => void;
  setJourneyResults: (results: PersonaJourneyResult[]) => void;
  setResult: (result: BiasDetectionResult) => void;
  reset: () => void;
  clearError: () => void;
}

const initialState = {
  status: "idle" as BiasDetectionStatus,
  error: null,
  personas: [],
  journeyResults: [],
  result: null,
  history: [],
};

export const useBiasStore = create<BiasState>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  setError: (error) =>
    set({
      error,
      status: error ? "error" : "idle",
    }),

  setPersonas: (personas) => set({ personas }),

  addJourneyResult: (result) =>
    set((s) => ({ journeyResults: [...s.journeyResults, result] })),

  setJourneyResults: (journeyResults) => set({ journeyResults }),

  setResult: (result) =>
    set((s) => ({
      result,
      status: "complete",
      history: [result, ...s.history].slice(0, 10),
    })),

  reset: () =>
    set({
      status: "idle",
      error: null,
      personas: [],
      journeyResults: [],
    }),

  clearError: () => set({ error: null, status: "idle" }),
}));
