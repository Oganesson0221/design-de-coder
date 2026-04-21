import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { BiasAnalysisResult } from "@/types/bias";

interface ExplanationSectionProps {
  analysis: BiasAnalysisResult;
}

export function ExplanationSection({ analysis }: ExplanationSectionProps) {
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
                  {analysis.methodology}
                </p>
              </div>

              <div>
                <h4 className="font-display text-sm font-medium mb-2">Analysis</h4>
                <p className="font-display text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {analysis.explanation}
                </p>
              </div>

              <div>
                <h4 className="font-display text-sm font-medium mb-3">Metric Breakdown</h4>
                <div className="space-y-3">
                  {analysis.metrics.map((metric) => (
                    <div
                      key={metric.name}
                      className="border border-foreground/10 p-3 bg-secondary/20"
                    >
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-display text-sm font-medium">
                          {metric.name}
                        </span>
                        <span className="font-mono text-sm">
                          {Math.round(metric.score)}/100
                          <span className="text-muted-foreground text-xs ml-1">
                            ({Math.round(metric.weight * 100)}% weight)
                          </span>
                        </span>
                      </div>
                      <p className="font-display text-xs text-muted-foreground mb-2">
                        {metric.description}
                      </p>
                      {metric.findings.length > 0 && (
                        <ul className="list-disc list-inside space-y-0.5">
                          {metric.findings.map((finding, i) => (
                            <li
                              key={i}
                              className="font-display text-xs text-muted-foreground"
                            >
                              {finding}
                            </li>
                          ))}
                        </ul>
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
