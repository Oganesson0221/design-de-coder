import type { PersonaJourneyResult } from "@/types/bias";
import { Check, X, AlertTriangle, MinusCircle, LogOut } from "lucide-react";

interface PersonaTableProps {
  results: PersonaJourneyResult[];
}

function getOutcomeIcon(outcome: PersonaJourneyResult["outcome"]) {
  switch (outcome) {
    case "success":
      return <Check className="h-4 w-4 text-green-600" />;
    case "partial":
      return <AlertTriangle className="h-4 w-4 text-primary" />;
    case "rejected":
      return <X className="h-4 w-4 text-destructive" />;
    case "filtered":
      return <MinusCircle className="h-4 w-4 text-orange-500" />;
    case "abandoned":
      return <LogOut className="h-4 w-4 text-muted-foreground" />;
    default:
      return null;
  }
}

function getOutcomeClass(outcome: PersonaJourneyResult["outcome"]): string {
  switch (outcome) {
    case "success":
      return "text-green-600";
    case "partial":
      return "text-primary";
    case "rejected":
      return "text-destructive";
    case "filtered":
      return "text-orange-500";
    case "abandoned":
      return "text-muted-foreground";
    default:
      return "";
  }
}

export function PersonaTable({ results }: PersonaTableProps) {
  if (results.length === 0) return null;

  return (
    <div className="border border-foreground/20 bg-card">
      <div className="border-b border-foreground/10 bg-secondary/30 px-4 py-3">
        <h3 className="label-caps">Persona Simulation Results</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-foreground/10 text-left">
              <th className="px-4 py-3 font-display text-sm font-medium">Persona</th>
              <th className="px-4 py-3 font-display text-sm font-medium">Outcome</th>
              <th className="px-4 py-3 font-display text-sm font-medium">Problem</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr
                key={result.personaId}
                className="border-b border-foreground/5 last:border-0"
              >
                <td className="px-4 py-3">
                  <span className="font-display text-sm font-medium">
                    {result.personaName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className={`flex items-center gap-2 ${getOutcomeClass(result.outcome)}`}>
                    {getOutcomeIcon(result.outcome)}
                    <span className="font-display text-sm">{result.outcomeLabel}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-display text-sm text-muted-foreground">
                    {result.problem || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
