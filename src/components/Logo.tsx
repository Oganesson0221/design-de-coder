import { Link } from "react-router-dom";

export const Logo = ({ to = "/" }: { to?: string }) => (
  <Link to={to} className="group flex items-center gap-2.5">
    <span className="flex h-8 w-8 items-center justify-center border-2 border-foreground bg-secondary font-mono text-sm font-bold text-foreground shadow-stamp-sm transition-spring group-hover:-rotate-6 group-hover:bg-accent group-hover:text-accent-foreground">
      A/
    </span>
    <span className="font-display text-xl font-bold tracking-tight text-foreground">
      archway
      <span className="text-accent">.</span>
      <span className="ml-1 align-middle font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        v0.1
      </span>
    </span>
  </Link>
);
