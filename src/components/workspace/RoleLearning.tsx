import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProject } from "@/stores/project";
import { Button } from "@/components/ui/button";
import { Check, Award, Loader2, ArrowRight, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import EngineerWorkbench from "@/components/workspace/EngineerWorkbench";
import { PMDiagramBuilder } from "./PMDiagramBuilder";
import { MentorChat } from "./MentorChat";

type Role = "pm" | "engineer" | "ethicist";

const ROLES: { id: Role; label: string; tagline: string; numeral: string }[] = [
  { id: "pm", label: "The Product Manager", tagline: "On users, value, and what to build first.", numeral: "I." },
  { id: "engineer", label: "The Engineer", tagline: "On scale, performance, and the cost of choices.", numeral: "II." },
  { id: "ethicist", label: "The Ethical Advisor", tagline: "On bias, fairness, and who is missing from the room.", numeral: "III." },
];

interface Exercise {
  prompt: string;
  hint: string;
  options: { text: string; correct: boolean; feedback: string }[];
}

const ENG_EXERCISES = (idea: string): Exercise[] => [
  {
    prompt: `"${idea || "Your idea"}" reaches 50,000 daily users. Where does the system strain first?`,
    hint: "Think about what runs on every request, and what cannot be cached easily.",
    options: [
      { text: "The frontend bundle size", correct: false, feedback: "A real concern, but rarely the first wall you hit at this scale." },
      { text: "Synchronous database writes during peak hours", correct: true, feedback: "Quite right — writes serialise. This is where queues and workers earn their keep." },
      { text: "The favicon request volume", correct: false, feedback: "A charming red herring." },
      { text: "TLS handshake overhead", correct: false, feedback: "Modern stacks handle this gracefully — look elsewhere." },
    ],
  },
  {
    prompt: "Do you need GPUs for this system?",
    hint: "GPUs accelerate parallel arithmetic — chiefly machine-learning inference and graphics.",
    options: [
      { text: "Yes — every modern app uses GPUs.", correct: false, feedback: "Most apps run quite well without them. GPUs serve a specific kind of work." },
      { text: "Only if a feature requires real-time ML inference at volume.", correct: true, feedback: "Precisely. Until then, CPU compute and a managed inference API will do." },
      { text: "No — GPUs are only for video games.", correct: false, feedback: "An older view. Inference at scale is the modern case." },
    ],
  },
];

const ETHICS_EXERCISES = (idea: string): Exercise[] => [
  {
    prompt: `Who is most likely to be excluded from the first version of "${idea || "your idea"}"?`,
    hint: "Consider those who do not show up in your imagined user — by language, ability, schedule, or trust.",
    options: [
      { text: "People without a smartphone or steady internet", correct: true, feedback: "A common omission. Consider an SMS or printed fallback for the first month." },
      { text: "Frequent power-users who want shortcuts", correct: false, feedback: "They will adapt. The harm here is small." },
      { text: "Investors reviewing the demo", correct: false, feedback: "A different kind of audience — not the ethics question." },
    ],
  },
  {
    prompt: "Where might the system encode an unfair assumption?",
    hint: "Look at what it asks of users by default — names, addresses, payment methods, gender.",
    options: [
      { text: "Requiring a credit card for sign-up", correct: true, feedback: "Yes — this quietly excludes anyone unbanked or wary of a new service." },
      { text: "Offering a dark-mode toggle", correct: false, feedback: "A preference, not an injustice." },
      { text: "Logging timestamps in UTC", correct: false, feedback: "A convention that affects no one's dignity." },
    ],
  },
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

const PMSection = ({ onStageChange, initialStage }: { onStageChange?: (stage: PMStage) => void; initialStage?: PMStage }) => {
  const idea = useProject((s) => s.answers.idea);
  const projectId = useProject((s) => s.projectId);
  const awardPoints = useProject((s) => s.awardPoints);

  const [stage, setStage] = useState<PMStage>(initialStage ?? "loading");
  const [questions, setQuestions] = useState<PMQuestion[]>([]);
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
      setCurrentQ(0);
      setAnswer("");
      setEvalResult(null);
      setShowFollowUp(false);
      changeStage("questions");
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
    } catch {
      toast("Could not evaluate — check the backend is running.");
    } finally {
      setEvaluating(false);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setAnswer("");
      setEvalResult(null);
      setShowFollowUp(false);
    } else {
      changeStage("diagram");
    }
  };

  // Initial state — prompt to start
  if (stage === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {loadError && (
          <p className="mb-4 font-display text-sm italic text-destructive">
            Could not load questions — check the backend is running.
          </p>
        )}
        <div className="label-caps mb-4">— Stage I: PM Thinking —</div>
        <h3 className="mb-3 font-display text-2xl font-medium">
          Answer three questions about your product
        </h3>
        <p className="mb-8 max-w-md font-display text-sm italic text-muted-foreground">
          The AI will generate questions specific to "{idea || "your idea"}" and evaluate your thinking.
          Then you'll build an event flow diagram.
        </p>
        <Button onClick={() => void loadQuestions()} variant="hero">
          <Loader2 className={`h-4 w-4 ${loadError ? "hidden" : ""}`} />
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
  const idea = useProject((s) => s.answers.idea);
  const [role, setRole] = useState<Role>("pm");
  const [points, setPoints] = useState(0);
  const [answered, setAnswered] = useState<Record<string, number>>({});
  // Track PM stage so we can switch outer layout
  const [pmStage, setPmStage] = useState<PMStage>("loading");

  const exercises =
    role === "engineer" ? ENG_EXERCISES(idea) : ETHICS_EXERCISES(idea);

  const biasScore =
    role === "ethicist"
      ? Math.max(38, 78 - Object.keys(answered).filter((k) => k.startsWith("ethicist")).length * 12)
      : null;

  const choose = (qIndex: number, optIndex: number) => {
    const key = `${role}-${qIndex}`;
    if (answered[key] !== undefined) return;
    const opt = exercises[qIndex].options[optIndex];
    setAnswered((a) => ({ ...a, [key]: optIndex }));
    if (opt.correct) {
      setPoints((p) => p + 10);
      toast(`+10 points · ${opt.feedback}`);
    } else {
      toast(opt.feedback);
    }
  };

  const activeRole = ROLES.find((r) => r.id === role)!;

  // When PM diagram stage is active, render a full-height non-scrolling layout
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

  return (
    <div className="h-full overflow-y-auto bg-paper">
      <div className={`${role === "engineer" ? "h-full flex flex-col" : "w-full px-5 py-10"}`}>
        {/* Header */}
        <div className={`${role === "engineer" ? "px-5 pt-5 pb-4 border-b-2 border-foreground" : "mb-10 border-b-2 border-foreground pb-6"}`}>
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
        <div className={`${role === "engineer" ? "px-5 pt-4 pb-3 grid w-full grid-cols-3 gap-px border-b border-foreground/15 bg-paper" : "mb-10 grid w-full grid-cols-3 gap-px border border-foreground/20 bg-foreground/20"}`}>
          {ROLES.map((r) => {
            const active = role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`group min-w-0 p-5 text-left transition-smooth ${
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

        {/* Engineer + Ethicist: multiple choice exercises */}
        {role !== "pm" && (
          <>
            {/* Bias score for ethicist */}
            {role === "ethicist" && biasScore !== null && (
              <div className="mb-8 border border-foreground/20 bg-card p-5">
                <div className="flex items-baseline justify-between">
                  <div className="label-caps">Bias score · current draft</div>
                  <span className={`font-display text-3xl font-medium ${biasScore > 60 ? "text-destructive" : biasScore > 40 ? "text-primary" : "text-foreground"}`}>
                    {biasScore}/100
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden bg-muted">
                  <motion.div
                    key={biasScore}
                    initial={{ width: 0 }}
                    animate={{ width: `${biasScore}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full ${biasScore > 60 ? "bg-destructive" : biasScore > 40 ? "bg-primary" : "bg-foreground"}`}
                  />
                </div>
                <p className="mt-3 font-display text-sm italic leading-relaxed text-muted-foreground">
                  Derived from assumptions in your audience description and the absence of inclusive provisions in the diagram.
                  Each correct reflection below lowers the score.
                </p>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-10"
              >
                <div className="label-caps">— Exercises with {activeRole.label.toLowerCase()} —</div>

                {exercises.map((ex, qi) => {
                  const key = `${role}-${qi}`;
                  const chosen = answered[key];
                  return (
                    <article key={qi} className="border-t border-foreground/15 pt-6">
                      <div className="flex items-baseline gap-4">
                        <span className="font-display text-3xl text-primary">§{qi + 1}</span>
                        <div className="flex-1">
                          <h3 className="font-display text-2xl font-medium leading-snug">{ex.prompt}</h3>
                          <p className="mt-2 font-display text-sm italic text-muted-foreground">{ex.hint}</p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2">
                        {ex.options.map((opt, oi) => {
                          const isChosen = chosen === oi;
                          const reveal = chosen !== undefined;
                          const correct = reveal && opt.correct;
                          const wrongChoice = reveal && isChosen && !opt.correct;
                          return (
                            <button
                              key={oi}
                              onClick={() => choose(qi, oi)}
                              disabled={reveal}
                              className={`flex w-full items-start gap-3 border p-4 text-left transition-smooth ${
                                correct
                                  ? "border-foreground bg-secondary"
                                  : wrongChoice
                                  ? "border-destructive/50 bg-destructive/5"
                                  : reveal
                                  ? "border-foreground/15 opacity-60"
                                  : "border-foreground/20 hover:border-foreground hover:bg-secondary/50"
                              }`}
                            >
                              <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                                {String.fromCharCode(97 + oi)}.
                              </span>
                              <span className="flex-1 font-display text-base text-foreground">{opt.text}</span>
                              {correct && <Check className="mt-0.5 h-4 w-4 text-foreground" />}
                            </button>
                          );
                        })}
                      </div>

                      {chosen !== undefined && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 border-l-2 border-primary bg-secondary/40 p-4"
                        >
                          <div className="label-caps mb-1">— Mentor's note —</div>
                          <p className="font-display text-base italic leading-relaxed text-foreground/85">
                            {ex.options[chosen].feedback}
                          </p>
                        </motion.div>
                      )}
                    </article>
                  );
                })}

                {Object.keys(answered).filter((k) => k.startsWith(role)).length === exercises.length && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 border-2 border-foreground bg-card p-5"
                  >
                    <Award className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-display text-lg font-medium">Chapter complete.</div>
                      <p className="font-display text-sm italic text-muted-foreground">
                        Carry these questions back to the workspace — your design will be the better for them.
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default RoleLearning;
