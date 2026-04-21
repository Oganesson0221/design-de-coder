import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProject } from "@/stores/project";
import { Check, Award } from "lucide-react";
import { toast } from "sonner";
import { BiasDetector } from "./bias-detector";

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

const RoleLearning = () => {
  const idea = useProject((s) => s.answers.idea);
  const [role, setRole] = useState<Role>("pm");
  const [points, setPoints] = useState(0);
  const [answered, setAnswered] = useState<Record<string, number>>({});

  const exercises =
    role === "pm" ? PM_EXERCISES(idea) : ENG_EXERCISES(idea);

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
            <div className="hidden border border-foreground/30 px-5 py-3 text-center md:block">
              <div className="label-caps">Marks earned</div>
              <div className="font-display text-3xl font-medium text-primary">{points}</div>
            </div>
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

        {/* Bias Detector for ethicist role */}
        {role === "ethicist" ? (
          <BiasDetector />
        ) : (
          <>
            {/* Exercises for PM and Engineer roles */}
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
