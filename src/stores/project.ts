import { create } from "zustand";

export type ComponentKind = "frontend" | "backend" | "api" | "database" | "cache" | "queue" | "ai" | "auth" | "storage" | "cdn";

export interface TechOption {
  name: string;       // e.g. "PostgreSQL"
  logoKey: string;    // maps to TECH_LOGOS registry, e.g. "postgresql"
  reason: string;     // why this alternative
}

export interface ArchComponent {
  id: string;
  name: string;              // role name e.g. "Primary Database"
  kind: ComponentKind;
  tech: string;              // chosen tech e.g. "PostgreSQL"
  logoKey: string;           // e.g. "postgresql"
  description: string;
  why: string;
  pros: string[];
  cons: string[];
  alternatives: TechOption[];
  x: number;
  y: number;
}

export interface ArchConnection {
  from: string;
  to: string;
  label?: string;
}

export interface OnboardingAnswers {
  idea: string;
  audience: string;
  flow: string;
}

export type Badge =
  | "first-draft"
  | "scale-thinker"
  | "bias-buster"
  | "deconstructor"
  | "mentor"
  | "she-builds"
  | "community-voice";

export interface AdvancedConstraints {
  expectedUsers: string;        // "< 1k" | "1k–100k" | "100k–1M" | "> 1M"
  gpuRequired: boolean;
  memoryBudget: string;         // "low" | "medium" | "high" | "unlimited"
  privacy: string;              // "standard" | "hipaa" | "gdpr" | "both"
  realtime: boolean;
  offline: boolean;
  costSensitive: boolean;
}

interface ProjectState {
  onboarded: boolean;
  projectId: string | null;
  requirementsDoc: string;
  answers: OnboardingAnswers;
  components: ArchComponent[];
  connections: ArchConnection[];
  diagramXml: string | null;
  constraints: AdvancedConstraints;
  points: number;
  badges: Badge[];
  womanInTeam: boolean;

  setWomanInTeam: (v: boolean) => void;
  awardPoints: (n: number, reason?: string) => void;
  awardBadge: (b: Badge) => void;
  setAnswers: (a: OnboardingAnswers) => void;
  setOnboarded: (v: boolean) => void;
  setProjectId: (id: string) => void;
  setRequirementsDoc: (doc: string) => void;
  setComponents: (c: ArchComponent[]) => void;
  setConnections: (c: ArchConnection[]) => void;
  setDiagramXml: (xml: string | null) => void;
  setConstraints: (c: Partial<AdvancedConstraints>) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  removeComponent: (id: string) => void;
  addComponent: (c: ArchComponent) => void;
  reset: () => void;
}

const empty: OnboardingAnswers = { idea: "", audience: "", flow: "" };
const defaultConstraints: AdvancedConstraints = {
  expectedUsers: "1k–100k",
  gpuRequired: false,
  memoryBudget: "medium",
  privacy: "standard",
  realtime: false,
  offline: false,
  costSensitive: false,
};

export const useProject = create<ProjectState>((set) => ({
  onboarded: false,
  projectId: null,
  requirementsDoc: "",
  answers: empty,
  components: [],
  connections: [],
  diagramXml: null,
  constraints: defaultConstraints,
  points: 0,
  badges: [],
  womanInTeam: false,

  setWomanInTeam: (v) =>
    set((s) => ({
      womanInTeam: v,
      points: v && !s.womanInTeam ? s.points + 50 : s.points,
      badges: v && !s.badges.includes("she-builds") ? [...s.badges, "she-builds"] : s.badges,
    })),
  awardPoints: (n) => set((s) => ({ points: s.points + n })),
  awardBadge: (b) => set((s) => (s.badges.includes(b) ? s : { badges: [...s.badges, b] })),
  setAnswers: (a) => set({ answers: a }),
  setOnboarded: (v) => set({ onboarded: v }),
  setProjectId: (id) => set({ projectId: id }),
  setRequirementsDoc: (doc) => set({ requirementsDoc: doc }),
  setComponents: (c) => set({ components: c }),
  setConnections: (c) => set({ connections: c }),
  setDiagramXml: (xml) => set({ diagramXml: xml }),
  setConstraints: (c) => set((s) => ({ constraints: { ...s.constraints, ...c } })),
  moveComponent: (id, x, y) =>
    set((s) => ({ components: s.components.map((c) => (c.id === id ? { ...c, x, y } : c)) })),
  removeComponent: (id) =>
    set((s) => ({ components: s.components.filter((c) => c.id !== id) })),
  addComponent: (c) => set((s) => ({ components: [...s.components, c] })),
  reset: () =>
    set({
      onboarded: false,
      projectId: null,
      requirementsDoc: "",
      answers: empty,
      components: [],
      connections: [],
      diagramXml: null,
      constraints: defaultConstraints,
      points: 0,
      badges: [],
      womanInTeam: false,
    }),
}));
