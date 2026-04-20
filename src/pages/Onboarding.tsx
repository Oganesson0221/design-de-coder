import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { useProject } from "@/stores/project";
import { toast } from "sonner";

const steps = [
  {
    key: "idea" as const,
    label: "Step 1 of 3",
    title: "Tell us your idea.",
    subtitle: "One sentence is plenty. We'll grow it together.",
    placeholder: "e.g. A way for neighbors to share home-cooked meals.",
    tint: "bg-node-frontend/30",
  },
  {
    key: "audience" as const,
    label: "Step 2 of 3",
    title: "Who will use this?",
    subtitle: "Picture the real humans. Names and details welcome.",
    placeholder: "e.g. Busy parents and retired neighbors in the same city block.",
    tint: "bg-node-ai/30",
  },
  {
    key: "flow" as const,
    label: "Step 3 of 3",
    title: "Walk me through what a user does, step by step.",
    subtitle: "Don't worry about the tech. Tell us the story.",
    placeholder: "e.g. They open the app, see what's cooking nearby, request a portion, and rate the meal afterwards.",
    tint: "bg-node-database/30",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const setAnswers = useProject((s) => s.setAnswers);
  const setOnboarded = useProject((s) => s.setOnboarded);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({ idea: "", audience: "", flow: "" });

  const step = steps[stepIndex];
  const value = values[step.key];

  const next = () => {
    if (!value.trim()) {
      toast("A few words will do — just to get us started.");
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
    <div className="relative min-h-screen overflow-hidden bg-soft">
      <div className="absolute -left-20 top-20 h-72 w-72 animate-blob rounded-full bg-node-frontend/30 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-96 w-96 animate-blob rounded-full bg-primary/20 blur-3xl" style={{ animationDelay: "3s" }} />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 animate-blob rounded-full bg-node-ai/30 blur-3xl" style={{ animationDelay: "6s" }} />

      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <button
          onClick={() => navigate("/")}
          className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-smooth hover:bg-muted"
        >
          Save & exit
        </button>
      </header>

      <main className="container relative grid min-h-[calc(100vh-4rem)] place-items-center pb-20">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="mb-10 flex items-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-bounce ${
                  i <= stepIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-soft backdrop-blur">
                <span className={`h-2 w-2 rounded-full ${step.tint.replace("/30", "")}`} />
                {step.label}
              </div>

              <h1 className="font-display text-4xl font-black leading-tight md:text-6xl">{step.title}</h1>
              <p className="mt-3 text-lg text-muted-foreground">{step.subtitle}</p>

              <div className="mt-8 rounded-3xl border border-border/60 bg-card p-2 shadow-soft">
                <Textarea
                  autoFocus
                  value={value}
                  onChange={(e) => setValues((v) => ({ ...v, [step.key]: e.target.value }))}
                  placeholder={step.placeholder}
                  className="min-h-[160px] resize-none border-0 bg-transparent text-lg leading-relaxed focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) next();
                  }}
                />
              </div>

              <div className="mt-3 text-xs text-muted-foreground">Tip: press ⌘/Ctrl + Enter to continue</div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between">
            <Button onClick={prev} variant="ghost" size="lg" className="rounded-full">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={next} variant="hero" size="lg">
              {stepIndex === steps.length - 1 ? (
                <>
                  Build my system <Sparkles className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
