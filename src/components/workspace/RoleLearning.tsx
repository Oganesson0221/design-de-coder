import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProject } from "@/stores/project";
import { Check, Award } from "lucide-react";
import { toast } from "sonner";
import EngineerWorkbench from "@/components/workspace/EngineerWorkbench";

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

const PM_EXERCISES = (idea: string): Exercise[] => [
  {
    prompt: `For "${idea || "your idea"}", which feature should ship first?`,
    hint: "Choose the smallest thing that proves the idea has any value at all.",
    options: [
      { text: "A polished onboarding flow with profile photos", correct: false, feedback: "Polish is for later. First, prove someone wants it." },
      { text: "A single working transaction between two users", correct: true, feedback: "Exactly. One real exchange teaches more than a hundred sign-ups." },
      { text: "Push notifications and reminders", correct: false, feedback: "Reminders for what? Build the thing being reminded about first." },
      { text: "An admin dashboard with analytics", correct: false, feedback: "There is nothing to analyse yet. This belongs to month three." },
    ],
  },
  {
    prompt: "Which user flow most belongs in the first version?",
    hint: "The flow a real user will repeat — not the one a stakeholder will demo.",
    options: [
      { text: "Discover → request → confirm → exchange → review", correct: true, feedback: "Yes — this is the loop the product lives or dies by." },
      { text: "Sign up → verify email → set preferences → tutorial", correct: false, feedback: "These are doors. The room beyond them must exist first." },
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

const RoleLearning = () => {
  const idea = useProject((s) => s.answers.idea);
  const [role, setRole] = useState<Role>("pm");
  const [points, setPoints] = useState(0);
  const [answered, setAnswered] = useState<Record<string, number>>({});

  const exercises = role === "pm" ? PM_EXERCISES(idea) : ETHICS_EXERCISES(idea);

  const biasScore = role === "ethicist" ? Math.max(38, 78 - Object.keys(answered).filter((k) => k.startsWith("ethicist")).length * 12) : null;

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
            <div className="hidden border border-foreground/30 px-5 py-3 text-center md:block">
              <div className="label-caps">Marks earned</div>
              <div className="font-display text-3xl font-medium text-primary">{points}</div>
            </div>
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

        {role === "engineer" && (
          <div className="flex-1 min-h-0 px-0 pb-0">
            <EngineerWorkbench />
          </div>
        )}

        {/* Exercises */}
        {role !== "engineer" && <AnimatePresence mode="wait">
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
        </AnimatePresence>}
      </div>
    </div>
  );
};

export default RoleLearning;
