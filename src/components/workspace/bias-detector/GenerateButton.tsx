import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import type { BiasDetectionStatus } from "@/types/bias";

interface GenerateButtonProps {
  status: BiasDetectionStatus;
  onGenerate: () => void;
  hasResult: boolean;
}

const statusLabels: Record<BiasDetectionStatus, string> = {
  idle: "Generate Bias Score",
  "generating-personas": "Generating test personas...",
  "simulating-journeys": "Simulating user journeys...",
  "calculating-score": "Calculating bias score...",
  complete: "Regenerate Bias Score",
  error: "Retry Analysis",
};

export function GenerateButton({
  status,
  onGenerate,
  hasResult,
}: GenerateButtonProps) {
  const isLoading =
    status === "generating-personas" ||
    status === "simulating-journeys" ||
    status === "calculating-score";

  const Icon = hasResult ? RefreshCw : Sparkles;

  return (
    <Button
      onClick={onGenerate}
      disabled={isLoading}
      size="lg"
      className="gap-2 font-display"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {statusLabels[status]}
    </Button>
  );
}
