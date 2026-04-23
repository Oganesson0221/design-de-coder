import type { BiasRecommendation } from "@/services/biasApi";
import { AlertCircle, AlertTriangle, Info, Lightbulb } from "lucide-react";

interface RecommendationsSectionProps {
  recommendations: BiasRecommendation[];
}

type Priority = BiasRecommendation["priority"];

const priorityConfig: Record<
  Priority,
  { icon: typeof AlertCircle; label: string; className: string }
> = {
  critical: {
    icon: AlertCircle,
    label: "Critical",
    className: "text-destructive border-destructive/30 bg-destructive/5",
  },
  high: {
    icon: AlertTriangle,
    label: "High",
    className: "text-orange-600 border-orange-300 bg-orange-50",
  },
  medium: {
    icon: Lightbulb,
    label: "Medium",
    className: "text-primary border-primary/30 bg-primary/5",
  },
  low: {
    icon: Info,
    label: "Low",
    className: "text-muted-foreground border-foreground/20 bg-secondary/30",
  },
};

export function RecommendationsSection({
  recommendations,
}: RecommendationsSectionProps) {
  if (!recommendations || recommendations.length === 0) return null;

  const sorted = [...recommendations].sort((a, b) => {
    const order: Priority[] = ["critical", "high", "medium", "low"];
    return order.indexOf(a.priority) - order.indexOf(b.priority);
  });

  return (
    <div className="border border-foreground/20 bg-card">
      <div className="border-b border-foreground/10 bg-secondary/30 px-4 py-3">
        <h3 className="label-caps">Recommendations</h3>
      </div>
      <div className="p-4 space-y-3">
        {sorted.map((rec) => {
          const config = priorityConfig[rec.priority];
          const Icon = config.icon;

          return (
            <div
              key={rec.id}
              className={`border p-4 ${config.className}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h4 className="font-display text-sm font-medium">
                      {rec.title}
                    </h4>
                    <span className="font-mono text-xs uppercase opacity-70">
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-sm opacity-90">
                    {rec.description}
                  </p>
                  {rec.affectedPersonas && rec.affectedPersonas.length > 0 && (
                    <p className="mt-2 font-display text-xs opacity-70">
                      Benefits: {rec.affectedPersonas.join(", ")}
                    </p>
                  )}
                  {rec.implementationHint && (
                    <p className="mt-1 font-display text-xs opacity-70 italic">
                      Hint: {rec.implementationHint}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
