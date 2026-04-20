import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { useProject } from "@/stores/project";
import { toast } from "sonner";

type StepKey = "idea" | "audience" | "flow";

interface Recommendation {
  label: string;
  text: string;
}

interface Step {
  key: StepKey;
  numeral: string;
  label: string;
  title: string;
  subtitle: string;
  placeholder: string;
  recommendations: Recommendation[];
}

const steps: Step[] = [
  {
    key: "idea",
    numeral: "I.",
    label: "The Premise",
    title: "Tell us your idea.",
    subtitle: "One sentence is plenty. Begin where you are.",
    placeholder: "e.g. A way for neighbors to share home-cooked meals.",
    recommendations: [
      { label: "Neighborhood meals", text: "A way for neighbors to share home-cooked meals, so no one eats alone and surplus food finds a home." },
      { label: "Reading companion", text: "An app that pairs people reading the same book, so they can discuss a chapter at a time." },
      { label: "Local skill swap", text: "A bulletin board for trading small skills — an hour of guitar for an hour of plumbing — within walking distance." },
      { label: "Quiet study rooms", text: "A service that helps remote workers reserve a quiet hour in nearby cafés and libraries." },
    ],
  },
  {
    key: "audience",
    numeral: "II.",
    label: "The Reader",
    title: "Who will use this?",
    subtitle: "Picture them clearly. Names and small details welcome.",
    placeholder: "e.g. Busy parents and retired neighbors on the same city block.",
    recommendations: [
      { label: "Working parents", text: "Working parents in dense neighborhoods who lack time to cook every evening but care about home-quality food." },
      { label: "Retirees with surplus", text: "Retired residents who enjoy cooking and would welcome both income and the quiet company of regulars." },
      { label: "First-year students", text: "First-year university students in shared housing, on tight budgets, eager to meet people nearby." },
      { label: "Newcomers to a city", text: "Recent arrivals to a city who want to learn its rhythms through small, recurring exchanges." },
    ],
  },
  {
    key: "flow",
    numeral: "III.",
    label: "The Choreography",
    title: "Walk us through what a user does, step by step.",
    subtitle: "Tell the story. The technology can wait.",
    placeholder: "e.g. They open the app, see what is cooking nearby, request a portion, then leave a small note afterwards.",
    recommendations: [
      {
        label: "A first visit",
        text: "They open the app on their commute, browse what is cooking nearby tonight, reserve a portion, then collect it at a doorstep on the way home and leave a short thank-you.",
      },
      {
        label: "A regular evening",
        text: "Every Tuesday they receive a message from a familiar cook, confirm the usual, and pay automatically when collected.",
      },
      {
        label: "A first-time host",
        text: "A retired neighbor lists tomorrow's surplus, sets a small price, accepts two requests, and prints a label for each portion.",
      },
      {
        label: "After the meal",
        text: "After eating, a user leaves a quiet rating, a sentence of thanks, and the app suggests another cook with a similar style.",
      },
    ],
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const setAnswers = useProject((s) => s.setAnswers);
  const setOnboarded = useProject((s) => s.setOnboarded);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<StepKey, string>>({ idea: "", audience: "", flow: "" });
  const [activeRec, setActiveRec] = useState<Record<StepKey, number | null>>({
    idea: null,
    audience: null,
    flow: null,
  });

  const step = steps[stepIndex];
  const value = values[step.key];

  const applyRecommendation = (i: number) => {
    const rec = step.recommendations[i];
    setValues((v) => ({ ...v, [step.key]: rec.text }));
    setActiveRec((s) => ({ ...s, [step.key]: i }));
  };

  const next = () => {
    if (!value.trim()) {
      toast("A few words will do — or pick a suggestion below.");
      return;
    }
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setAnswers(values);
      setOnboarded(true);
      navigate("/workspace");
    }
  };

  const prev = () => {
    if (stepIndex === 0) navigate("/");
    else setStepIndex((i) => i - 1);
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-foreground/15">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <button
            onClick={() => navigate("/")}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-smooth hover:text-foreground"
          >
            Save & exit
          </button>
        </div>
      </header>

      <main className="container py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Progress numerals */}
          <div className="mb-12 flex items-center justify-center gap-6">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-3">
                <span
                  className={`font-display text-2xl transition-smooth ${
                    i === stepIndex
                      ? "text-primary"
                      : i < stepIndex
                      ? "text-foreground"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {s.numeral}
                </span>
                {i < steps.length - 1 && (
                  <span className={`h-px w-10 ${i < stepIndex ? "bg-foreground" : "bg-muted-foreground/30"}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="label-caps mb-3 text-center">— {step.label} —</div>

              <h1 className="text-center font-display text-4xl font-medium leading-tight md:text-6xl">
                {step.title}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-center font-display text-lg text-muted-foreground">
                {step.subtitle}
              </p>

              {/* Editor */}
              <div className="mt-10 border-y-2 border-foreground bg-card">
                <div className="flex items-center justify-between border-b border-foreground/15 px-5 py-2">
                  <span className="label-caps">Folio {stepIndex + 1} / {steps.length}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {value.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <Textarea
                  autoFocus
                  value={value}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, [step.key]: e.target.value }));
                    setActiveRec((s) => ({ ...s, [step.key]: null }));
                  }}
                  placeholder={step.placeholder}
                  className="min-h-[180px] resize-none rounded-none border-0 bg-transparent p-6 font-display text-xl leading-relaxed focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) next();
                  }}
                />
              </div>

              <p className="mt-2 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                ⌘ / Ctrl + ↵ to continue
              </p>

              {/* Recommendation tabs */}
              <div className="mt-10">
                <div className="label-caps mb-4">Suggested phrasings — choose one to begin</div>

                <div className="flex flex-wrap gap-2 border-b border-foreground/15 pb-2">
                  {step.recommendations.map((rec, i) => {
                    const active = activeRec[step.key] === i;
                    return (
                      <button
                        key={rec.label}
                        onClick={() => applyRecommendation(i)}
                        className={`border-b-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-smooth ${
                          active
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {rec.label}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeRec[step.key] ?? "preview"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-5"
                  >
                    {activeRec[step.key] === null ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {step.recommendations.map((rec, i) => (
                          <button
                            key={rec.label}
                            onClick={() => applyRecommendation(i)}
                            className="group border border-foreground/15 bg-card/60 p-4 text-left transition-smooth hover:border-foreground hover:bg-card"
                          >
                            <div className="label-caps mb-2 group-hover:text-primary">{rec.label}</div>
                            <p className="font-display text-sm italic leading-relaxed text-foreground/80">
                              “{rec.text}”
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="border-l-2 border-primary bg-secondary/40 p-5">
                        <div className="label-caps mb-2">
                          Applied: {step.recommendations[activeRec[step.key]!].label}
                        </div>
                        <p className="font-display italic leading-relaxed text-foreground/80">
                          You may edit the text above to make it your own.
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex items-center justify-between border-t border-foreground/15 pt-6">
            <Button onClick={prev} variant="ghost" size="lg">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={next} variant="hero" size="lg">
              {stepIndex === steps.length - 1 ? "Draft my system" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
