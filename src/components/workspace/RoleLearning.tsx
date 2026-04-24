import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProject } from "@/stores/project";
import { Button } from "@/components/ui/button";
import { Check, Award, Loader2, ArrowRight, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { BiasDetector } from "./bias-detector";
import EngineerWorkbench from "@/components/workspace/EngineerWorkbench";
import { PMDiagramBuilder } from "./PMDiagramBuilder";
import { MentorChat } from "./MentorChat";

type Role = "pm" | "engineer" | "ethicist";

const ROLES: { id: Role; label: string; tagline: string; numeral: string }[] = [
  { id: "pm", label: "The Product Manager", tagline: "On users, value, and what to build first.", numeral: "I." },
  { id: "engineer", label: "The Engineer", tagline: "On scale, performance, and the cost of choices.", numeral: "II." },
  { id: "ethicist", label: "The Ethical Advisor", tagline: "On bias, fairness, and who is missing from the room.", numeral: "III." },
];

// ─── PM Section ───────────────────────────────────────────────────────────────

interface PMQuestion {
  question: string;
  hint: string;
  followUp: string;
}

interface AnswerEval {
  score: number;
  feedback: string;
  pointsAwarded: number;
  strengthsFound?: string[];
  improvement?: string;
}

type PMStage = "loading" | "questions" | "diagram";

function toProjectId(idea: string, audience: string, flow: string) {
  const raw = `${idea}|${audience}|${flow}`.trim() || "workspace";
  return `project_${raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 60)}`;
}

interface SavedAnswer {
  question: string;
  hint: string;
  followUp: string;
  answer: string;
  eval: AnswerEval | null;
}

const PMSection = ({ onStageChange, initialStage }: { onStageChange?: (stage: PMStage) => void; initialStage?: PMStage }) => {
  const answers = useProject((s) => s.answers);
  const storeProjectId = useProject((s) => s.projectId);
  const awardPoints = useProject((s) => s.awardPoints);

  const projectId = useMemo(
    () => storeProjectId || toProjectId(answers.idea, answers.audience, answers.flow),
    [storeProjectId, answers.idea, answers.audience, answers.flow]
  );

  const [stage, setStage] = useState<PMStage>(initialStage ?? "loading");
  const [questions, setQuestions] = useState<PMQuestion[]>([]);
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswer[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evalResult, setEvalResult] = useState<AnswerEval | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loadError, setLoadError] = useState(false);

  const changeStage = (s: PMStage) => {
    setStage(s);
    onStageChange?.(s);
  };

  // Persist Q&A state to DB
  const persistAnswers = useCallback(async (qs: PMQuestion[], ans: SavedAnswer[]) => {
    if (!projectId) return;
    try {
      await fetch(`/api/pm/progress/${encodeURIComponent(projectId)}/save-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: qs, answers: ans }),
      });
    } catch { /* noop */ }
  }, [projectId]);

  // Load saved progress on mount
  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    async function loadProgress() {
      try {
        const res = await fetch(`/api/pm/progress/${encodeURIComponent(projectId)}`);
        if (!res.ok || !mounted) return;
        const data = await res.json() as {
          questions: PMQuestion[];
          answers: SavedAnswer[];
          diagramResult?: unknown;
        };
        if (!mounted) return;
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          const ans = Array.isArray(data.answers) ? data.answers : [];
          setSavedAnswers(ans);
          // Figure out where to resume: find first unanswered question
          const nextUnanswered = ans.findIndex((a) => !a.eval);
          const resumeIdx = nextUnanswered === -1 ? ans.length : nextUnanswered;
          if (resumeIdx >= data.questions.length) {
            // All questions answered — go straight to diagram stage
            const earnedPts = ans.reduce((sum, a) => sum + (a.eval?.pointsAwarded ?? 0), 0);
            setTotalPoints(earnedPts);
            changeStage("diagram");
          } else {
            setCurrentQ(resumeIdx);
            // Restore state for a question that was answered but we're revisiting
            if (ans[resumeIdx]?.eval) {
              setAnswer(ans[resumeIdx].answer);
              setEvalResult(ans[resumeIdx].eval);
              setShowFollowUp(true);
            }
            const earnedPts = ans.slice(0, resumeIdx).reduce((sum, a) => sum + (a.eval?.pointsAwarded ?? 0), 0);
            setTotalPoints(earnedPts);
            changeStage("questions");
          }
        }
      } catch { /* noop */ }
    }
    void loadProgress();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadQuestions = async () => {
    if (!projectId) {
      setLoadError(true);
      return;
    }
    changeStage("loading");
    setLoadError(false);
    try {
      const res = await fetch("/api/pm/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { questions: PMQuestion[] };
      const qs = Array.isArray(data.questions) ? data.questions : [];
      if (qs.length === 0) throw new Error("empty");
      setQuestions(qs);
      setSavedAnswers([]);
      setCurrentQ(0);
      setAnswer("");
      setEvalResult(null);
      setShowFollowUp(false);
      changeStage("questions");
      // Persist the freshly generated questions immediately
      await persistAnswers(qs, []);
    } catch {
      setLoadError(true);
      changeStage("loading");
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || evaluating) return;
    setEvaluating(true);
    try {
      const res = await fetch("/api/pm/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          question: questions[currentQ].question,
          answer,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as AnswerEval;
      setEvalResult(data);
      if (data.pointsAwarded) {
        awardPoints(data.pointsAwarded);
        setTotalPoints((p) => p + data.pointsAwarded);
        toast(`+${data.pointsAwarded} points · keep thinking!`);
      }
      setShowFollowUp(true);
      // Persist this answer + its evaluation
      const updatedAnswers: SavedAnswer[] = [...savedAnswers];
      updatedAnswers[currentQ] = {
        question: questions[currentQ].question,
        hint: questions[currentQ].hint,
        followUp: questions[currentQ].followUp,
        answer,
        eval: data,
      };
      setSavedAnswers(updatedAnswers);
      await persistAnswers(questions, updatedAnswers);
    } catch {
      toast("Could not evaluate — check the backend is running.");
    } finally {
      setEvaluating(false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      const nextIdx = currentQ + 1;
      setCurrentQ(nextIdx);
      // Restore saved answer if already answered
      if (savedAnswers[nextIdx]?.eval) {
        setAnswer(savedAnswers[nextIdx].answer);
        setEvalResult(savedAnswers[nextIdx].eval);
        setShowFollowUp(true);
      } else {
        setAnswer("");
        setEvalResult(null);
        setShowFollowUp(false);
      }
    } else {
      changeStage("diagram");
    }
  };

  // Initial state — prompt to start
  if (stage === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {!projectId && (
          <p className="mb-4 font-display text-sm italic text-destructive">
            No project loaded. Please complete onboarding first.
          </p>
        )}
        {loadError && projectId && (
          <p className="mb-4 font-display text-sm italic text-destructive">
            Could not load questions — check the backend is running.
          </p>
        )}
        <div className="label-caps mb-4">— Stage I: PM Thinking —</div>
        <h3 className="mb-3 font-display text-2xl font-medium">
          Answer three questions about your product
        </h3>
        <p className="mb-8 max-w-md font-display text-sm italic text-muted-foreground">
          The AI will generate questions specific to "{answers.idea || "your idea"}" and evaluate your thinking.
          Then you'll build an event flow diagram.
        </p>
        <Button onClick={() => void loadQuestions()} variant="hero" disabled={!projectId}>
          <Loader2 className={`h-4 w-4 ${loadError || !projectId ? "hidden" : ""}`} />
          Start PM exercises <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (stage === "questions") {
    const q = questions[currentQ];
    const isLast = currentQ === questions.length - 1;

    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <div className="label-caps">Question {currentQ + 1} of {questions.length}</div>
          <div className="flex items-center gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 ${i < currentQ ? "bg-foreground" : i === currentQ ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          {totalPoints > 0 && (
            <div className="border border-foreground/20 px-3 py-1">
              <span className="font-display text-sm font-medium text-primary">+{totalPoints} pts</span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.article
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="border-t border-foreground/15 pt-6"
          >
            <div className="flex items-baseline gap-4 mb-4">
              <span className="font-display text-3xl text-primary">§{currentQ + 1}</span>
              <div className="flex-1">
                <h3 className="font-display text-xl font-medium leading-snug">{q.question}</h3>
                <p className="mt-1.5 font-display text-sm italic text-muted-foreground">{q.hint}</p>
              </div>
            </div>

            {/* Answer textarea */}
            {!evalResult && (
              <div className="space-y-3">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Think it through — there's no single right answer…"
                  rows={4}
                  className="w-full border border-foreground/20 bg-card p-4 font-display text-sm leading-relaxed outline-none placeholder:italic placeholder:text-muted-foreground focus:border-primary resize-none"
                />
                <Button
                  onClick={() => void submitAnswer()}
                  disabled={!answer.trim() || evaluating}
                  variant="hero"
                >
                  {evaluating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Evaluating…</>
                  ) : (
                    <>Submit answer <ChevronRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            )}

            {/* Eval result */}
            {evalResult && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Score */}
                <div className="flex items-center justify-between border border-foreground/15 bg-card px-4 py-3">
                  <div className="label-caps">Thinking quality</div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 overflow-hidden bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${evalResult.score * 10}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full ${evalResult.score >= 7 ? "bg-foreground" : evalResult.score >= 5 ? "bg-primary" : "bg-destructive"}`}
                      />
                    </div>
                    <span className="font-display text-lg font-medium">{evalResult.score}/10</span>
                  </div>
                </div>

                {/* Feedback */}
                <div className="border-l-2 border-primary bg-secondary/40 p-4">
                  <div className="label-caps mb-1">— Mentor's note —</div>
                  <p className="font-display text-sm italic leading-relaxed">{evalResult.feedback}</p>
                </div>

                {/* Your answer (greyed) */}
                <div className="border border-foreground/10 bg-card/40 p-3">
                  <div className="label-caps mb-1">Your answer</div>
                  <p className="font-display text-sm text-foreground/60">{answer}</p>
                </div>

                {/* Improvement suggestion */}
                {evalResult.improvement && (
                  <div className="border border-foreground/15 bg-card px-4 py-3">
                    <div className="label-caps mb-1">To go deeper</div>
                    <p className="font-display text-sm italic text-muted-foreground">{evalResult.improvement}</p>
                  </div>
                )}

                {/* Follow-up question */}
                {showFollowUp && q.followUp && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-l-2 border-foreground/30 bg-secondary/20 p-4"
                  >
                    <div className="label-caps mb-1">— Follow-up to consider —</div>
                    <p className="font-display text-sm italic leading-relaxed text-foreground/80">{q.followUp}</p>
                  </motion.div>
                )}

                <Button onClick={nextQuestion} variant="hero" className="w-full">
                  {isLast ? (
                    <>Move to diagram stage <ArrowRight className="h-4 w-4" /></>
                  ) : (
                    <>Next question <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.article>
        </AnimatePresence>
      </div>
    );
  }

  // Diagram stage — two-column layout
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-foreground/20 bg-card px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="label-caps mb-0.5">— Stage II: Diagram Practice —</div>
            <p className="font-display text-sm italic text-muted-foreground">
              Choose a diagram type, draw it in the canvas, then get detailed feedback.
            </p>
          </div>
          {totalPoints > 0 && (
            <div className="flex items-center gap-2 border border-foreground/20 px-3 py-1.5">
              <Award className="h-3.5 w-3.5 text-primary" />
              <span className="font-display text-sm font-medium text-primary">{totalPoints} pts from questions</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: diagram builder */}
        <div className="min-w-0 flex-1 overflow-hidden border-r border-foreground/15">
          <PMDiagramBuilder />
        </div>
        {/* Right: mentor chat */}
        <div className="hidden w-[320px] shrink-0 xl:flex xl:flex-col">
          <MentorChat />
        </div>
      </div>
    </div>
  );
};

// ─── Main RoleLearning component ──────────────────────────────────────────────

const RoleLearning = () => {
  const answers = useProject((s) => s.answers);
  const storeProjectId = useProject((s) => s.projectId);
  const [role, setRole] = useState<Role>("pm");
  const [points, setPoints] = useState(0);
  // Track PM stage so we can switch outer layout
  const [pmStage, setPmStage] = useState<PMStage>("loading");

  const projectId = useMemo(
    () => storeProjectId || toProjectId(answers.idea, answers.audience, answers.flow),
    [storeProjectId, answers.idea, answers.audience, answers.flow]
  );

  // ─── Engineer role: Full-height EngineerWorkbench ───
  if (role === "engineer") {
    return (
      <div className="h-full flex flex-col bg-paper">
        <div className="shrink-0 border-b border-foreground/15 px-0 py-0">
          <div className="grid w-full grid-cols-3 gap-px border-y border-foreground/20 bg-foreground/20">
            {ROLES.map((r) => {
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`group min-w-0 p-3 text-left transition-smooth ${
                    active ? "bg-foreground text-background" : "bg-card hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className={`font-display text-xl ${active ? "text-background/70" : "text-primary"}`}>{r.numeral}</span>
                    <div>
                      <div className="font-display text-base font-medium">{r.label}</div>
                      <div className={`mt-0.5 font-display text-xs italic ${active ? "text-background/80" : "text-muted-foreground"}`}>
                        {r.tagline}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1 min-h-0 p-0">
          <EngineerWorkbench />
        </div>
      </div>
    );
  }

  // ─── PM role in diagram stage: Full-height layout ───
  if (role === "pm" && pmStage === "diagram") {
    return (
      <div className="flex h-full flex-col bg-paper">
        {/* Compact header + role tabs strip */}
        <div className="shrink-0 border-b-2 border-foreground bg-background px-5 py-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="label-caps">Chapter Two · PM Diagram Practice</div>
            </div>
            <div className="ml-auto flex gap-1">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setRole(r.id); setPmStage("loading"); }}
                  className={`border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition-all ${
                    role === r.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/20 text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {r.numeral} {r.label.split(" ")[1] ?? r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <PMSection onStageChange={setPmStage} initialStage="diagram" />
        </div>
      </div>
    );
  }

  // ─── Default scrollable layout (PM questions stage, Ethicist) ───
  return (
    <div className="h-full overflow-y-auto bg-paper">
      <div className="container max-w-5xl py-10">
        {/* Header */}
        <div className="mb-10 border-b-2 border-foreground pb-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="label-caps mb-2">Chapter Two</div>
              <h1 className="font-display text-4xl font-medium leading-none md:text-5xl">
                Three Lenses on a Single Design
              </h1>
              <p className="mt-3 max-w-2xl font-display text-lg italic text-muted-foreground">
                The same architecture, examined by three professionals who would rarely sit in the same meeting.
              </p>
            </div>
            {role !== "pm" && points > 0 && (
              <div className="hidden border border-foreground/30 px-5 py-3 text-center md:block">
                <div className="label-caps">Marks earned</div>
                <div className="font-display text-3xl font-medium text-primary">{points}</div>
              </div>
            )}
          </div>
        </div>

        {/* Role tabs */}
        <div className="mb-10 grid gap-px border border-foreground/20 bg-foreground/20 md:grid-cols-3">
          {ROLES.map((r) => {
            const active = role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`group p-5 text-left transition-smooth ${
                  active ? "bg-foreground text-background" : "bg-card hover:bg-secondary"
                }`}
              >
                <div className="flex items-baseline gap-3">
                  <span className={`font-display text-2xl ${active ? "text-background/70" : "text-primary"}`}>{r.numeral}</span>
                  <div>
                    <div className="font-display text-lg font-medium">{r.label}</div>
                    <div className={`mt-0.5 font-display text-sm italic ${active ? "text-background/80" : "text-muted-foreground"}`}>
                      {r.tagline}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* PM: two-stage interactive flow */}
        {role === "pm" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="pm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="min-h-[500px]"
            >
              <PMSection onStageChange={setPmStage} />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Ethicist: BiasDetector */}
        {role === "ethicist" && (
          <BiasDetector projectId={projectId} />
        )}
      </div>
    </div>
  );
};

export default RoleLearning;
