import { create } from "zustand";

export type ComponentKind = "frontend" | "backend" | "api" | "database" | "ai";

export interface ArchComponent {
  id: string;
  name: string;
  kind: ComponentKind;
  description: string;
  why: string;
  pros: string[];
  cons: string[];
  alternatives: { name: string; reason: string }[];
  x: number;
  y: number;
}

export interface OnboardingAnswers {
  idea: string;
  audience: string;
  flow: string;
}

interface ProjectState {
  onboarded: boolean;
  answers: OnboardingAnswers;
  components: ArchComponent[];
  setAnswers: (a: OnboardingAnswers) => void;
  setOnboarded: (v: boolean) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  removeComponent: (id: string) => void;
  addComponent: (c: ArchComponent) => void;
  reset: () => void;
}

function generateInitialArchitecture(a: OnboardingAnswers): ArchComponent[] {
  const idea = a.idea || "your idea";
  return [
    {
      id: "fe-web",
      name: "Web Frontend",
      kind: "frontend",
      description: `The interface ${a.audience || "your users"} will see and interact with for "${idea}". Built with React and a responsive design.`,
      why: "Users need a fast, accessible way to interact with the system from any device.",
      pros: ["Reaches all devices via browser", "Easy to iterate on", "Great ecosystem"],
      cons: ["Needs separate native apps for app-store presence", "SEO requires extra care"],
      alternatives: [
        { name: "Native iOS/Android", reason: "Better device-level features and offline UX." },
        { name: "Progressive Web App", reason: "Installable, offline-friendly without two codebases." },
      ],
      x: 80, y: 120,
    },
    {
      id: "fe-mobile",
      name: "Mobile Client",
      kind: "frontend",
      description: "An optional companion mobile experience for on-the-go usage.",
      why: "Many users will engage from phones; native gestures and notifications matter.",
      pros: ["Push notifications", "Smoother gestures", "Offline support"],
      cons: ["Two more codebases to maintain", "App-store approval cycles"],
      alternatives: [
        { name: "React Native", reason: "Share most code with the web app." },
      ],
      x: 80, y: 280,
    },
    {
      id: "api-gw",
      name: "API Gateway",
      kind: "api",
      description: "Single entrypoint that routes requests, handles auth, rate-limiting, and versioning.",
      why: "Centralizes cross-cutting concerns so each service can stay focused.",
      pros: ["Unified auth", "Rate limiting", "Easy versioning"],
      cons: ["Single point of failure if not redundant", "Extra hop in latency"],
      alternatives: [
        { name: "Direct service calls", reason: "Lower latency, but harder to govern." },
      ],
      x: 380, y: 200,
    },
    {
      id: "be-app",
      name: "Application Service",
      kind: "backend",
      description: `The core service that implements the rules of "${idea}".`,
      why: "Encapsulates the domain logic separate from UI and storage concerns.",
      pros: ["Testable business logic", "Independent scaling", "Clear boundaries"],
      cons: ["Operational overhead", "Needs careful API contracts"],
      alternatives: [
        { name: "Serverless functions", reason: "Pay-per-use, auto-scales, less ops." },
        { name: "Modular monolith", reason: "Simpler to start, split later if needed." },
      ],
      x: 660, y: 120,
    },
    {
      id: "be-worker",
      name: "Background Workers",
      kind: "backend",
      description: "Async jobs for emails, processing, or scheduled tasks.",
      why: "Keeps the request path fast; expensive work happens in the background.",
      pros: ["Smooth UX", "Retries and backoff", "Decoupled from user requests"],
      cons: ["Adds a queue to operate", "Eventual consistency"],
      alternatives: [
        { name: "Inline processing", reason: "Simpler, but slower responses." },
      ],
      x: 660, y: 280,
    },
    {
      id: "db-main",
      name: "Primary Database",
      kind: "database",
      description: "Stores user, content, and transactional data with strong consistency.",
      why: "Most apps need a reliable source of truth with relational guarantees.",
      pros: ["ACID transactions", "Mature tooling", "Strong querying"],
      cons: ["Vertical scaling limits", "Schema migrations need care"],
      alternatives: [
        { name: "Document DB", reason: "Flexible schema for evolving data shapes." },
        { name: "Key-value store", reason: "Ultra-fast reads for simple lookups." },
      ],
      x: 940, y: 200,
    },
    {
      id: "ai-mentor",
      name: "AI Mentor Service",
      kind: "ai",
      description: "Helpful AI that answers questions and suggests improvements as you design.",
      why: "Lowers the barrier for new builders; turns confusion into learning moments.",
      pros: ["Always-on guidance", "Personalized hints", "Encourages exploration"],
      cons: ["Token costs", "Needs guardrails for accuracy"],
      alternatives: [
        { name: "Static docs", reason: "Cheaper, but less responsive to context." },
      ],
      x: 380, y: 400,
    },
  ];
}

const empty: OnboardingAnswers = { idea: "", audience: "", flow: "" };

export const useProject = create<ProjectState>((set) => ({
  onboarded: false,
  answers: empty,
  components: [],
  setAnswers: (a) => set({ answers: a, components: generateInitialArchitecture(a) }),
  setOnboarded: (v) => set({ onboarded: v }),
  moveComponent: (id, x, y) =>
    set((s) => ({ components: s.components.map((c) => (c.id === id ? { ...c, x, y } : c)) })),
  removeComponent: (id) =>
    set((s) => ({ components: s.components.filter((c) => c.id !== id) })),
  addComponent: (c) => set((s) => ({ components: [...s.components, c] })),
  reset: () => set({ onboarded: false, answers: empty, components: [] }),
}));
