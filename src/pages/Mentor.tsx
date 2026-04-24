import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  MessageCircle,
  Star,
  Award,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProject } from "@/stores/project";
import { toast } from "sonner";

interface MentorProfile {
  handle: string;
  avatar: string;
  name: string;
  role: string;
  bio: string;
  expertise: string[];
  rating: number;
  sessions: number;
  isWoman: boolean;
  open: boolean;
}

const MENTORS: MentorProfile[] = [
  {
    handle: "@lina.scales",
    avatar: "LI",
    name: "Lina M.",
    role: "Staff Engineer · ex-Stripe",
    bio: "I'll help you survive your first 100k req/sec. Specialty: turning monoliths into 3 services without the rewrite trap.",
    expertise: ["scaling", "postgres", "queues", "observability"],
    rating: 4.9,
    sessions: 142,
    isWoman: true,
    open: true,
  },
  {
    handle: "@dr.fair",
    avatar: "MF",
    name: "Dr. Maria Fairbanks",
    role: "Responsible AI Researcher",
    bio: "I review your design through the bias lens — data sourcing, exclusion patterns, fairness audits. Walk away with a checklist.",
    expertise: ["ml-fairness", "bias-audits", "data-ethics"],
    rating: 5.0,
    sessions: 89,
    isWoman: true,
    open: true,
  },
  {
    handle: "@kenji_b",
    avatar: "KE",
    name: "Kenji B.",
    role: "Founding Engineer · 3 startups",
    bio: "MVPs that don't need a rewrite at $1M ARR. I'll save you from premature kafka.",
    expertise: ["mvp", "early-stage", "trade-offs"],
    rating: 4.8,
    sessions: 211,
    isWoman: false,
    open: true,
  },
  {
    handle: "@priya.sys",
    avatar: "PR",
    name: "Priya S.",
    role: "Systems Architect · Public-interest tech",
    bio: "Designing for low-bandwidth, low-trust environments. SMS fallbacks, offline-first, the works.",
    expertise: ["inclusive-design", "offline-first", "ngo-tech"],
    rating: 4.95,
    sessions: 64,
    isWoman: true,
    open: true,
  },
  {
    handle: "@tarun.q",
    avatar: "TA",
    name: "Tarun Q.",
    role: "Backend Lead",
    bio: "Database schemas that don't haunt you in 18 months. Migrations, indexes, dread-prevention.",
    expertise: ["postgres", "schema-design", "migrations"],
    rating: 4.7,
    sessions: 98,
    isWoman: false,
    open: false,
  },
  {
    handle: "@aisha.devops",
    avatar: "AI",
    name: "Aisha O.",
    role: "Platform Engineer",
    bio: "k8s without crying. I'll help you decide if you actually need it (you probably don't, yet).",
    expertise: ["devops", "k8s", "cost-engineering"],
    rating: 4.85,
    sessions: 73,
    isWoman: true,
    open: true,
  },
];

const Mentor = () => {
  const awardPoints = useProject((s) => s.awardPoints);
  const awardBadge = useProject((s) => s.awardBadge);
  const setWomanInTeam = useProject((s) => s.setWomanInTeam);
  const womanInTeam = useProject((s) => s.womanInTeam);

  const [showForm, setShowForm] = useState(false);
  const [showInboxDialog, setShowInboxDialog] = useState(false);
  const [mentorEmail, setMentorEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [form, setForm] = useState({
    handle: "",
    role: "",
    bio: "",
    expertise: "",
    isWoman: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!form.handle.trim() || !form.bio.trim()) {
      toast("Add at least a handle and a short bio.");
      return;
    }
    setSubmitted(true);
    awardPoints(100);
    awardBadge("mentor");
    if (form.isWoman) {
      setWomanInTeam(true);
    }
    toast(
      `+100 pts · mentor badge unlocked${form.isWoman ? " · +50 she-builds bonus" : ""}`,
    );
  };

  const submitMentorEmail = () => {
    const email = mentorEmail.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast("Please enter a valid email ID.");
      return;
    }
    setEmailSubmitted(true);
  };

  const closeInboxDialog = () => {
    setShowInboxDialog(false);
    setMentorEmail("");
    setEmailSubmitted(false);
  };

  const womenMentors = MENTORS.filter((m) => m.isWoman).length;

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b-2 border-foreground bg-card">
        <div className="container py-16">
          <div className="grid items-end gap-8 md:grid-cols-[2fr_1fr]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="sticker bg-secondary">/mentors</span>
                <span className="sticker bg-accent text-accent-foreground hover-wiggle">
                  <Sparkles className="h-3 w-3" /> {womenMentors} women mentors
                  active
                </span>
              </div>
              <h1 className="font-display text-5xl font-bold leading-[0.95] md:text-6xl">
                find a guide.
                <br />
                <span className="font-editorial italic text-primary">or </span>
                <span className="highlight-marker">become one</span>
                <span className="text-accent">.</span>
              </h1>
              <p className="mt-5 max-w-xl font-display text-lg text-muted-foreground">
                Mentors are folks who've shipped the loop a few times. They
                review designs, answer the dumb-but-important questions, and
                don't bill you.
              </p>
            </div>
            <div className="border-2 border-foreground bg-background p-5 shadow-stamp">
              <div className="label-caps mb-3">why mentor here?</div>
              <ul className="space-y-2 font-display text-sm">
                <li className="flex items-baseline gap-2">
                  <Check className="h-4 w-4 shrink-0 text-success" />
                  earn the <span className="font-bold">mentor badge</span> + 100
                  pts
                </li>
                <li className="flex items-baseline gap-2">
                  <Check className="h-4 w-4 shrink-0 text-success" />
                  featured on the community page
                </li>
                <li className="flex items-baseline gap-2">
                  <Check className="h-4 w-4 shrink-0 text-success" />
                  set your own hours · async by default
                </li>
                <li className="flex items-baseline gap-2 border-t-2 border-dashed border-foreground/20 pt-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-highlight" />
                  <span>
                    women in tech: <span className="font-bold">+50 pts</span> on
                    signup, double-featured the first month
                  </span>
                </li>
              </ul>
              <Button
                onClick={() => setShowInboxDialog(true)}
                variant="hero"
                size="lg"
                className="mt-5 w-full"
              >
                open my inbox →
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="mb-8 flex items-baseline justify-between border-b-2 border-foreground pb-3">
          <h2 className="font-display text-3xl font-bold">
            the bench<span className="text-accent">.</span>
          </h2>
          <span className="label-caps flex items-center gap-2">
            <Users className="h-3 w-3" /> {MENTORS.filter((m) => m.open).length}{" "}
            taking learners now
          </span>
        </div>

        {/* Mentor grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {MENTORS.map((m, i) => (
            <motion.article
              key={m.handle}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="group flex flex-col border-2 border-foreground bg-card shadow-stamp-sm transition-smooth hover:-translate-y-1 hover:shadow-stamp"
            >
              {/* Header strip */}
              <div className="flex items-center justify-between border-b-2 border-foreground bg-background px-4 py-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
                  {m.handle}
                </span>
                <span
                  className={`flex items-center gap-1 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
                    m.open
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${m.open ? "bg-foreground animate-pulse" : "bg-foreground/40"}`}
                  />
                  {m.open ? "open" : "full"}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-secondary font-mono text-sm font-bold shadow-stamp-sm">
                    {m.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-bold leading-tight">
                      {m.name}
                      {m.isWoman && (
                        <span
                          className="ml-1.5 inline-flex items-center gap-0.5 align-middle border border-foreground bg-highlight/70 px-1 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-highlight-foreground"
                          title="she-builds bonus active"
                        >
                          <Sparkles className="h-2.5 w-2.5" /> ✦
                        </span>
                      )}
                    </h3>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {m.role}
                    </div>
                  </div>
                </div>

                <p className="mt-3 font-display text-sm leading-relaxed text-foreground/80">
                  {m.bio}
                </p>

                <div className="mt-4 flex flex-wrap gap-1">
                  {m.expertise.map((e) => (
                    <span
                      key={e}
                      className="border border-foreground/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      #{e}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between border-t-2 border-dashed border-foreground/20 pt-4">
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" />{" "}
                      {m.rating}
                    </span>
                    <span className="text-muted-foreground">
                      {m.sessions} sessions
                    </span>
                  </div>
                  <Button
                    variant={m.open ? "secondary" : "soft"}
                    size="sm"
                    disabled={!m.open}
                    onClick={() => {
                      awardPoints(5);
                      toast(`+5 pts · request sent to ${m.handle}`);
                    }}
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> request
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* {showForm && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 border-2 border-foreground bg-card shadow-stamp-lg"
          >
            <div className="border-b-2 border-foreground bg-foreground px-6 py-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-background">
                /mentor/apply
              </span>
            </div>
            <div className="p-8">
              {!submitted ? (
                <>
                  <h2 className="font-display text-3xl font-bold leading-tight">
                    open your inbox.
                  </h2>
                  <p className="mt-2 max-w-xl font-display text-base text-muted-foreground">
                    Three fields. We'll surface you to learners whose questions
                    match your expertise.
                  </p>

                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="label-caps">handle</label>
                      <Input
                        value={form.handle}
                        onChange={(e) =>
                          setForm({ ...form, handle: e.target.value })
                        }
                        placeholder="@your-name"
                        className="mt-1.5 rounded-sm border-2 border-foreground bg-background font-mono"
                      />
                    </div>
                    <div>
                      <label className="label-caps">current role</label>
                      <Input
                        value={form.role}
                        onChange={(e) =>
                          setForm({ ...form, role: e.target.value })
                        }
                        placeholder="e.g. Staff Engineer at —"
                        className="mt-1.5 rounded-sm border-2 border-foreground bg-background font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label-caps">
                        expertise (comma-separated)
                      </label>
                      <Input
                        value={form.expertise}
                        onChange={(e) =>
                          setForm({ ...form, expertise: e.target.value })
                        }
                        placeholder="scaling, postgres, mvp, fairness…"
                        className="mt-1.5 rounded-sm border-2 border-foreground bg-background font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label-caps">
                        short bio · what you'll help with
                      </label>
                      <Textarea
                        value={form.bio}
                        onChange={(e) =>
                          setForm({ ...form, bio: e.target.value })
                        }
                        placeholder="I'll help you survive your first…"
                        className="mt-1.5 min-h-[100px] rounded-sm border-2 border-foreground bg-background font-display text-base"
                      />
                    </div>
                  </div>

                  <label className="mt-6 flex cursor-pointer items-start gap-3 border-2 border-foreground bg-highlight/30 p-4 transition-smooth hover:bg-highlight/50">
                    <input
                      type="checkbox"
                      checked={form.isWoman}
                      onChange={(e) =>
                        setForm({ ...form, isWoman: e.target.checked })
                      }
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <div>
                      <div className="flex items-center gap-2 font-display text-base font-semibold">
                        <Sparkles className="h-4 w-4 text-primary" />
                        I'm a woman in tech (optional · self-identify)
                      </div>
                      <p className="mt-1 font-display text-sm italic text-foreground/75">
                        We're actively closing the mentor gender gap.
                        Self-identifying unlocks{" "}
                        <span className="font-bold">
                          +50 she-builds bonus pts
                        </span>{" "}
                        and double-featuring on the community page for your
                        first month.
                      </p>
                    </div>
                  </label>

                  <div className="mt-6 flex items-center justify-between border-t-2 border-foreground/15 pt-5">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      reward · mentor badge + 100 pts
                      {form.isWoman ? " + 50 she-builds" : ""}
                    </span>
                    <Button onClick={submit} variant="hero" size="lg">
                      <Award className="h-4 w-4" /> submit application
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-foreground bg-success shadow-stamp">
                    <Check className="h-8 w-8 text-success-foreground" />
                  </div>
                  <h3 className="mt-6 font-display text-3xl font-bold">
                    you're in <span className="text-accent">.</span>
                  </h3>
                  <p className="mt-3 font-display text-base text-muted-foreground">
                    Mentor badge unlocked. We'll route the next matching
                    question to your inbox.
                  </p>
                  {womanInTeam && (
                    <div className="mx-auto mt-5 inline-flex items-center gap-2 border-2 border-foreground bg-highlight/70 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.16em]">
                      <Sparkles className="h-3.5 w-3.5" /> she-builds bonus +50
                      applied
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.section>
        )} */}
      </div>

      <Dialog
        open={showInboxDialog}
        onOpenChange={(open) => {
          if (!open) {
            closeInboxDialog();
            return;
          }
          setShowInboxDialog(true);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {!emailSubmitted ? (
            <>
              <DialogHeader>
                <DialogTitle>Open Your Inbox</DialogTitle>
                <DialogDescription>
                  Enter your email ID and we’ll reach out shortly with the next
                  steps.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <label className="label-caps">email ID</label>
                <Input
                  type="email"
                  value={mentorEmail}
                  onChange={(e) => setMentorEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 border-2 border-foreground bg-background font-mono"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeInboxDialog}>
                  cancel
                </Button>
                <Button variant="hero" onClick={submitMentorEmail}>
                  submit
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>You’re on our list</DialogTitle>
                <DialogDescription>
                  Okay, we’ll get back to you shortly at {mentorEmail.trim()}.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={closeInboxDialog}>
                  close
                </Button>
                {/* <Button
                  variant="hero"
                  onClick={() => {
                    closeInboxDialog();
                    setShowForm(true);
                  }}
                >
                  continue to mentor form
                </Button> */}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Mentor;
