import { useCallback } from "react";
import { useBiasStore } from "@/stores/bias";
import { biasApi } from "@/services/biasApi";

export function useBiasDetector(projectId: string) {
  const {
    status,
    error,
    result,
    version,
    setStatus,
    setError,
    setProjectId,
    setResult,
    reset,
    clearError,
  } = useBiasStore();

  const loadExistingResult = useCallback(async () => {
    if (!projectId) return;

    setProjectId(projectId);
    setStatus("loading-project");

    try {
      const response = await biasApi.getBiasResult(projectId);
      setResult(response.result, response.version);
    } catch {
      // No existing result, that's okay
      setStatus("idle");
    }
  }, [projectId, setProjectId, setStatus, setResult]);

  const generateBiasReport = useCallback(async () => {
    if (!projectId) {
      setError({
        stage: "idle",
        message: "No project ID provided",
        retryable: false,
      });
      return;
    }

    reset();
    setProjectId(projectId);

    try {
      setStatus("generating-personas");

      const response = await biasApi.generateBiasAnalysis(projectId);

      if (response.success) {
        setResult(response.result, response.version);
      } else {
        throw new Error("Failed to generate bias analysis");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError({
        stage: useBiasStore.getState().status,
        message,
        retryable: true,
      });
    }
  }, [projectId, reset, setProjectId, setStatus, setResult, setError]);

  return {
    status,
    error,
    result,
    version,
    projectId,
    generateBiasReport,
    loadExistingResult,
    reset,
    clearError,
  };
}
