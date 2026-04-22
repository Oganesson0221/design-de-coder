import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProject } from "@/stores/project";
import { Button } from "@/components/ui/button";
import {
  ExternalLink, Lightbulb, Zap, Loader2, Award,
  CheckCircle2, AlertCircle, ArrowRight, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// ── Diagram types ──────────────────────────────────────────────────────────────
const DIAGRAM_TYPES = [
  {
    id: "event-flow",
    label: "Event Flow",
    description: "User actions → system responses in sequence",
    docsUrl: "https://miro.com/blog/event-driven-architecture/",
  },
  {
    id: "dialog-map",
    label: "Dialog Map",
    description: "Screen states and transitions between them",
    docsUrl: "https://www.nngroup.com/articles/dialog-maps/",
  },
  {
    id: "data-flow",
    label: "Data Flow",
    description: "How data moves through processes and stores",
    docsUrl: "https://www.lucidchart.com/pages/data-flow-diagram",
  },
  {
    id: "sequence",
    label: "Sequence",
    description: "Time-ordered messages between actors",
    docsUrl: "https://www.uml-diagrams.org/sequence-diagrams.html",
  },
  {
    id: "er-diagram",
    label: "ER Diagram",
    description: "Entities, attributes, and relationships",
    docsUrl: "https://www.lucidchart.com/pages/er-diagrams",
  },
];

const DRAWIO_EMBED =
  "https://embed.diagrams.net/?embed=1&proto=json&ui=min&noSaveBtn=1&noExitBtn=1&spin=1&libraries=0&lang=en";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Exercise {
  task: string;
  hint: string;
  evaluationCriteria: string[];
  diagramType: string;
}

interface EvalResult {
  passed: boolean;
  score: number;
  feedback: string;
  whatYouDidWell: string[];
  whatCouldBeBetter: string[];
  specificImprovements: string[];
  hints: string[];
  pointsAwarded: number;
}

// ── PMDiagramBuilder ───────────────────────────────────────────────────────────
export const PMDiagramBuilder = () => {
  const projectId = useProject((s) => s.projectId);
  const awardPoints = useProject((s) => s.awardPoints);
  const awardBadge = useProject((s) => s.awardBadge);
  const badges = useProject((s) => s.badges);

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const initSentRef = useRef(false);

  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);
  // Pending evaluate — set when we need XML but iframe isn't ready yet
  const pendingEvalRef = useRef(false);
  // Resolve callback for XML capture
  const xmlResolveRef = useRef<((xml: string) => void) | null>(null);

  // ── draw.io iframe message handler ──────────────────────────────────────────
  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      let msg: Record<string, unknown> = {};
      try {
        if (typeof ev.data === "string") msg = JSON.parse(ev.data) as Record<string, unknown>;
        else if (typeof ev.data === "object" && ev.data !== null) msg = ev.data as Record<string, unknown>;
      } catch { return; }

      const event = msg.event as string | undefined;

      if (event === "init" || event === "load") {
        if (!initSentRef.current) {
          initSentRef.current = true;
          // Load a blank canvas
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ action: "load", xml: "<mxGraphModel/>" }),
            "*"
          );
        }
        setIframeReady(true);

        // If evaluate was triggered before iframe was ready, proceed now
        if (pendingEvalRef.current) {
          pendingEvalRef.current = false;
          triggerExport();
        }
      }

      if (event === "export") {
        const xml = (msg.xml as string) ?? (msg.data as string) ?? "";
        if (xmlResolveRef.current) {
          xmlResolveRef.current(xml);
          xmlResolveRef.current = null;
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset iframe when diagram type changes
  useEffect(() => {
    setIframeReady(false);
    initSentRef.current = false;
    setResult(null);
    setHintVisible(false);
  }, [selectedType]);

  // ── Load exercise from LLM ───────────────────────────────────────────────────
  const loadExercise = useCallback(async (typeId: string) => {
    if (!projectId) { toast("No project loaded."); return; }
    setLoadingExercise(true);
    setExercise(null);
    setResult(null);
    setHintVisible(false);
    try {
      const res = await fetch("/api/pm/diagram-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, diagramType: typeId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as Exercise;
      setExercise(data);
    } catch {
      toast("Could not load exercise — check the backend is running.");
    } finally {
      setLoadingExercise(false);
    }
  }, [projectId]);

  const selectType = (typeId: string) => {
    setSelectedType(typeId);
    void loadExercise(typeId);
  };

  // ── Export + evaluate ────────────────────────────────────────────────────────
  const triggerExport = () => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ action: "export", format: "xml" }),
      "*"
    );
  };

  const captureXmlAndEvaluate = async () => {
    if (!projectId) { toast("No project loaded."); return; }
    setEvaluating(true);
    setResult(null);

    try {
      // Get XML from draw.io
      const xml = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("timeout")), 8000);
        xmlResolveRef.current = (xml) => {
          clearTimeout(timeout);
          resolve(xml);
        };

        if (iframeReady) {
          triggerExport();
        } else {
          pendingEvalRef.current = true;
        }
      });

      const res = await fetch("/api/pm/evaluate-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          diagramType: selectedType,
          task: exercise?.task ?? "",
          diagramXml: xml,
        }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json() as EvalResult;
      setResult(data);

      if (data.pointsAwarded > 0) {
        awardPoints(data.pointsAwarded);
        toast(`+${data.pointsAwarded} points earned!`);
      }
      if (data.passed && !badges.includes("first-draft")) {
        awardBadge("first-draft");
        toast("Badge unlocked: First Draft");
      }
    } catch {
      toast("Could not evaluate — check the backend is running.");
    } finally {
      setEvaluating(false);
    }
  };

  const selectedTypeMeta = DIAGRAM_TYPES.find((t) => t.id === selectedType);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">

      {/* ── Diagram type picker ── */}
      <div className="shrink-0 border-b border-foreground/15 bg-background px-4 py-3">
        <div className="label-caps mb-2">Choose a diagram type</div>
        <div className="flex flex-wrap gap-2">
          {DIAGRAM_TYPES.map((t) => {
            const active = selectedType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => selectType(t.id)}
                title={t.description}
                className={`flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-all ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/20 bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── No type selected yet ── */}
      {!selectedType && (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="label-caps mb-2">Select a diagram type above</div>
          <p className="max-w-sm font-display text-sm italic text-muted-foreground">
            An exercise will be generated for your specific product idea.
            You'll draw in the canvas below, then get detailed feedback.
          </p>
        </div>
      )}

      {/* ── Type selected ── */}
      {selectedType && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

          {/* Exercise card */}
          <div className="shrink-0 border-b border-foreground/15 bg-card px-4 py-3">
            {loadingExercise ? (
              <div className="flex items-center gap-2 py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="font-mono text-[10px] text-muted-foreground">Generating exercise…</span>
              </div>
            ) : exercise ? (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="label-caps mb-1">{selectedTypeMeta?.label} exercise</div>
                    <p className="font-display text-sm leading-relaxed">{exercise.task}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => setHintVisible((v) => !v)}
                      className={`flex items-center gap-1 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition-all ${
                        hintVisible
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-foreground/20 text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      <Lightbulb className="h-3 w-3" />
                      Hint
                    </button>
                    <a
                      href={selectedTypeMeta?.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 border border-foreground/20 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
                    >
                      Docs <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    <button
                      onClick={() => void loadExercise(selectedType)}
                      title="Generate a new exercise"
                      className="flex items-center gap-1 border border-foreground/20 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {hintVisible && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-l-2 border-primary bg-secondary/40 px-3 py-2">
                        <div className="label-caps mb-0.5 text-[8px]">Hint</div>
                        <p className="font-display text-xs italic leading-relaxed text-foreground/80">
                          {exercise.hint}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <p className="font-display text-sm italic text-muted-foreground">
                Could not load exercise. Check the backend is running.
              </p>
            )}
          </div>

          {/* draw.io canvas */}
          <div className="relative min-h-0 flex-1">
            {!iframeReady && selectedType && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-paper">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  Loading canvas…
                </span>
              </div>
            )}
            <iframe
              key={selectedType}
              ref={iframeRef}
              src={DRAWIO_EMBED}
              className="h-full w-full border-0"
              title="Diagram canvas"
              allow="clipboard-write"
            />
          </div>

          {/* Evaluate bar + results */}
          <div className="shrink-0 overflow-y-auto border-t border-foreground/15 bg-card p-4">
            <Button
              onClick={() => void captureXmlAndEvaluate()}
              disabled={evaluating || !exercise}
              variant="hero"
              className="w-full"
            >
              {evaluating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Evaluating…</>
              ) : (
                <><Zap className="h-4 w-4" /> Evaluate my diagram</>
              )}
            </Button>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 space-y-3"
                >
                  {/* Score + pass/fail */}
                  <div className="flex items-center justify-between border border-foreground/15 bg-paper px-4 py-3">
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-foreground" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      <span className="font-display font-medium">
                        {result.passed ? "Diagram passes" : "Keep refining"}
                      </span>
                    </div>
                    <span className="font-display text-2xl font-medium">{result.score}/100</span>
                  </div>

                  {/* Score bar */}
                  <div className="h-1.5 w-full overflow-hidden bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.score}%` }}
                      transition={{ duration: 0.6 }}
                      className={`h-full ${result.score >= 65 ? "bg-foreground" : "bg-destructive"}`}
                    />
                  </div>

                  {/* Overall feedback */}
                  <div className="border-l-2 border-primary bg-secondary/40 p-3">
                    <div className="label-caps mb-1">— Mentor's assessment —</div>
                    <p className="font-display text-sm italic leading-relaxed">{result.feedback}</p>
                  </div>

                  {/* What you did well */}
                  {result.whatYouDidWell?.length > 0 && (
                    <div className="border border-foreground/15 bg-paper p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-foreground/60" />
                        <div className="label-caps">What you did well</div>
                      </div>
                      <ul className="space-y-1.5">
                        {result.whatYouDidWell.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                            <span className="font-display text-xs leading-relaxed text-foreground/80">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What could be better */}
                  {result.whatCouldBeBetter?.length > 0 && (
                    <div className="border border-foreground/15 bg-paper p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-destructive/60" />
                        <div className="label-caps">What could be better</div>
                      </div>
                      <ul className="space-y-1.5">
                        {result.whatCouldBeBetter.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/40" />
                            <span className="font-display text-xs leading-relaxed text-foreground/80">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Specific improvements */}
                  {result.specificImprovements?.length > 0 && (
                    <div className="border border-foreground/15 bg-paper p-3">
                      <div className="label-caps mb-2">Specific improvements</div>
                      <ul className="space-y-1.5">
                        {result.specificImprovements.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                            <span className="font-display text-xs leading-relaxed text-foreground/80">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Points */}
                  {result.pointsAwarded > 0 && (
                    <div className="flex items-center gap-2 border border-foreground/20 bg-card px-3 py-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-display text-sm font-medium">+{result.pointsAwarded} points awarded</span>
                    </div>
                  )}

                  {/* Try again nudge if not passed */}
                  {!result.passed && (
                    <p className="font-display text-xs italic text-muted-foreground">
                      Draw some more, then evaluate again — the canvas remembers your work.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
