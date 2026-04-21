import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { NavLink } from "./NavLink";
import { Link } from "react-router-dom";
import { PointsHUD } from "./PointsHUD";

export const SiteHeader = () => (
  <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/90 backdrop-blur">
    <div className="container flex h-16 items-center justify-between">
      <Logo />
      <nav className="hidden items-center gap-1 md:flex">
        {[
          { to: "/workspace", label: "Build" },
          { to: "/workspace?tab=learn", label: "Roleplay" },
          { to: "/workspace?tab=deconstruct", label: "Reverse-eng" },
          { to: "/community", label: "Community" },
          { to: "/mentor", label: "Mentors" },
        ].map((l) => (
          <NavLink
            key={l.label}
            to={l.to}
            className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
            activeClassName="text-foreground bg-secondary"
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <PointsHUD />
        <Button asChild variant="hero" size="sm">
          <Link to="/onboarding">ship it →</Link>
        </Button>
      </div>
    </div>
  </header>
);
