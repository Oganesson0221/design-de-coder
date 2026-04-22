import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { BiasMetric } from "@/services/biasApi";

interface ExplanationSectionProps {
  metrics: BiasMetric[];
  explanation: string;
  methodology: string;
}

export function ExplanationSection({ metrics, explanation, methodology }: ExplanationSectionProps) {
  return (
    <div className="border border-foreground/20 bg-card">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="explanation" className="border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <span className="label-caps">How the Bias Score Was Calculated</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-display text-sm font-medium mb-2">Methodology</h4>
                <p className="font-display text-sm text-muted-foreground leading-relaxed">
                  {methodology}
                </p>
              </div>

              <div>
                <h4 className="font-display text-sm font-medium mb-2">Analysis</h4>
                <p className="font-display text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {explanation}
                </p>
              </div>

              <div>
                <h4 className="font-display text-sm font-medium mb-3">Metric Breakdown</h4>
                <div className="space-y-3">
                  {metrics.map((metric) => (
                    <div
                      key={metric.metric}
                      className="border border-foreground/10 p-3 bg-secondary/20"
                    >
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-display text-sm font-medium">
                          {metric.metric}
                        </span>
                        <span className="font-mono text-sm">
                          {Math.round(metric.current_score)}/100
                          <span className="text-muted-foreground text-xs ml-1">
                            (target: {metric.target})
                          </span>
                        </span>
                      </div>
                      <p className="font-display text-xs text-muted-foreground mb-2">
                        {metric.definition}
                      </p>
                      {metric.bias_scoring_strategy && (
                        <p className="font-display text-xs text-muted-foreground/70 italic">
                          {metric.bias_scoring_strategy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
