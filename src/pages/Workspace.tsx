import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject } from "@/stores/project";
import { DiagramCanvas } from "@/components/workspace/DiagramCanvas";
import { ComponentDetail } from "@/components/workspace/ComponentDetail";
import { MentorChat } from "@/components/workspace/MentorChat";
import { MessageCircle, Layers, ArrowLeft } from "lucide-react";

const Workspace = () => {
  const onboarded = useProject((s) => s.onboarded);
  const components = useProject((s) => s.components);
  const idea = useProject((s) => s.answers.idea);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"detail" | "mentor">("mentor");

  // Auto-switch to detail when a component is selected
  useEffect(() => {
    if (selectedId) setRightTab("detail");
  }, [selectedId]);

  if (!onboarded) return <Navigate to="/onboarding" replace />;

  const selected = components.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border/60 bg-card/80 px-4 backdrop-blur">
        <Logo />
        <div className="hidden h-6 w-px bg-border md:block" />
        <div className="hidden min-w-0 flex-1 md:block">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Project</div>
          <div className="truncate text-sm font-medium">{idea || "Untitled idea"}</div>
        </div>

        <Tabs defaultValue="workspace" className="hidden md:block">
          <TabsList className="rounded-full bg-muted">
            <TabsTrigger value="workspace" className="rounded-full data-[state=active]:bg-card">Workspace</TabsTrigger>
            <TabsTrigger value="learn" disabled className="rounded-full">Role-based learning</TabsTrigger>
            <TabsTrigger value="deconstruct" disabled className="rounded-full">Deconstruct</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button asChild variant="ghost" size="sm" className="ml-auto rounded-full">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </Button>
      </header>

      {/* Main two-pane */}
      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <DiagramCanvas selectedId={selectedId} onSelect={setSelectedId} />
        </main>

        <aside className="hidden w-[380px] shrink-0 flex-col border-l border-border/60 bg-card/60 backdrop-blur md:flex">
          <div className="flex shrink-0 gap-1 border-b border-border/60 p-2">
            <button
              onClick={() => setRightTab("mentor")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-smooth ${
                rightTab === "mentor" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <MessageCircle className="h-4 w-4" /> Mentor
            </button>
            <button
              onClick={() => setRightTab("detail")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-smooth ${
                rightTab === "detail" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Layers className="h-4 w-4" /> Component
            </button>
          </div>

          <div className="min-h-0 flex-1">
            {rightTab === "mentor" ? (
              <MentorChat />
            ) : selected ? (
              <ComponentDetail component={selected} onClose={() => setSelectedId(null)} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-secondary">
                  <Layers className="h-7 w-7 text-secondary-foreground" />
                </div>
                <h3 className="font-display text-lg font-bold">Click any component</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tap a node on the canvas to see what it does, why it's there, and what you could use instead.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Workspace;
