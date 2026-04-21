import { useProject } from "@/stores/project";
import { Trophy, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const PointsHUD = ({ compact = false }: { compact?: boolean }) => {
  const points = useProject((s) => s.points);
  const badges = useProject((s) => s.badges);
  const womanInTeam = useProject((s) => s.womanInTeam);

  return (
    <Link
      to="/community"
      className="group flex items-center gap-2 border-2 border-foreground bg-card px-2.5 py-1 shadow-stamp-sm transition-smooth hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-stamp"
      title={`${points} pts · ${badges.length} badges`}
    >
      <Trophy className="h-3.5 w-3.5 text-accent" />
      <span className="font-mono text-xs font-bold tabular-nums text-foreground">{points}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">pts</span>
      {!compact && badges.length > 0 && (
        <>
          <span className="h-3 w-px bg-foreground/30" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground">
            {badges.length} 🏷
          </span>
        </>
      )}
      {womanInTeam && (
        <span className="ml-1 flex items-center gap-1 border border-foreground bg-highlight/70 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-highlight-foreground">
          <Sparkles className="h-2.5 w-2.5" /> +she
        </span>
      )}
    </Link>
  );
};
