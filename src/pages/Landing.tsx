import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />

      {/* Masthead */}
      <section className="border-b border-foreground/15">
        <div className="container py-3 text-center">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>Est. MMXXV</span>
            <span className="hidden sm:inline">{today}</span>
            <span>No. 001</span>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="container border-b border-foreground/15 py-16 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="label-caps mb-6"
          >
            ※ A Quarterly Companion to Systems Thinking ※
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl lg:text-[6.5rem]"
          >
            On the Architecture
            <br />
            <em className="font-normal text-primary">of Small Ideas.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mx-auto mt-8 max-w-2xl font-display text-xl leading-relaxed text-muted-foreground md:text-2xl"
          >
            A guided studio for translating an ordinary thought into a working system —
            with an attentive mentor, three professional lenses, and a library of worked examples.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Button asChild variant="hero" size="xl">
              <Link to="/onboarding">
                Open the workbook <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="link" size="lg">
              <Link to="/workspace">Skip to studio →</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Three columns — editorial article style */}
      <section className="container border-b border-foreground/15 py-16 md:py-24">
        <div className="label-caps mb-10 text-center">— The Method, in Three Parts —</div>

        <div className="grid gap-12 md:grid-cols-3 md:gap-10">
          {[
            {
              numeral: "I.",
              title: "Begin in plain language.",
              body:
                "Three short prompts gather the shape of your idea — the audience it serves and the small choreography of its use.",
              caps: "The interview",
            },
            {
              numeral: "II.",
              title: "Receive a first draft.",
              body:
                "A working architecture appears on the page, drawn from your words. Each component is annotated with its purpose, trade-offs, and worthy alternatives.",
              caps: "The diagram",
            },
            {
              numeral: "III.",
              title: "Refine through dialogue.",
              body:
                "An attentive mentor remains in the margin. Three lenses — Product, Engineering, Ethics — each invite their own questions of the design.",
              caps: "The conversation",
            },
          ].map((col, i) => (
            <motion.article
              key={col.numeral}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="border-t-2 border-foreground pt-6"
            >
              <div className="label-caps mb-3">{col.caps}</div>
              <div className="mb-2 font-display text-5xl font-light text-primary">{col.numeral}</div>
              <h3 className="mb-3 font-display text-2xl font-medium leading-snug">{col.title}</h3>
              <p className="font-display text-base leading-relaxed text-muted-foreground">
                {col.body}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Pull quote */}
      <section className="container border-b border-foreground/15 py-20">
        <figure className="mx-auto max-w-3xl text-center">
          <span className="font-display text-7xl leading-none text-primary">“</span>
          <blockquote className="-mt-6 font-display text-3xl font-light italic leading-snug md:text-4xl">
            Every system begins, modestly, as a sentence. The work of the architect is to ask
            the next question, and the next, until the sentence stands upright.
          </blockquote>
          <figcaption className="label-caps mt-6">— from the introduction</figcaption>
        </figure>
      </section>

      {/* Closing CTA */}
      <section className="container py-20 text-center">
        <h2 className="font-display text-4xl font-medium md:text-5xl">
          Begin a draft this afternoon.
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-display text-lg text-muted-foreground">
          Three short prompts. Ten quiet minutes. One first system, drawn in your own hand.
        </p>
        <div className="mt-8">
          <Button asChild variant="hero" size="xl">
            <Link to="/onboarding">
              Open the workbook <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-foreground/15 bg-secondary/40 py-8">
        <div className="container flex flex-col items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row">
          <span>Archway · Vol. I · No. 001</span>
          <span>© {new Date().getFullYear()} — printed in pixels</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
