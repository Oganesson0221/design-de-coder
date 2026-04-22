import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useBiasDetector } from "@/hooks/useBiasDetector";
import { Button } from "@/components/ui/button";
import { GenerateButton } from "./GenerateButton";
import { BiasScoreDisplay } from "./BiasScoreDisplay";
import { PersonaTable } from "./PersonaTable";
import { ExplanationSection } from "./ExplanationSection";
import { RecommendationsSection } from "./RecommendationsSection";

interface BiasDetectorProps {
  projectId: string;
}

export function BiasDetector({ projectId }: BiasDetectorProps) {
  const {
    status,
    error,
    result,
    version,
    generateBiasReport,
    loadExistingResult,
    clearError,
  } = useBiasDetector(projectId);

  useEffect(() => {
    if (projectId) {
      loadExistingResult();
    }
  }, [projectId, loadExistingResult]);

  const isLoading =
    status === "loading-project" ||
    status === "generating-personas" ||
    status === "simulating-journeys" ||
    status === "calculating-score";

  if (!projectId) {
    return (
      <div className="border border-foreground/20 bg-card p-6 text-center">
        <p className="font-display text-muted-foreground">
          No project selected. Please select a project to analyze for bias.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-base text-muted-foreground leading-relaxed max-w-2xl">
            Generate a comprehensive bias analysis of your system design. The AI will
            create diverse test personas, simulate their journeys through your system,
            and identify potential barriers and exclusion patterns.
          </p>
          {version && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Project: {projectId} | Version: {version}
            </p>
          )}
        </div>
        <GenerateButton
          status={status}
          onGenerate={generateBiasReport}
          hasResult={result !== null}
        />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-destructive/30 bg-destructive/5 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-display text-sm font-medium text-destructive">
                Analysis Failed
              </h4>
              <p className="mt-1 font-display text-sm text-destructive/80">
                {error.message}
              </p>
              {error.retryable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearError}
                  className="mt-3"
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-foreground/20 bg-card p-6"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-display text-sm">
                {status === "loading-project" && "Loading project data..."}
                {status === "generating-personas" && "Generating bias analysis (this may take a minute)..."}
                {status === "simulating-journeys" && "Simulating user journeys..."}
                {status === "calculating-score" && "Calculating bias score..."}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {result && status === "complete" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <BiasScoreDisplay
              score={result.overall_score}
              label={result.score_label}
            />

            <PersonaTable results={result.journey_results} />

            <ExplanationSection
              metrics={result.metrics}
              explanation={result.explanation}
              methodology={result.methodology}
            />

            <RecommendationsSection
              recommendations={result.recommendations}
            />

            <p className="font-display text-xs text-muted-foreground text-center">
              Analysis version {version} for project {projectId}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
