import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { NavLink } from "./NavLink";
import { Link } from "react-router-dom";

export const SiteHeader = () => (
  <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/85 backdrop-blur">
    <div className="container flex h-16 items-center justify-between">
      <Logo />
      <nav className="hidden items-center gap-7 md:flex">
        {[
          { to: "/workspace", label: "Workspace" },
          { to: "/workspace?tab=learn", label: "Lessons" },
          { to: "/workspace?tab=deconstruct", label: "Deconstruction" },
        ].map((l) => (
          <NavLink
            key={l.label}
            to={l.to}
            className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-smooth hover:text-foreground"
            activeClassName="text-foreground"
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Button asChild variant="hero" size="sm">
        <Link to="/onboarding">Begin →</Link>
      </Button>
    </div>
  </header>
);
