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
    navigate(`/workspace?tab=learn&projectId=${encodeURIComponent(next)}`);
  };

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />

      {/* Banner ribbon */}
      <div className="border-b-2 border-foreground bg-foreground text-background">
        <div className="container flex h-9 items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
          <span className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-secondary" />
            sketch · stamp · ship
          </span>
          <span className="hidden sm:inline">a system-design playground for builders, not a tutorial</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            students online: 247
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative border-b-2 border-foreground">
        {/* decorative stickers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[8%] top-12 hidden rotate-[6deg] md:block">
            <div className="sticker bg-accent text-accent-foreground">★ no slides</div>
          </div>
          <div className="absolute left-[6%] top-32 hidden -rotate-[8deg] md:block">
            <div className="sticker bg-secondary">↯ chaos welcome</div>
          </div>
          <div className="absolute bottom-16 right-[12%] hidden rotate-[-4deg] md:block">
            <div className="sticker bg-card">{"// hint: drag me"}</div>
          </div>
        </div>

        <div className="container relative py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 flex flex-wrap items-center gap-2"
            >
              <span className="sticker bg-secondary">
                <span className="font-bold text-primary">README.md</span>
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                — for the kid who keeps asking <em className="not-italic text-foreground">"but how does it actually work?"</em>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl lg:text-[7rem]"
            >
              Turn a <span className="highlight-marker">half-baked idea</span>
              <br />
              into a real{" "}
              <span className="font-editorial italic text-primary">system architecture</span>
              <span className="text-accent">.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="mt-8 max-w-2xl font-display text-lg leading-relaxed text-muted-foreground md:text-xl"
            >
              Three questions in. A working diagram out. Then a mentor who asks the
              annoying-but-important questions until your design{" "}
              <span className="highlight-pink">actually scales</span>, doesn't leak
              data, and doesn't quietly ignore half its users.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Button asChild variant="hero" size="xl">
                <Link to="/onboarding">
                  start building <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/workspace">peek at the studio</Link>
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
              className="mt-4 max-w-2xl rounded-lg border border-foreground/20 bg-card p-3"
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
              className="mt-14 grid grid-cols-2 gap-4 border-t-2 border-foreground pt-6 md:grid-cols-4"
            >
              {[
                { k: "3", v: "questions to start" },
                { k: "5", v: "node clusters drawn" },
                { k: "∞", v: "drag-drop iterations" },
                { k: "0", v: "boilerplate" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="font-display text-4xl font-bold text-foreground">{s.k}</div>
                  <div className="label-caps mt-1">{s.v}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — three index cards */}
      <section id="how" className="border-b-2 border-foreground bg-grid-fine">
        <div className="container py-20 md:py-24">
          <div className="mb-12 flex items-baseline justify-between border-b-2 border-foreground pb-4">
            <h2 className="font-display text-3xl font-bold md:text-5xl">
              The loop<span className="text-accent">.</span>
            </h2>
            <span className="label-caps">3 moves · then repeat</span>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                tag: "01 / interview",
                title: "answer 3 dumb questions",
                body: "What's the idea? Who's it for? What does a user actually do? That's it. No schema-speak.",
                color: "bg-secondary",
                rot: "-rotate-1",
              },
              {
                tag: "02 / draft",
                title: "get a working diagram",
                body: "Frontend, backend, APIs, db, AI — drawn for you, clustered, annotated. Click any box for the why.",
                color: "bg-card",
                rot: "rotate-1",
              },
              {
                tag: "03 / interrogate",
                title: "argue with a mentor",
                body: "PM, engineer, ethicist. Each grills your design from a different angle. Earn pts, fix gaps, ship.",
                color: "bg-accent text-accent-foreground",
                rot: "-rotate-1",
              },
            ].map((c, i) => (
              <motion.article
                key={c.tag}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`group relative border-2 border-foreground p-7 shadow-stamp transition-spring hover:-translate-y-1 hover:shadow-stamp-lg ${c.color} ${c.rot}`}
              >
                <div className="mb-4 inline-block border-2 border-foreground bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground">
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
                One idea.
                <br />
                Three <span className="font-editorial italic text-primary">very</span>{" "}
                <span className="highlight-marker">opinionated</span> coworkers.
              </h2>
              <p className="mt-5 font-display text-lg text-muted-foreground">
                Switch hats. Each role hands you a different stack of objections —
                the kind you'd actually hear in a sprint planning meeting.
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
                    className={`group flex items-start gap-5 border-2 border-foreground p-5 shadow-stamp-sm transition-smooth hover:shadow-stamp ${row.bg}`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-foreground bg-background">
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
      <section className="border-b-2 border-foreground bg-dots">
        <div className="container py-20 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="label-caps mb-4">— reverse-engineering bench —</div>
            <h2 className="font-display text-4xl font-bold leading-tight md:text-6xl">
              Take apart{" "}
              <span className="font-editorial italic text-primary">instagram</span>.
              <br />
              <span className="highlight-pink">guess the stack.</span> earn pts.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl font-display text-lg text-muted-foreground">
              Pick a specimen. The platform asks what you'd reach for — CDN? sharded
              postgres? vector db? — and tells you, gently, when you're wrong.
            </p>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {["instagram", "tinder", "uber", "spotify", "doordash", "discord"].map((app, i) => (
                <span
                  key={app}
                  className={`sticker hover-wiggle press cursor-pointer text-sm ${i % 3 === 0 ? "bg-secondary" : i % 3 === 1 ? "bg-card" : "bg-accent text-accent-foreground"}`}
                  style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (Math.random() * 3 + 1)}deg)` }}
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
          <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
            Stop reading{" "}
            <span className="font-editorial italic text-secondary">"system design"</span>{" "}
            blog posts.
            <br />
            <span className="text-accent">Draw one.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-display text-lg text-background/70">
            10 minutes from idea to first diagram. No signup. No "book a demo."
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild variant="secondary" size="xl">
              <Link to="/onboarding">
                start building <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="border-background bg-transparent text-background hover:bg-background hover:text-foreground">
              <Link to="/workspace">just show me the studio</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-background py-10">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>built at 3am · powered by curiosity</span>
            <span className="h-1 w-1 rounded-full bg-foreground/40" />
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
