import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Camera, MessageSquare, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface Question {
  prompt: string;
  hint: string;
  options: { text: string; correct: boolean; note: string }[];
}

interface Example {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Camera;
  questions: Question[];
}

const EXAMPLES: Example[] = [
  {
    id: "photos",
    title: "A Photo-Sharing Application",
    subtitle: "Hundreds of millions of images, browsed and uploaded daily.",
    icon: Camera,
    questions: [
      {
        prompt: "Where do the photos themselves most likely live?",
        hint: "Not in the relational database — that would be expensive and slow.",
        options: [
          { text: "An object store such as S3, with a CDN in front", correct: true, note: "Yes — object storage is built for large binary blobs and pairs naturally with a CDN." },
          { text: "Inside a single PostgreSQL table as BYTEA columns", correct: false, note: "Possible, but ruinous at scale. Databases are not for binary blobs of this size." },
          { text: "On the user's device only", correct: false, note: "Then no one else could see them. Sharing requires a server." },
        ],
      },
      {
        prompt: "Generating thumbnails on upload — synchronous or asynchronous?",
        hint: "Consider what the user sees while waiting, and what work is expensive.",
        options: [
          { text: "Asynchronous, via a queue and worker pool", correct: true, note: "Right — return immediately, generate sizes in the background, notify when ready." },
          { text: "Synchronous, in the upload request", correct: false, note: "It would slow every upload to the speed of the slowest resize." },
        ],
      },
      {
        prompt: "Which database fits the social graph (follows, likes)?",
        hint: "Highly connected, read-heavy, with many small lookups.",
        options: [
          { text: "A relational DB plus an in-memory cache (e.g. Redis)", correct: true, note: "A common, sturdy pairing — the DB for truth, the cache for speed." },
          { text: "Only a graph database", correct: false, note: "Useful but rarely sufficient on its own at this scale." },
          { text: "A flat file on disk", correct: false, note: "Charming, but unsuited to concurrent writes." },
        ],
      },
    ],
  },
  {
    id: "chat",
    title: "A Real-Time Messaging Application",
    subtitle: "Millions of small messages, delivered within milliseconds.",
    icon: MessageSquare,
    questions: [
      {
        prompt: "Which protocol carries messages from server to client?",
        hint: "Polling every second would be wasteful. Something persistent is needed.",
        options: [
          { text: "WebSockets (or a similar long-lived connection)", correct: true, note: "Yes — open once, push as needed. Far cheaper than polling." },
          { text: "A REST endpoint polled every 250ms", correct: false, note: "Workable for a demo, untenable at scale." },
          { text: "Email", correct: false, note: "An honest answer, but slow by several orders of magnitude." },
        ],
      },
      {
        prompt: "Where do messages live for offline retrieval?",
        hint: "They must persist even if every server restarts.",
        options: [
          { text: "A durable database, partitioned by conversation", correct: true, note: "Right — partitioning keeps each conversation's reads fast." },
          { text: "Browser localStorage only", correct: false, note: "Then a new device would see nothing." },
        ],
      },
    ],
  },
  {
    id: "marketplace",
    title: "A Two-Sided Marketplace",
    subtitle: "Sellers list goods; buyers discover, pay, and review.",
    icon: ShoppingBag,
    questions: [
      {
        prompt: "Payments are best handled by…",
        hint: "Money has regulatory gravity. Outsource what you can.",
        options: [
          { text: "A payment provider such as Stripe, via webhooks", correct: true, note: "Yes — let specialists hold the regulatory burden; you handle the order." },
          { text: "A bespoke ledger written in-house", correct: false, note: "A path many teams have regretted. Begin with a provider." },
        ],
      },
      {
        prompt: "Search across listings is best served by…",
        hint: "Relational queries with `LIKE '%term%'` will not scale.",
        options: [
          { text: "A dedicated search index (e.g. Elasticsearch, Meilisearch)", correct: true, note: "Yes — purpose-built for ranked text retrieval." },
          { text: "A bigger relational database", correct: false, note: "More hardware, same problem." },
        ],
      },
    ],
  },
];

const Deconstruct = () => {
  const [exampleId, setExampleId] = useState<string>(EXAMPLES[0].id);
  const [points, setPoints] = useState(0);
  const [answered, setAnswered] = useState<Record<string, number>>({});

  const example = EXAMPLES.find((e) => e.id === exampleId)!;
  const Icon = example.icon;

  const choose = (qi: number, oi: number) => {
    const key = `${exampleId}-${qi}`;
    if (answered[key] !== undefined) return;
    const opt = example.questions[qi].options[oi];
    setAnswered((a) => ({ ...a, [key]: oi }));
    if (opt.correct) {
      setPoints((p) => p + 15);
      toast(`+15 marks · ${opt.note}`);
    } else {
      toast(opt.note);
    }
  };

  const completed = example.questions.every((_, qi) => answered[`${exampleId}-${qi}`] !== undefined);
  const correctCount = example.questions.reduce((acc, q, qi) => {
    const key = `${exampleId}-${qi}`;
    if (answered[key] !== undefined && q.options[answered[key]].correct) return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="h-full overflow-y-auto bg-paper">
      <div className="container max-w-5xl py-10">
        {/* Header */}
        <div className="mb-10 border-b-2 border-foreground pb-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="label-caps mb-2">Chapter Three</div>
              <h1 className="font-display text-4xl font-medium leading-none md:text-5xl">
                Learning by Deconstruction
              </h1>
              <p className="mt-3 max-w-2xl font-display text-lg italic text-muted-foreground">
                A familiar product is set before you. Surmise its parts. The architecture of others is a generous teacher.
              </p>
            </div>
            <div className="hidden border border-foreground/30 px-5 py-3 text-center md:block">
              <div className="label-caps">Marks earned</div>
              <div className="font-display text-3xl font-medium text-primary">{points}</div>
            </div>
          </div>
        </div>

        {/* Example tabs */}
        <div className="mb-10">
          <div className="label-caps mb-3">Specimens</div>
          <div className="flex flex-wrap gap-2 border-b border-foreground/15 pb-2">
            {EXAMPLES.map((e) => {
              const active = exampleId === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => setExampleId(e.id)}
                  className={`border-b-2 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-smooth ${
                    active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {e.title.replace(/^A\s/, "")}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={exampleId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {/* Specimen header */}
            <div className="mb-10 flex items-start gap-6 border border-foreground/20 bg-card p-6">
              <div className="grid h-16 w-16 shrink-0 place-items-center border border-foreground/30">
                <Icon className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <div className="label-caps mb-1">Specimen</div>
                <h2 className="font-display text-2xl font-medium leading-tight">{example.title}</h2>
                <p className="mt-2 font-display text-base italic text-muted-foreground">{example.subtitle}</p>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-10">
              {example.questions.map((q, qi) => {
                const key = `${exampleId}-${qi}`;
                const chosen = answered[key];
                return (
                  <article key={qi} className="border-t border-foreground/15 pt-6">
                    <div className="flex items-baseline gap-4">
                      <span className="font-display text-3xl text-primary">§{qi + 1}</span>
                      <div className="flex-1">
                        <h3 className="font-display text-2xl font-medium leading-snug">{q.prompt}</h3>
                        <p className="mt-2 font-display text-sm italic text-muted-foreground">{q.hint}</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      {q.options.map((opt, oi) => {
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
                            <span className="flex-1 font-display text-base">{opt.text}</span>
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
                        <div className="label-caps mb-1">— Annotation —</div>
                        <p className="font-display text-base italic leading-relaxed text-foreground/85">
                          {q.options[chosen].note}
                        </p>
                      </motion.div>
                    )}
                  </article>
                );
              })}
            </div>

            {completed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-10 flex items-center gap-4 border-2 border-foreground bg-card p-5"
              >
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-display text-lg font-medium">
                    Specimen examined — {correctCount} of {example.questions.length} correctly identified.
                  </div>
                  <p className="font-display text-sm italic text-muted-foreground">
                    Choose another specimen, or return to your own architecture with these patterns in mind.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Deconstruct;
