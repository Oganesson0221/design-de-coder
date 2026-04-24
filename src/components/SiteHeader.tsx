import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { NavLink } from "./NavLink";
import { Link } from "react-router-dom";
import { useProject } from "@/stores/project";
import { listEngineerProjects, type EngineerProjectSummary } from "@/services/engineerApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const WORKSPACE_LINKS = [
  { to: "/workspace", tab: "", label: "Build" },
  { to: "/workspace?tab=learn", tab: "learn", label: "Roleplay" },
  { to: "/workspace?tab=deconstruct", tab: "deconstruct", label: "Reverse-eng" },
];

export const SiteHeader = () => {
  const navigate = useNavigate();
  const projectId = useProject((s) => s.projectId);
  const setProjectId = useProject((s) => s.setProjectId);
  const setOnboarded = useProject((s) => s.setOnboarded);

  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [projects, setProjects] = useState<EngineerProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showProjectPicker && projects.length === 0) {
      setLoading(true);
      listEngineerProjects()
        .then((res) => {
          setProjects(res.projects || []);
          // Pre-select current project if exists, otherwise first project
          if (projectId && (res.projects || []).some(p => p.projectId === projectId)) {
            setSelectedProject(projectId);
          } else if ((res.projects || []).length > 0) {
            setSelectedProject(res.projects[0].projectId);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (showProjectPicker && projects.length > 0) {
      // Re-select current project when dialog opens
      if (projectId && projects.some(p => p.projectId === projectId)) {
        setSelectedProject(projectId);
      }
    }
  }, [showProjectPicker, projects.length, projectId]);

  const handleWorkspaceClick = (e: React.MouseEvent, link: typeof WORKSPACE_LINKS[0]) => {
    // Always show project picker for workspace links
    e.preventDefault();
    setPendingNav(link.to);
    setShowProjectPicker(true);
  };

  const confirmProjectAndNavigate = () => {
    if (!selectedProject || !pendingNav) return;
    setProjectId(selectedProject);
    setOnboarded(true);
    const url = pendingNav.includes("?")
      ? `${pendingNav}&projectId=${encodeURIComponent(selectedProject)}`
      : `${pendingNav}?projectId=${encodeURIComponent(selectedProject)}`;
    navigate(url);
    setShowProjectPicker(false);
    setPendingNav(null);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {WORKSPACE_LINKS.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                onClick={(e) => handleWorkspaceClick(e, l)}
                className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
                activeClassName="text-foreground bg-secondary"
              >
                {l.label}
              </NavLink>
            ))}
            {[
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
            <Button asChild variant="hero" size="sm">
              <Link to="/onboarding">ship it →</Link>
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={showProjectPicker} onOpenChange={setShowProjectPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading projects...</p>
            ) : projects.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No projects found. Create one first.
                </p>
                <Button
                  onClick={() => {
                    setShowProjectPicker(false);
                    navigate("/onboarding");
                  }}
                  variant="hero"
                  className="w-full"
                >
                  Create New Project
                </Button>
              </div>
            ) : (
              <>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                >
                  {projects.map((p) => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.title?.trim() ? p.title : p.projectId}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button
                    onClick={confirmProjectAndNavigate}
                    disabled={!selectedProject}
                    variant="hero"
                    className="flex-1"
                  >
                    Open Project
                  </Button>
                  <Button
                    onClick={() => {
                      setShowProjectPicker(false);
                      navigate("/onboarding");
                    }}
                    variant="outline"
                  >
                    New Project
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
