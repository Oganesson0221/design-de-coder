import { useEffect, useState } from "react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useProject } from "@/stores/project";
import { DiagramCanvas } from "@/components/workspace/DiagramCanvas";
import { ComponentDetail } from "@/components/workspace/ComponentDetail";
import { MentorChat } from "@/components/workspace/MentorChat";
import RoleLearning from "@/components/workspace/RoleLearning";
import Deconstruct from "@/components/workspace/Deconstruct";
import { MessageCircle, FileText, ArrowLeft } from "lucide-react";

type Tab = "workspace" | "learn" | "deconstruct";

const TABS: { id: Tab; label: string; numeral: string }[] = [
  { id: "workspace", label: "Workspace", numeral: "I." },
  { id: "learn", label: "Lessons", numeral: "II." },
  { id: "deconstruct", label: "Deconstruction", numeral: "III." },
];

const Workspace = () => {
  const onboarded = useProject((s) => s.onboarded);
  const components = useProject((s) => s.components);
  const idea = useProject((s) => s.answers.idea);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "workspace";
  const [tab, setTab] = useState<Tab>(
    ["workspace", "learn", "deconstruct"].includes(initialTab) ? initialTab : "workspace"
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"detail" | "mentor">("mentor");

  useEffect(() => {
    if (selectedId) setRightTab("detail");
  }, [selectedId]);

  useEffect(() => {
    if (tab === "workspace") {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", tab);
    }
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (!onboarded) return <Navigate to="/onboarding" replace />;

  const selected = components.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-paper">
      {/* Top bar — masthead */}
      <header className="shrink-0 border-b-2 border-foreground bg-background">
        <div className="flex h-14 items-center gap-6 px-5">
          <Logo />
          <div className="hidden h-6 w-px bg-foreground/20 md:block" />
          <div className="hidden min-w-0 flex-1 md:block">
            <div className="label-caps">Manuscript</div>
            <div className="truncate font-display text-sm italic text-foreground">
              “{idea || "Untitled idea"}”
            </div>
          </div>

          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </Button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-px border-t border-foreground/15 bg-foreground/15 px-0">
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

      {/* Content */}
      <div className="flex min-h-0 flex-1">
        {tab === "workspace" && (
          <>
            <main className="relative min-w-0 flex-1">
              <DiagramCanvas selectedId={selectedId} onSelect={setSelectedId} />
            </main>

            <aside className="hidden w-[380px] shrink-0 flex-col border-l border-foreground/15 bg-card md:flex">
              <div className="flex shrink-0 border-b border-foreground/15">
                <button
                  onClick={() => setRightTab("mentor")}
                  className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-smooth ${
                    rightTab === "mentor" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Mentor
                </button>
                <button
                  onClick={() => setRightTab("detail")}
                  className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-smooth ${
                    rightTab === "detail" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> Component
                </button>
              </div>

              <div className="min-h-0 flex-1">
                {rightTab === "mentor" ? (
                  <MentorChat />
                ) : selected ? (
                  <ComponentDetail component={selected} onClose={() => setSelectedId(null)} />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <div className="label-caps mb-3">No entry selected</div>
                    <h3 className="font-display text-xl font-medium">Click any component on the page</h3>
                    <p className="mt-3 max-w-xs font-display text-sm italic text-muted-foreground">
                      Each carries an annotation: what it does, why it is here, and what one might use instead.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </>
        )}

        {tab === "learn" && <RoleLearning />}
        {tab === "deconstruct" && <Deconstruct />}
      </div>
    </div>
  );
};

export default Workspace;
