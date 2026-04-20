import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Users, GitFork, Heart, Sparkles, Layers } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import heroShapes from "@/assets/hero-shapes.jpg";

const features = [
  { icon: Brain, title: "AI mentor by your side", desc: "Ask anything, anytime. Your mentor explains the why behind every choice — not just the what.", tint: "bg-node-ai/30" },
  { icon: Layers, title: "From idea to architecture", desc: "Tell us your idea in plain words. We sketch a real, editable system diagram you can learn from.", tint: "bg-node-frontend/30" },
  { icon: Users, title: "Three lenses, one design", desc: "Switch between Product Manager, Engineer and Ethical Advisor to see your system from every angle.", tint: "bg-node-backend/30" },
  { icon: GitFork, title: "A community of builders", desc: "Publish your design, fork others, learn together. Bonus points for inclusive thinking.", tint: "bg-node-database/30" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-soft">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{ backgroundImage: `url(${heroShapes})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/30 via-background/60 to-background" />

        <div className="container relative grid gap-12 py-20 md:py-32 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-soft backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Built for the curious — no degree required
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight md:text-7xl lg:text-[5.5rem]"
            >
              Turn an <em className="not-italic text-primary">idea</em> into a real{" "}
              <span className="relative inline-block">
                system
                <span className="absolute bottom-1 left-0 -z-10 h-3 w-full rounded-full bg-primary/30" />
              </span>
              .
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl"
            >
              Archway is an AI playground that walks you from a one-line idea to a complete architecture —
              with a friendly mentor, role-based lessons, and a community of builders cheering you on.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Button asChild variant="hero" size="xl">
                <Link to="/onboarding">
                  Start building <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="soft" size="lg">
                <Link to="/community">See what others built</Link>
              </Button>
            </motion.div>

            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" /> Inclusive by design
              </div>
              <div className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />
              <div className="hidden sm:block">10-min first build</div>
            </div>
          </div>

          {/* Floating preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative lg:col-span-5"
          >
            <div className="relative mx-auto max-w-md">
              <div className="absolute -left-10 -top-10 h-40 w-40 animate-blob rounded-full bg-node-ai/40 blur-2xl" />
              <div className="absolute -right-8 bottom-0 h-48 w-48 animate-blob rounded-full bg-node-frontend/40 blur-2xl" style={{ animationDelay: "2s" }} />

              <div className="relative rounded-3xl border border-border/60 bg-card/90 p-6 shadow-glow backdrop-blur">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary/70" />
                  <div className="h-3 w-3 rounded-full bg-node-database/70" />
                  <div className="h-3 w-3 rounded-full bg-node-ai/70" />
                  <span className="ml-2 text-xs font-medium text-muted-foreground">your-first-design.arch</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <NodePreview label="Web" tint="bg-node-frontend" delay={0} />
                  <NodePreview label="API" tint="bg-node-api" delay={0.6} />
                  <NodePreview label="DB" tint="bg-node-database" delay={1.2} />
                  <NodePreview label="Mobile" tint="bg-node-frontend/80" delay={1.8} />
                  <NodePreview label="Service" tint="bg-node-backend" delay={2.4} />
                  <NodePreview label="AI" tint="bg-node-ai" delay={3.0} />
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-2xl bg-secondary/60 p-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-warm">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-secondary-foreground">
                    Nice start! Want to talk about how the API and database stay in sync?
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-black md:text-5xl">A playground that teaches as you build.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Each click reveals the reasoning. Each component opens a tiny lesson. You leave with a system, and the confidence to design the next one.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-soft transition-bounce hover:-translate-y-1 hover:shadow-glow"
            >
              <div className={`grid h-12 w-12 place-items-center rounded-2xl ${f.tint}`}>
                <f.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-warm p-12 text-center shadow-glow md:p-20">
          <div className="absolute -left-10 top-10 h-40 w-40 animate-blob rounded-full bg-background/30 blur-2xl" />
          <div className="absolute -right-10 bottom-0 h-52 w-52 animate-blob rounded-full bg-background/20 blur-2xl" style={{ animationDelay: "3s" }} />
          <h2 className="relative font-display text-4xl font-black text-primary-foreground md:text-6xl">
            Your first system is ten minutes away.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-primary-foreground/90">
            No setup. No jargon walls. Just three little questions to begin.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Button asChild size="xl" className="rounded-full bg-background text-foreground hover:bg-background/90">
              <Link to="/onboarding">
                Start building <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" /> Built for builders of every background.
          </div>
          <div>© {new Date().getFullYear()} Archway</div>
        </div>
      </footer>
    </div>
  );
};

const NodePreview = ({ label, tint, delay }: { label: string; tint: string; delay: number }) => (
  <div className="relative">
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
      className={`grid aspect-square place-items-center rounded-2xl ${tint} font-display text-sm font-bold text-foreground/80 shadow-pop`}
    >
      {label}
    </motion.div>
  </div>
);

export default Landing;
