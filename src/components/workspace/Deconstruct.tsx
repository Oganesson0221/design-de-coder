import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Award, Briefcase, Camera, Car, Loader2, MessageSquare, Send, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useProject } from "@/stores/project";

interface QuestionOption {
  text: string;
  correct: boolean;
  note: string;
}

interface Question {
  id: string;
  prompt: string;
  hint: string;
  options: QuestionOption[];
}

interface Terminology {
  term: string;
  explanation: string;
}

interface DeconstructModule {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  terminology: Terminology[];
  diagramPrompt: string;
  questions: Question[];
}

interface MentorMessage {
  role: "assistant" | "user";
  text: string;
}

interface QuestionEval {
  score: number;
  feedback: string;
  recommended: string;
  pointsAwarded: number;
}

type Stage = "questions" | "diagram";

const REQUIRED_QUESTION_COUNT = 3;
const DRAWIO_EMBED =
  "https://embed.diagrams.net/?embed=1&proto=json&ui=min&noSaveBtn=1&noExitBtn=1&spin=1&libraries=0&lang=en";

const FALLBACK_MODULES: DeconstructModule[] = [
  {
    id: "instagram",
    title: "Instagram",
    subtitle: "Photo/video sharing with feed ranking and media pipelines.",
    icon: "camera",
    terminology: [
      { term: "CDN", explanation: "A CDN caches media close to users so photos and videos load fast." },
      { term: "Object storage", explanation: "Storage optimized for large binary files like images and videos." },
      { term: "Fan-out", explanation: "How a post gets distributed to followers' feeds." },
    ],
    diagramPrompt:
      "Design Instagram-like architecture with login/auth, upload pipeline, media processing workers, feed service, cache, object storage, and CDN.",
    questions: [
      {
        id: "ig-q1",
        prompt: "Start with login flow: which services should handle authentication and session/token validation?",
        hint: "Think API gateway, auth service, and token/session store before feed reads.",
        options: [
          {
            text: "Gateway + dedicated auth service + token/session validation layer",
            correct: true,
            note: "Strong. Keep auth isolated and reusable across all APIs.",
          },
        ],
      },
      {
        id: "ig-q2",
        prompt: "For uploading photos/videos, what should be synchronous vs asynchronous?",
        hint: "Users need fast acknowledgement, but heavy media processing should be deferred.",
        options: [
          {
            text: "Synchronous upload acceptance, async processing via queue/workers",
            correct: true,
            note: "Correct. Async workers prevent upload requests from timing out.",
          },
        ],
      },
      {
        id: "ig-q3",
        prompt: "Where do CDN and object storage fit in the read path for home feed media?",
        hint: "Serve media from edge; metadata and ranking come from backend services.",
        options: [
          {
            text: "CDN serves media files from object storage; backend serves metadata/ranking",
            correct: true,
            note: "Yes. This keeps media delivery fast and backend load manageable.",
          },
        ],
      },
    ],
  },
  {
    id: "spotify",
    title: "Spotify",
    subtitle: "Low-latency music streaming, recommendation pipelines, and playlists.",
    icon: "music",
    terminology: [
      { term: "Adaptive bitrate", explanation: "The player switches quality based on network conditions." },
      { term: "Edge cache", explanation: "Caches popular tracks close to users to reduce latency." },
      { term: "Recommendation pipeline", explanation: "Offline + near-real-time jobs for personalization." },
    ],
    diagramPrompt:
      "Design Spotify-like architecture with login, playback APIs, stream manifest service, CDN/edge cache, recommendation services, and analytics events.",
    questions: [
      {
        id: "sp-q1",
        prompt: "For Spotify login and premium entitlements, what should happen before playback is authorized?",
        hint: "Authentication and entitlement checks are separate but both are needed.",
        options: [{ text: "Authenticate user, then check entitlement in policy/subscription service", correct: true, note: "Correct." }],
      },
      {
        id: "sp-q2",
        prompt: "How do you prevent buffering spikes during playback at scale?",
        hint: "Think adaptive bitrate + cached segments near users.",
        options: [{ text: "Use adaptive bitrate and edge caching for stream segments", correct: true, note: "Correct." }],
      },
      {
        id: "sp-q3",
        prompt: "How should recommendations be produced and served?",
        hint: "Separate heavy model computation from low-latency serving.",
        options: [{ text: "Hybrid offline/online pipeline with low-latency serving store", correct: true, note: "Correct." }],
      },
    ],
  },
  {
    id: "grab",
    title: "Grab",
    subtitle: "Real-time matching, dispatch, notifications, and payments.",
    icon: "car",
    terminology: [
      { term: "Geospatial index", explanation: "Index for fast nearby-driver lookups by coordinates." },
      { term: "Dispatch service", explanation: "Matches riders to drivers using ETA, distance, and constraints." },
      { term: "Event-driven", explanation: "State transitions are sent as events to downstream services." },
    ],
    diagramPrompt:
      "Design Grab-like architecture including rider/driver auth, location ingestion, dispatch, trip-state machine, notifications, and payments.",
    questions: [
      {
        id: "gr-q1",
        prompt: "During login and app startup, what state must rider and driver apps fetch first?",
        hint: "Identity, active trip/session state, and capability flags.",
        options: [{ text: "Identity + active trip/session + role capabilities", correct: true, note: "Correct." }],
      },
      {
        id: "gr-q2",
        prompt: "What makes driver matching low-latency in dense cities?",
        hint: "Nearby queries and fresh location updates are key.",
        options: [{ text: "Geospatial index + frequent location stream + dispatch service", correct: true, note: "Correct." }],
      },
      {
        id: "gr-q3",
        prompt: "How should trip state updates fan out to notifications, billing, and analytics?",
        hint: "Decouple consumers with event streams and idempotent processing.",
        options: [{ text: "Publish trip events to queue/stream and consume asynchronously", correct: true, note: "Correct." }],
      },
    ],
  },
  {
    id: "linkedin",
    title: "LinkedIn",
    subtitle: "Professional graph, feed ranking, search, and messaging.",
    icon: "briefcase",
    terminology: [
      { term: "Graph edge", explanation: "A stored relationship between two members/entities." },
      { term: "Inverted index", explanation: "Index used for scalable text search relevance." },
      { term: "Feature store", explanation: "Low-latency store of ranking features used by models." },
    ],
    diagramPrompt:
      "Design LinkedIn-like architecture with auth, profile service, graph service, feed ranking, search index, notifications, and messaging.",
    questions: [
      {
        id: "li-q1",
        prompt: "For LinkedIn login flow, what should be loaded immediately after authentication succeeds?",
        hint: "Think identity context, permissions, and minimal profile shell.",
        options: [{ text: "Session claims + permissions + lightweight profile context", correct: true, note: "Correct." }],
      },
      {
        id: "li-q2",
        prompt: "What data model supports connection-degree lookups efficiently?",
        hint: "Graph adjacency plus caching is common.",
        options: [{ text: "Graph-oriented adjacency model with cache", correct: true, note: "Correct." }],
      },
      {
        id: "li-q3",
        prompt: "Which service type should power profile/job search relevance?",
        hint: "Dedicated search engine rather than OLTP scans.",
        options: [{ text: "Search service backed by inverted index", correct: true, note: "Correct." }],
      },
    ],
  },
];

const iconMap: Record<string, typeof Camera> = {
  camera: Camera,
  music: MessageSquare,
  car: Car,
  briefcase: Briefcase,
  shopping: ShoppingBag,
};

function normalizeModules(modules: DeconstructModule[]) {
  return modules.map((module) => {
    const existing = Array.isArray(module.questions) ? module.questions : [];
    const loginQuestion: Question = {
      id: `${module.id}-login`,
      prompt: `In ${module.title}, start from the login flow: which components handle identity, session/token issuance, and authorization checks on protected APIs?`,
      hint: "Map client -> gateway -> auth -> token/session verification before domain services.",
      options: [{ text: "Client -> gateway -> auth -> token/session verification -> protected APIs", correct: true, note: "Good baseline." }],
    };
    const filler: Question[] = [
      {
        id: `${module.id}-core`,
        prompt: `After login succeeds, what core domain service call should happen next for ${module.title}, and why?`,
        hint: "Pick the first user-visible action in this product and map that request path.",
        options: [{ text: "A domain-specific read/write call with clear ownership and persistence", correct: true, note: "Good architecture framing." }],
      },
      {
        id: `${module.id}-scale`,
        prompt: `Which bottleneck do you expect first at scale in ${module.title}, and what mitigation would you design now?`,
        hint: "Think read amplification, queue backlogs, hot keys, or expensive joins.",
        options: [{ text: "Identify one real bottleneck and pair it with cache/queue/shard/async mitigation", correct: true, note: "Solid." }],
      },
    ];

    const hasLoginFirst = (existing[0]?.prompt || "").toLowerCase().includes("login");
    const combined = hasLoginFirst ? existing : [loginQuestion, ...existing];

    return {
      ...module,
      questions: [...combined, ...filler].slice(0, REQUIRED_QUESTION_COUNT),
    };
  });
}

function tokenize(input: string) {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function evaluateFreeText(question: Question, answer: string): QuestionEval {
  const expected = question.options.find((o) => o.correct) || question.options[0];
  if (!expected) {
    return {
      score: 5,
      feedback: "Good attempt. Add more explicit components and request flow.",
      recommended: "State client -> API gateway -> core services -> storage -> async path.",
      pointsAwarded: 5,
    };
  }

  const expectedTokens = Array.from(new Set(tokenize(expected.text))).slice(0, 10);
  const answerText = answer.toLowerCase();
  const matched = expectedTokens.filter((token) => answerText.includes(token));
  const ratio = expectedTokens.length === 0 ? 0.6 : matched.length / expectedTokens.length;
  const score = Math.max(1, Math.min(10, Math.round(ratio * 10)));

  if (score >= 8) {
    return {
      score,
      feedback: "Strong answer. You mapped the core flow with good architectural grounding.",
      recommended: expected.text,
      pointsAwarded: 12,
    };
  }
  if (score >= 5) {
    return {
      score,
      feedback:
        "Good direction. Tighten it by naming concrete services, data stores, and one failure/latency safeguard.",
      recommended: expected.text,
      pointsAwarded: 8,
    };
  }
  return {
    score,
    feedback:
      "Decent start. You are close, but you need clearer flow steps and subsystem responsibilities.",
    recommended: expected.text,
    pointsAwarded: 4,
  };
}

export default function Deconstruct() {
  const [modules, setModules] = useState<DeconstructModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleId, setModuleId] = useState("");

  const [stage, setStage] = useState<Stage>("questions");
  const [currentQ, setCurrentQ] = useState(0);
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [questionEvals, setQuestionEvals] = useState<Record<string, QuestionEval>>({});
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [diagramDraft, setDiagramDraft] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const initSentRef = useRef(false);
  const xmlResolveRef = useRef<((xml: string) => void) | null>(null);
  const pendingExportRef = useRef(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<{
    score: number;
    passed: boolean;
    feedback: string;
    hints: string[];
  } | null>(null);
  const [awardedForDiagram, setAwardedForDiagram] = useState<Record<string, boolean>>({});

  const [mentorMessages, setMentorMessages] = useState<MentorMessage[]>([]);
  const [mentorInput, setMentorInput] = useState("");
  const [mentorBusy, setMentorBusy] = useState(false);

  const awardPoints = useProject((s) => s.awardPoints);
  const awardBadge = useProject((s) => s.awardBadge);

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      let msg: Record<string, unknown> = {};
      try {
        if (typeof ev.data === "string") msg = JSON.parse(ev.data) as Record<string, unknown>;
        else if (typeof ev.data === "object" && ev.data !== null) msg = ev.data as Record<string, unknown>;
      } catch {
        return;
      }

      const event = msg.event as string | undefined;
      if (event === "init" || event === "load") {
        if (!initSentRef.current) {
          initSentRef.current = true;
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ action: "load", xml: "<mxGraphModel/>" }),
            "*",
          );
        }
        setIframeReady(true);
        if (pendingExportRef.current) {
          pendingExportRef.current = false;
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ action: "export", format: "xml" }),
            "*",
          );
        }
      }

      if (event === "export") {
        const xml = (msg.xml as string) ?? (msg.data as string) ?? "";
        if (xmlResolveRef.current) {
          xmlResolveRef.current(xml);
          xmlResolveRef.current = null;
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/deconstruct/modules");
        if (!res.ok) throw new Error(`Failed ${res.status}`);
        const data = (await res.json()) as { modules: DeconstructModule[] };
        if (!mounted) return;
        const nextModules = normalizeModules(data.modules || []);
        if (!nextModules.length) throw new Error("No modules");
        setModules(nextModules);
        setModuleId(nextModules[0].id);
      } catch {
        if (!mounted) return;
        const fallback = normalizeModules(FALLBACK_MODULES);
        setModules(fallback);
        setModuleId(fallback[0].id);
        toast("Deconstruct API unavailable. Loaded built-in modules.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const active = useMemo(
    () => modules.find((m) => m.id === moduleId) || modules[0],
    [modules, moduleId],
  );
  const Icon = iconMap[active?.icon || "camera"] || Camera;

  const activeQuestions = useMemo(() => {
    if (!active) return [];
    return (active.questions || []).slice(0, REQUIRED_QUESTION_COUNT);
  }, [active]);

  const activeQuestion = useMemo(() => activeQuestions[currentQ], [activeQuestions, currentQ]);
  const answeredCount = useMemo(
    () => activeQuestions.filter((q) => questionEvals[q.id]).length,
    [activeQuestions, questionEvals],
  );
  const allQuestionsDone = answeredCount >= activeQuestions.length && activeQuestions.length > 0;

  const recommendedPrompts = useMemo(() => {
    if (!active) return [];
    const q = activeQuestion?.prompt || "the current architecture question";
    const firstTerm = active.terminology[0]?.term || "system bottleneck";
    return [
      `Explain this question in plain words: "${q}"`,
      `Give me one hint for this question without the full answer.`,
      `Define "${firstTerm}" and why it matters for ${active.title}.`,
    ];
  }, [active, activeQuestion]);

  useEffect(() => {
    if (!active) return;
    setStage("questions");
    setCurrentQ(0);
    setQuestionAnswer("");
    setQuestionEvals({});
    setDiagramDraft("");
    setEvalResult(null);
    setIframeReady(false);
    initSentRef.current = false;
    pendingExportRef.current = false;
    setMentorMessages([
      {
        role: "assistant",
        text:
          `We’ll do this in two stages for ${active.title}: first 3 targeted architecture questions, then diagram evaluation. ` +
          `I’ll explain any term before I probe your answer.`,
      },
    ]);
  }, [active?.id]);

  const submitQuestionAnswer = async () => {
    if (!activeQuestion || !questionAnswer.trim()) return;
    setQuestionSubmitting(true);
    try {
      const answerText = questionAnswer.trim();
      const res = await fetch("/api/deconstruct/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: active.id,
          questionId: activeQuestion.id,
          question: activeQuestion.prompt,
          hint: activeQuestion.hint,
          expectedAnswer:
            activeQuestion.options.find((o) => o.correct)?.text || activeQuestion.options[0]?.text || "",
          answer: answerText,
        }),
      });

      let result: QuestionEval;
      if (res.ok) {
        const data = (await res.json()) as Partial<QuestionEval>;
        result = {
          score: Number(data.score || 5),
          feedback: String(data.feedback || "Good attempt."),
          recommended: String(data.recommended || ""),
          pointsAwarded: Number(data.pointsAwarded || 0),
        };
      } else {
        result = evaluateFreeText(activeQuestion, answerText);
      }

      setQuestionEvals((prev) => ({ ...prev, [activeQuestion.id]: result }));
      if (result.pointsAwarded > 0) {
        awardPoints(result.pointsAwarded);
        if (result.pointsAwarded >= 8) awardBadge("deconstructor");
      }
      toast(`+${result.pointsAwarded} points · answer reviewed`);
    } catch {
      const fallback = evaluateFreeText(activeQuestion, questionAnswer.trim());
      setQuestionEvals((prev) => ({ ...prev, [activeQuestion.id]: fallback }));
      if (fallback.pointsAwarded > 0) {
        awardPoints(fallback.pointsAwarded);
        if (fallback.pointsAwarded >= 8) awardBadge("deconstructor");
      }
      toast(`+${fallback.pointsAwarded} points · answer reviewed`);
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const goNextQuestion = () => {
    if (!activeQuestion) return;
    if (!questionEvals[activeQuestion.id]) return;
    const next = currentQ + 1;
    if (next >= activeQuestions.length) {
      setStage("diagram");
      setQuestionAnswer("");
      return;
    }
    setCurrentQ(next);
    setQuestionAnswer("");
  };

  const evaluateDiagram = async () => {
    if (!active) return;
    setEvalLoading(true);
    try {
      const diagramXml = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("export-timeout")), 9000);
        xmlResolveRef.current = (xml) => {
          clearTimeout(timeout);
          resolve(xml || "");
        };
        if (iframeReady) {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ action: "export", format: "xml" }),
            "*",
          );
        } else {
          pendingExportRef.current = true;
        }
      });

      const payload = diagramXml.trim() ? diagramXml : diagramDraft.trim();
      if (!payload) {
        toast("Draw a diagram (or add a draft note) before evaluation.");
        setEvalLoading(false);
        return;
      }

      const res = await fetch("/api/deconstruct/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: active.id, answer: payload }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as {
        score: number;
        passed: boolean;
        feedback: string;
        hints: string[];
        pointsAwarded: number;
      };
      setEvalResult({
        score: data.score,
        passed: data.passed,
        feedback: data.feedback,
        hints: data.hints || [],
      });
      const rewardKey = `${active.id}-diagram`;
      if (!awardedForDiagram[rewardKey] && (data.pointsAwarded || 0) > 0) {
        awardPoints(data.pointsAwarded);
        awardBadge("deconstructor");
        setAwardedForDiagram((prev) => ({ ...prev, [rewardKey]: true }));
        toast(`+${data.pointsAwarded} points · diagram evaluated`);
      } else {
        toast("Diagram evaluated.");
      }
    } catch {
      toast("Could not evaluate diagram answer.");
    } finally {
      setEvalLoading(false);
    }
  };

  const askMentor = async () => {
    if (!active || !mentorInput.trim()) return;
    const text = mentorInput.trim();
    setMentorInput("");
    setMentorMessages((prev) => [...prev, { role: "user", text }]);
    setMentorBusy(true);
    try {
      const res = await fetch("/api/deconstruct/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: active.id, message: text }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { reply: string };
      setMentorMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      const term = active.terminology[0];
      const fallback =
        term
          ? `Try this approach: map request flow first, then async path, then storage. Also remember "${term.term}" means: ${term.explanation}`
          : "Try mapping request flow first, then async processing, then storage/caching decisions.";
      setMentorMessages((prev) => [...prev, { role: "assistant", text: fallback }]);
      toast("Mentor backend unavailable. Showing local guidance.");
    } finally {
      setMentorBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!active) {
    return <div className="h-full grid place-items-center text-muted-foreground">No deconstruction modules found.</div>;
  }

  const currentEval = activeQuestion ? questionEvals[activeQuestion.id] : null;

  return (
    <div className="h-full w-full overflow-y-auto bg-paper">
      <div className="flex h-full w-full min-h-0 flex-col px-0 py-0">
        <div className="mx-5 mb-5 shrink-0 border-b-2 border-foreground pb-5 pt-6">
          <div className="label-caps mb-2">Chapter Three</div>
          <h1 className="font-display text-4xl font-medium leading-none md:text-5xl">Learn by Deconstruction</h1>
          <p className="mt-3 max-w-3xl font-display text-lg italic text-muted-foreground">
            Stage 1: answer 3 architecture questions. Stage 2: submit your architecture draft for scoring.
          </p>
        </div>

        <div className="mx-5 mb-5 shrink-0 border-b border-foreground/15 pb-2">
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => (
              <button
                key={m.id}
                onClick={() => setModuleId(m.id)}
                className={`border-b-2 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-smooth ${
                  m.id === active.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.title}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 w-full grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <main className="min-h-0 overflow-y-auto px-5 pb-24 pr-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${active.id}-${stage}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <div className="mb-6 flex items-start gap-4 border border-foreground/20 bg-card p-5">
                  <div className="grid h-14 w-14 shrink-0 place-items-center border border-foreground/30">
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <div className="label-caps mb-1">Specimen</div>
                    <h2 className="font-display text-2xl font-medium leading-tight">{active.title}</h2>
                    <p className="mt-1 font-display text-base italic text-muted-foreground">{active.subtitle}</p>
                  </div>
                </div>

                <div className="mb-5 flex items-center justify-between border border-foreground/20 bg-card px-4 py-3">
                  <div className="label-caps">
                    {stage === "questions" ? `Stage 1 · Question ${Math.min(currentQ + 1, activeQuestions.length)} of ${activeQuestions.length}` : "Stage 2 · Diagram Evaluation"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {activeQuestions.map((q, i) => (
                      <div
                        key={q.id}
                        className={`h-1.5 w-9 ${
                          i < answeredCount ? "bg-foreground" : i === currentQ && stage === "questions" ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {stage === "questions" && activeQuestion && (
                  <section className="border border-foreground/20 bg-card p-5">
                    <div className="flex items-baseline gap-4">
                      <span className="font-display text-3xl text-primary">§{currentQ + 1}</span>
                      <div className="flex-1">
                        <h3 className="font-display text-xl font-medium leading-snug">{activeQuestion.prompt}</h3>
                        <p className="mt-2 font-display text-sm italic text-muted-foreground">{activeQuestion.hint}</p>
                      </div>
                    </div>

                    {!currentEval && (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={questionAnswer}
                          onChange={(e) => setQuestionAnswer(e.target.value)}
                          rows={5}
                          className="w-full resize-none border border-foreground/20 bg-paper p-4 font-display text-sm leading-relaxed outline-none"
                          placeholder="Write your architecture reasoning here..."
                        />
                        <div className="sticky bottom-0 z-10 -mx-2 border-t border-foreground/15 bg-card/95 px-2 pb-1 pt-2 backdrop-blur-sm">
                          <button
                            onClick={() => void submitQuestionAnswer()}
                            disabled={!questionAnswer.trim() || questionSubmitting}
                            className="inline-flex items-center gap-2 border border-foreground px-3 py-2 text-xs font-mono uppercase tracking-[0.12em] transition-smooth hover:bg-secondary disabled:opacity-60"
                          >
                            {questionSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            {questionSubmitting ? "Evaluating..." : "Review answer"}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {currentEval && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between border border-foreground/15 px-3 py-2">
                          <span className="label-caps">Answer quality</span>
                          <span className="font-display text-lg">{currentEval.score}/10</span>
                        </div>
                        <div className="border-l-2 border-primary bg-secondary/40 p-3">
                          <p className="text-sm italic text-foreground/85">{currentEval.feedback}</p>
                        </div>
                        <div className="border border-foreground/15 bg-card p-3">
                          <div className="label-caps mb-1">Recommended answer shape</div>
                          <p className="text-sm text-foreground/90">{currentEval.recommended}</p>
                        </div>
                        <button
                          onClick={goNextQuestion}
                          className="inline-flex items-center gap-2 border border-foreground px-3 py-2 text-xs font-mono uppercase tracking-[0.12em] transition-smooth hover:bg-secondary"
                        >
                          {currentQ === activeQuestions.length - 1 ? "Move to diagram stage" : "Next question"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {stage === "diagram" && (
                  <section className="border border-foreground/20 bg-card p-5">
                    <div className="label-caps mb-2">Architecture Draft Prompt</div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{active.diagramPrompt}</p>
                    <div className="mt-4 overflow-hidden rounded border border-foreground/20 bg-paper">
                      <div className="relative h-[480px] w-full min-h-[420px]">
                        {!iframeReady && (
                          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-paper/95">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                              Loading draw.io canvas...
                            </span>
                          </div>
                        )}
                        <iframe
                          key={`${active.id}-drawio`}
                          ref={iframeRef}
                          src={DRAWIO_EMBED}
                          className="h-full w-full border-0"
                          title="Deconstruct diagram canvas"
                          allow="clipboard-write"
                        />
                      </div>
                    </div>
                    <textarea
                      value={diagramDraft}
                      onChange={(e) => setDiagramDraft(e.target.value)}
                      className="mt-3 min-h-[72px] w-full resize-y rounded border border-foreground/20 bg-paper p-3 font-mono text-xs leading-relaxed outline-none"
                      placeholder="Optional notes: explain your architecture choices for evaluation context..."
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => void evaluateDiagram()}
                        disabled={evalLoading}
                        className="inline-flex items-center gap-2 border border-foreground px-3 py-2 text-xs font-mono uppercase tracking-[0.12em] transition-smooth hover:bg-secondary disabled:opacity-60"
                      >
                        {evalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Evaluate architecture
                      </button>
                      {evalResult && (
                        <span className={`text-xs font-mono ${evalResult.passed ? "text-primary" : "text-muted-foreground"}`}>
                          Score: {evalResult.score}/100
                        </span>
                      )}
                    </div>
                    {evalResult && (
                      <div className="mt-3 border-l-2 border-primary bg-secondary/40 p-3">
                        <p className="text-sm italic text-foreground/85">{evalResult.feedback}</p>
                        {evalResult.hints.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {evalResult.hints.map((h) => (
                              <li key={h} className="text-xs text-muted-foreground">
                                - {h}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2 border border-foreground/15 bg-card px-3 py-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Questions completed: {answeredCount}/{activeQuestions.length}. You can still revise and re-evaluate this draft.
                      </span>
                    </div>
                    {!allQuestionsDone && (
                      <div className="mt-3 border-l-2 border-destructive/60 bg-destructive/5 p-3">
                        <p className="text-xs text-muted-foreground">
                          Complete all 3 questions for full deconstruction points before finalizing your diagram response.
                        </p>
                      </div>
                    )}
                  </section>
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          <aside className="flex min-h-0 flex-col border-l border-foreground/20 bg-card">
            <div className="shrink-0 border-b border-foreground/15 p-4">
              <div className="label-caps mb-1">Mentor Copilot</div>
              <p className="text-xs text-muted-foreground">
                Ask for term explanations, architecture hints, and next-step probes tied to your current question.
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="space-y-3 pb-2">
                {mentorMessages.map((m, i) => (
                  <div key={`${m.role}-${i}`} className={m.role === "assistant" ? "text-left" : "text-right"}>
                    <div
                      className={`inline-block max-w-[96%] whitespace-pre-wrap break-words rounded-sm px-3 py-2 text-[12px] leading-relaxed ${
                        m.role === "assistant" ? "bg-secondary text-foreground" : "bg-foreground text-background"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {mentorMessages.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    Mentor chat will appear here. Ask for definitions, tradeoffs, or a probing follow-up question.
                  </div>
                )}
                </div>
              </div>
              <div className="sticky bottom-0 shrink-0 border-t border-foreground/15 bg-card p-3">
                <details className="mb-2 rounded border border-foreground/15 bg-paper px-2 py-1">
                  <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Recommended questions
                  </summary>
                  <div className="mt-2 space-y-1">
                    {recommendedPrompts.map((q) => (
                      <button
                        key={q}
                        onClick={() => setMentorInput(q)}
                        className="block w-full border-l-2 border-foreground/20 py-1 pl-2 text-left text-[11px] text-muted-foreground hover:border-primary hover:text-foreground"
                      >
                        {q}
                      </button>
                    ))}
                    {active.terminology.slice(0, 3).map((t) => (
                      <button
                        key={t.term}
                        onClick={() => setMentorInput(`Explain "${t.term}" in ${active.title} and ask me one follow-up design question.`)}
                        className="block w-full border-l-2 border-foreground/20 py-1 pl-2 text-left text-[11px] text-muted-foreground hover:border-primary hover:text-foreground"
                      >
                        {t.term}: {t.explanation}
                      </button>
                    ))}
                  </div>
                </details>
                <div className="flex gap-2">
                  <input
                    value={mentorInput}
                    onChange={(e) => setMentorInput(e.target.value)}
                    className="h-9 w-full border border-foreground/20 bg-paper px-2 text-xs outline-none"
                    placeholder="Ask deconstruction mentor..."
                  />
                  <button
                    onClick={() => void askMentor()}
                    disabled={mentorBusy || !mentorInput.trim()}
                    className="inline-flex h-9 w-9 items-center justify-center border border-foreground bg-background transition-smooth hover:bg-secondary disabled:opacity-60"
                  >
                    {mentorBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
