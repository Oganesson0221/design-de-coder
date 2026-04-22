import { useEffect, useState } from "react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useProject } from "@/stores/project";
import { WorkspaceCanvas } from "@/components/workspace/WorkspaceCanvas";
import { ComponentBrowser } from "@/components/workspace/ComponentBrowser";
import { MentorChat } from "@/components/workspace/MentorChat";
import { AdvancedConfig } from "@/components/workspace/AdvancedConfig";
import RoleLearning from "@/components/workspace/RoleLearning";
import Deconstruct from "@/components/workspace/Deconstruct";
import {
  MessageCircle, LayoutGrid, BookOpen, Settings2,
  ArrowLeft, Loader2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "workspace" | "learn" | "deconstruct";
type RightTab = "mentor" | "components" | "spec" | "advanced";

const TABS: { id: Tab; label: string; numeral: string }[] = [
  { id: "workspace",   label: "Workspace",   numeral: "I." },
  { id: "learn",       label: "Lessons",     numeral: "II." },
  { id: "deconstruct", label: "Deconstruct", numeral: "III." },
];

const RIGHT_TABS: { id: RightTab; label: string; icon: React.ElementType }[] = [
  { id: "mentor",     label: "Mentor",      icon: MessageCircle },
  { id: "components", label: "Components",  icon: LayoutGrid },
  { id: "spec",       label: "Spec",        icon: BookOpen },
  { id: "advanced",   label: "Config",      icon: Settings2 },
];

const Workspace = () => {
  const onboarded          = useProject((s) => s.onboarded);
  const idea               = useProject((s) => s.answers.idea);
  const requirementsDoc    = useProject((s) => s.requirementsDoc);
  const setRequirementsDoc = useProject((s) => s.setRequirementsDoc);
  const projectId          = useProject((s) => s.projectId);
  const setComponents      = useProject((s) => s.setComponents);
  const setConnections     = useProject((s) => s.setConnections);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "workspace";
  const [tab, setTab] = useState<Tab>(
    ["workspace", "learn", "deconstruct"].includes(initialTab) ? initialTab : "workspace"
  );
  const [rightTab, setRightTab] = useState<RightTab>("components");
  const [specDraft, setSpecDraft]   = useState(requirementsDoc);
  const [specEdited, setSpecEdited] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  useEffect(() => {
    setSpecDraft(requirementsDoc);
    setSpecEdited(false);
  }, [requirementsDoc]);

  useEffect(() => {
    if (tab === "workspace") searchParams.delete("tab");
    else searchParams.set("tab", tab);
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (!onboarded) return <Navigate to="/onboarding" replace />;

  const saveSpec = () => {
    setRequirementsDoc(specDraft);
    setSpecEdited(false);
    toast("Specification saved.");
  };

  const regenDiagram = async () => {
    if (!projectId) { toast("No project loaded."); return; }
    setRegenLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementsDoc: specDraft }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { components: unknown[]; connections: unknown[] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setComponents(data.components as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setConnections(data.connections as any);
      toast("Diagram regenerated.");
    } catch {
      toast("Could not regenerate — check backend.");
    } finally {
      setRegenLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-paper">
      {/* ── Top bar ── */}
      <header className="shrink-0 border-b-2 border-foreground bg-background">
        <div className="flex h-14 items-center gap-4 px-5">
          <Logo />
          <div className="hidden h-6 w-px bg-foreground/20 md:block" />
          <div className="hidden min-w-0 flex-1 md:block">
            <div className="label-caps text-[9px]">Manuscript</div>
            <div className="truncate font-display text-sm italic">
              "{idea || "Untitled idea"}"
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Home</Link>
          </Button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-px border-t border-foreground/15 bg-foreground/15">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-baseline justify-center gap-2 px-4 py-2.5 transition-smooth md:flex-none md:px-8 ${
                  active ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
                }`}
              >
                <span className={`font-display text-sm ${active ? "text-background/70" : "text-primary"}`}>
                  {t.numeral}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{t.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {tab === "workspace" && (
          <>
            {/* Canvas — includes its own left tech-library panel */}
            <main className="relative min-w-0 flex-1 overflow-hidden">
              <WorkspaceCanvas />
            </main>

            {/* Right panel */}
            <aside className="hidden w-[360px] shrink-0 flex-col border-l-2 border-foreground bg-card md:flex">
              {/* Tabs */}
              <div className="flex shrink-0 border-b border-foreground/15 bg-background">
                {RIGHT_TABS.map(({ id, label, icon: Icon }) => {
                  const active = rightTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setRightTab(id)}
                      title={label}
                      className={`flex flex-1 flex-col items-center justify-center gap-0.5 border-b-2 py-2.5 transition-smooth ${
                        active
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="font-mono text-[8px] uppercase tracking-[0.12em]">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Panel body */}
              <div className="min-h-0 flex-1 overflow-hidden">

                {rightTab === "mentor" && <MentorChat />}

                {rightTab === "components" && <ComponentBrowser />}

                {rightTab === "spec" && (
                  <div className="flex h-full flex-col">
                    <div className="shrink-0 border-b border-foreground/15 px-4 py-3">
                      <div className="label-caps mb-0.5">Product Specification</div>
                      <p className="font-mono text-[9px] text-muted-foreground">
                        Edit freely — changes are local until saved.
                      </p>
                    </div>
                    <textarea
                      value={specDraft}
                      onChange={(e) => { setSpecDraft(e.target.value); setSpecEdited(true); }}
                      className="min-h-0 flex-1 resize-none bg-paper p-4 font-display text-sm leading-relaxed outline-none"
                      placeholder="Your product specification will appear here after onboarding…"
                    />
                    <div className="shrink-0 space-y-2 border-t border-foreground/15 p-3">
                      {specEdited && (
                        <Button onClick={saveSpec} variant="outline" className="w-full" size="sm">
                          Save changes
                        </Button>
                      )}
                      <Button
                        onClick={() => void regenDiagram()}
                        disabled={regenLoading}
                        variant="hero"
                        className="w-full"
                        size="sm"
                      >
                        {regenLoading
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Regenerating…</>
                          : <><RefreshCw className="h-3.5 w-3.5" /> Regenerate diagram</>
                        }
                      </Button>
                    </div>
                  </div>
                )}

                {rightTab === "advanced" && <AdvancedConfig />}

              </div>
            </aside>
          </>
        )}

        {tab === "learn"       && <RoleLearning />}
        {tab === "deconstruct" && <Deconstruct />}
      </div>
    </div>
  );
};

export default Workspace;
