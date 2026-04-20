import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export const Logo = ({ to = "/" }: { to?: string }) => (
  <Link to={to} className="group flex items-baseline gap-2.5">
    <span className="font-display text-2xl font-bold tracking-tight text-foreground">
      Archway
    </span>
    <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
      Vol. I
    </span>
  </Link>
);
