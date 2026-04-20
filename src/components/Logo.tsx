import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const Logo = ({ to = "/" }: { to?: string }) => (
  <Link to={to} className="group flex items-center gap-2">
    <span className="relative grid h-9 w-9 place-items-center rounded-2xl bg-warm shadow-soft transition-bounce group-hover:rotate-[-8deg]">
      <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      <span className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-primary/30 blur-xl" />
    </span>
    <span className="font-display text-2xl font-black tracking-tight">archway</span>
  </Link>
);
