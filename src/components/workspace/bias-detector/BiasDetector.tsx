import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useBiasDetector } from "@/hooks/useBiasDetector";
import { Button } from "@/components/ui/button";
import { GenerateButton } from "./GenerateButton";
import { BiasScoreDisplay } from "./BiasScoreDisplay";
import { PersonaTable } from "./PersonaTable";
import { ExplanationSection } from "./ExplanationSection";
import { RecommendationsSection } from "./RecommendationsSection";

export function BiasDetector() {
  const {
    status,
    error,
    journeyResults,
    result,
    generateBiasReport,
    clearError,
  } = useBiasDetector();

  const isLoading =
    status === "generating-personas" ||
    status === "simulating-journeys" ||
    status === "calculating-score";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-base text-muted-foreground leading-relaxed max-w-2xl">
            Generate a comprehensive bias analysis of your system design. The AI will
            create diverse test personas, simulate their journeys through your system,
            and identify potential barriers and exclusion patterns.
          </p>
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
                {status === "generating-personas" && "Creating diverse test personas..."}
                {status === "simulating-journeys" &&
                  `Simulating user journeys (${journeyResults.length} complete)...`}
                {status === "calculating-score" && "Calculating bias score..."}
              </span>
            </div>
            {journeyResults.length > 0 && status === "simulating-journeys" && (
              <div className="pl-5">
                <p className="font-display text-xs text-muted-foreground">
                  Latest: {journeyResults[journeyResults.length - 1]?.personaName} -{" "}
                  {journeyResults[journeyResults.length - 1]?.outcomeLabel}
                </p>
              </div>
            )}
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
              score={result.analysis.overallScore}
              label={result.analysis.scoreLabel}
            />

            <PersonaTable results={result.journeyResults} />

            <ExplanationSection analysis={result.analysis} />

            <RecommendationsSection
              recommendations={result.analysis.recommendations}
            />

            <p className="font-display text-xs text-muted-foreground text-center">
              Analysis generated at{" "}
              {result.generatedAt.toLocaleString()} for "{result.inputSummary.idea}"
              with {result.inputSummary.componentCount} architecture components.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
