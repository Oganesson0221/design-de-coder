import { create } from "zustand";
import type { UnbiasJson, JourneyResult, Persona } from "@/services/biasApi";

export type BiasDetectionStatus =
  | "idle"
  | "loading-project"
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

interface BiasState {
  status: BiasDetectionStatus;
  error: BiasDetectionError | null;
  projectId: string | null;
  result: UnbiasJson | null;
  version: number | null;

  setStatus: (status: BiasDetectionStatus) => void;
  setError: (error: BiasDetectionError | null) => void;
  setProjectId: (projectId: string) => void;
  setResult: (result: UnbiasJson, version: number) => void;
  reset: () => void;
  clearError: () => void;
}

const initialState = {
  status: "idle" as BiasDetectionStatus,
  error: null,
  projectId: null,
  result: null,
  version: null,
};

export const useBiasStore = create<BiasState>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  setError: (error) =>
    set({
      error,
      status: error ? "error" : "idle",
    }),

  setProjectId: (projectId) => set({ projectId }),

  setResult: (result, version) =>
    set({
      result,
      version,
      status: "complete",
    }),

  reset: () =>
    set({
      status: "idle",
      error: null,
      result: null,
      version: null,
    }),

  clearError: () => set({ error: null, status: "idle" }),
}));

// Re-export types for convenience
export type { UnbiasJson, JourneyResult, Persona };
