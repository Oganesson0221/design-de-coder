import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Github, Cpu, Database, ShieldCheck, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useProject } from "@/stores/project";
import { listEngineerProjects, type EngineerProjectSummary } from "@/services/engineerApi";

const Landing = () => {
  const navigate = useNavigate();
  const setOnboarded = useProject((s) => s.setOnboarded);
  const [projectIdInput, setProjectIdInput] = useState("");
  const [projects, setProjects] = useState<EngineerProjectSummary[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadProjects() {
      try {
        const response = await listEngineerProjects();
        if (!mounted) return;
        setProjects(response.projects || []);
        if ((response.projects || []).length > 0) {
          setProjectIdInput(response.projects[0].projectId);
        }
      } catch {
        // noop
      }
    }
    void loadProjects();
    return () => {
      mounted = false;
    };
  }, []);

  const openExistingProject = () => {
    const next = projectIdInput.trim();
    if (!next) return;
    setOnboarded(true);
    navigate(`/workspace?projectId=${encodeURIComponent(next)}`);
  };

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />

      {/* Banner ribbon */}
      <div className="border-b-2 border-foreground bg-foreground text-background">
        <div className="container flex h-9 items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
          <span className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-secondary" />
            learn system design by building
          </span>
          <span className="hidden sm:inline">guided architecture practice for emerging builders</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            mentor-guided
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-foreground">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-5rem] top-16 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />
          <div className="absolute right-[-4rem] top-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-[-6rem] left-1/3 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 flex flex-wrap items-center gap-3"
            >
              <span className="sticker bg-secondary">
                <span className="font-bold text-primary">README.md</span>
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                — for every curious builder asking <em className="not-italic text-foreground">"but how does it actually work?"</em>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="font-display text-4xl font-bold leading-[0.98] tracking-tight md:text-6xl lg:text-[6.25rem]"
            >
              Move from <span className="highlight-marker">prompting</span>
              <br />
              to designing real{" "}
              <span className="font-editorial italic text-primary">systems and agents</span>
              <span className="text-accent">.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="mt-6 max-w-4xl font-display text-lg leading-relaxed text-muted-foreground md:text-xl"
            >
              Archway helps the next generation of builders shape ideas into system
              architecture they can explain, critique, and improve. Start with a
              concept, turn it into a working design, then pressure-test it with
              mentors before bias and bad assumptions harden into the product.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Button asChild variant="hero" size="xl">
                <Link to="/onboarding">
                  start building <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <a
                href="#how"
                className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-smooth hover:text-foreground"
              >
                <Github className="h-3.5 w-3.5" /> how it works ↓
              </a>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="mt-6 max-w-3xl rounded-xl border border-foreground/15 bg-background/80 p-4 shadow-stamp-sm backdrop-blur-sm"
            >
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Open Existing Project
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={projectIdInput}
                  onChange={(e) => setProjectIdInput(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                >
                  {projects.length === 0 ? (
                    <option value="">No projects found</option>
                  ) : (
                    projects.map((p) => (
                      <option key={p.projectId} value={p.projectId}>
                        {p.title?.trim()
                          ? p.title
                          : p.projectId}
                      </option>
                    ))
                  )}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="sm:w-auto"
                  onClick={openExistingProject}
                  disabled={!projectIdInput.trim() || projects.length === 0}
                >
                  Open Project
                </Button>
              </div>
            </motion.div>

            {/* Stat strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 grid grid-cols-2 gap-4 border-t border-foreground/20 pt-6 md:grid-cols-4"
            >
              {[
                { k: "3", v: "guided prompts" },
                { k: "1", v: "working system map" },
                { k: "3", v: "review lenses" },
                { k: "0", v: "boilerplate setup" },
              ].map((s) => (
                <div key={s.v} className="rounded-xl border border-foreground/10 bg-background/60 p-4">
                  <div className="font-display text-4xl font-bold text-foreground">{s.k}</div>
                  <div className="label-caps mt-1">{s.v}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — three index cards */}
      <section id="how" className="border-b-2 border-foreground bg-paper">
        <div className="container py-20 md:py-24">
          <div className="mb-12 flex items-baseline justify-between border-b-2 border-foreground pb-4">
            <h2 className="font-display text-3xl font-bold md:text-5xl">
              How it works<span className="text-accent">.</span>
            </h2>
            <span className="label-caps">3 steps · same build flow</span>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                tag: "01 / interview",
                title: "clarify the idea",
                body: "Start with the problem, the audience, and the user flow. You do not need a schema or architecture plan to begin.",
                color: "bg-background",
              },
              {
                tag: "02 / draft",
                title: "shape the architecture",
                body: "See the stack take form across frontend, backend, APIs, data, and agents. Inspect each part and understand why it is there.",
                color: "bg-card",
              },
              {
                tag: "03 / interrogate",
                title: "review the tradeoffs",
                body: "Pressure-test the design with mentors who surface product, engineering, and ethics questions before they become product defaults.",
                color: "bg-secondary/40",
              },
            ].map((c, i) => (
              <motion.article
                key={c.tag}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`group relative rounded-2xl border border-foreground/15 p-7 shadow-stamp-sm transition-spring hover:-translate-y-1 hover:shadow-stamp ${c.color}`}
              >
                <div className="mb-4 inline-block rounded-full border border-foreground/20 bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground">
                  {c.tag}
                </div>
                <h3 className="font-display text-2xl font-bold leading-tight">{c.title}</h3>
                <p className="mt-3 font-display text-base leading-relaxed opacity-80">{c.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* THE THREE LENSES */}
      <section className="border-b-2 border-foreground">
        <div className="container py-20 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
            <div>
              <div className="label-caps mb-4">— roleplay mode —</div>
              <h2 className="font-display text-4xl font-bold leading-tight md:text-5xl">
                One system.
                <br />
                Three perspectives that sharpen it.
              </h2>
              <p className="mt-5 font-display text-lg text-muted-foreground">
                Shift between product, engineering, and ethics so your architecture
                reflects more than one viewpoint from the start.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: Users,
                  role: "the PM",
                  q: "which feature ships first — and what are you cutting?",
                  pts: "+10 per sharp call",
                  bg: "bg-secondary",
                },
                {
                  icon: Cpu,
                  role: "the engineer",
                  q: "okay, 50k users hit it tuesday at 8pm. where does it crack?",
                  pts: "GPU? queues? caches? defend.",
                  bg: "bg-card",
                },
                {
                  icon: ShieldCheck,
                  role: "the ethicist",
                  q: "who's quietly excluded from version one?",
                  pts: "lower the bias score, level up.",
                  bg: "bg-accent/20",
                },
              ].map((row, i) => {
                const Icon = row.icon;
                return (
                  <motion.div
                    key={row.role}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.08 }}
                    className={`group flex items-start gap-5 rounded-2xl border border-foreground/15 p-5 shadow-stamp-sm transition-smooth hover:shadow-stamp ${row.bg}`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-foreground/15 bg-background">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="label-caps">{row.role}</div>
                      <div className="mt-1 font-display text-xl font-semibold leading-snug">
                        "{row.q}"
                      </div>
                      <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {row.pts}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* DECONSTRUCTION */}
      <section className="border-b-2 border-foreground bg-paper">
        <div className="container py-20 md:py-24">
          <div className="mx-auto max-w-5xl text-center">
            <div className="label-caps mb-4">— reverse-engineering bench —</div>
            <h2 className="font-display text-4xl font-bold leading-tight md:text-6xl">
              Reverse-engineer products
              <br />
              to understand how they work.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl font-display text-lg text-muted-foreground">
              Pick a familiar product, inspect the tradeoffs, and compare your
              architecture instincts against a real system design breakdown.
            </p>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {["instagram", "tinder", "uber", "spotify", "doordash", "discord"].map((app, i) => (
                <span
                  key={app}
                  className={`cursor-pointer rounded-full border border-foreground/15 px-4 py-2 font-mono text-sm uppercase tracking-[0.12em] transition-smooth hover:-translate-y-0.5 hover:bg-secondary/60 ${i % 3 === 0 ? "bg-secondary/40" : i % 3 === 1 ? "bg-background" : "bg-card"}`}
                  style={{ transform: `rotate(${[-2, 1, -1, 2, -1, 1][i]}deg)` }}
                >
                  <Database className="h-3 w-3" /> {app}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-b-2 border-foreground bg-foreground text-background">
        <div className="container py-20 text-center md:py-28">
          <h2 className="mx-auto max-w-4xl font-display text-4xl font-bold leading-tight md:text-6xl">
            Learn system design
            <br />
            by directing one yourself.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl font-display text-lg text-background/70">
            Build the first draft, inspect the tradeoffs, and keep iterating with
            the same workflow you already have.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild variant="secondary" size="xl">
              <Link to="/onboarding">
                start building <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-background py-10">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>agentic playground for future system builders</span>
            <span className="h-1 w-1 rounded-full bg-foreground/40" />
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
