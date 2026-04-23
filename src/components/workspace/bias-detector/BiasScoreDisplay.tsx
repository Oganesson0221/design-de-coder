import { motion } from "framer-motion";

interface BiasScoreDisplayProps {
  score: number;
  label: string;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 70) return "text-foreground";
  if (score >= 50) return "text-primary";
  if (score >= 30) return "text-orange-500";
  return "text-destructive";
}

function getBarColor(score: number): string {
  if (score >= 90) return "bg-green-600";
  if (score >= 70) return "bg-foreground";
  if (score >= 50) return "bg-primary";
  if (score >= 30) return "bg-orange-500";
  return "bg-destructive";
}

export function BiasScoreDisplay({ score, label }: BiasScoreDisplayProps) {
  const displayScore = Math.round(score);
  const invertedScore = 100 - displayScore;

  return (
    <div className="border border-foreground/20 bg-card p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="label-caps">Bias Score</div>
          <p className="mt-1 font-display text-sm italic text-muted-foreground">
            {label}
          </p>
        </div>
        <span className={`font-display text-4xl font-medium ${getScoreColor(displayScore)}`}>
          {displayScore}/100
        </span>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden bg-muted rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${invertedScore}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${getBarColor(displayScore)}`}
        />
      </div>
      <p className="mt-3 font-display text-xs text-muted-foreground">
        Lower bar = more inclusive design. Score reflects weighted analysis of accessibility,
        language equity, economic access, cultural sensitivity, and more.
      </p>
    </div>
  );
}
