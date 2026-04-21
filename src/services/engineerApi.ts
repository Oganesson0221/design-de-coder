import type { ArchComponent, OnboardingAnswers } from "@/stores/project";

export interface SchemaColumn {
  name: string;
  type: string;
  constraints: string;
  notes: string;
}

export interface SchemaTable {
  name: string;
  description: string;
  columns: SchemaColumn[];
}

export interface SchemaRelationship {
  from: string;
  to: string;
  type: "many-to-one" | "one-to-many" | "many-to-many";
}

export interface DbSchemaData {
  tables: SchemaTable[];
  relationships: SchemaRelationship[];
}

interface SessionResponse {
  projectId: string;
  requirementsMarkdown: string;
  dbSchema: DbSchemaData;
  dbSchemaMermaid: string;
  dbSchemaDrawioXml: string;
  dbSchemaRationale: string;
  mentorScore: number;
  lastMentorQuestion: string;
  updatedAt: string;
}

interface SchemaResponse {
  projectId: string;
  dbSchema: DbSchemaData;
  dbSchemaMermaid: string;
  dbSchemaDrawioXml: string;
  dbSchemaRationale: string;
  mentorScore: number;
  lastMentorQuestion: string;
  updatedAt: string;
  requirementsMarkdown?: string;
}

async function asJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  return response.json() as Promise<T>;
}

export async function initEngineerSession({
  projectId,
  answers,
  architecture,
}: {
  projectId: string;
  answers: OnboardingAnswers;
  architecture: ArchComponent[];
}) {
  const response = await fetch("/api/engineer/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, answers, architecture }),
  });
  return asJson<SessionResponse>(response);
}

export async function askEngineerMentor({
  projectId,
  message,
}: {
  projectId: string;
  message: string;
}) {
  const response = await fetch("/api/engineer/mentor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, message }),
  });
  return asJson<{
    reply: string;
    pointsAwarded: number;
    totalPoints: number;
    isAnswerCorrect: boolean;
    terminology: { term: string; explanation: string }[];
    recommendedAnswers: string[];
  }>(response);
}

export async function generateSchema(projectId: string) {
  const response = await fetch("/api/engineer/schema/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  return asJson<SchemaResponse>(response);
}

export async function getSchema(projectId: string) {
  const response = await fetch(`/api/engineer/schema/${projectId}`);
  return asJson<SchemaResponse>(response);
}

export async function saveSchema(projectId: string, dbSchema: DbSchemaData) {
  const response = await fetch(`/api/engineer/schema/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dbSchema }),
  });
  return asJson<SchemaResponse>(response);
}

export async function applySchemaAgentChange({
  projectId,
  instruction,
}: {
  projectId: string;
  instruction: string;
}) {
  const response = await fetch("/api/engineer/agent/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, instruction }),
  });
  return asJson<SchemaResponse>(response);
}
