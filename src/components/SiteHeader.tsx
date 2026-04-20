import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { NavLink } from "./NavLink";
import { Link } from "react-router-dom";

export const SiteHeader = () => (
  <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
    <div className="container flex h-16 items-center justify-between">
      <Logo />
      <nav className="hidden items-center gap-1 md:flex">
        {[
          { to: "/workspace", label: "Workspace" },
          { to: "/learn", label: "Learn" },
          { to: "/community", label: "Community" },
          { to: "/mentors", label: "Mentors" },
        ].map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
            activeClassName="bg-secondary text-secondary-foreground"
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Button asChild variant="hero" size="sm" className="rounded-full">
        <Link to="/onboarding">Start building</Link>
      </Button>
    </div>
  </header>
);
