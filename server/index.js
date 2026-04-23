import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 8787);
const mongoUri = process.env.MONGODB_URI;
const openAiApiKey = process.env.OPENAI_API_KEY;

if (!mongoUri) {
  console.error("Missing MONGODB_URI in environment.");
  process.exit(1);
}

const mongo = new MongoClient(mongoUri);
const openai = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;
let db;
let sessions;
let projects;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function nowIso() {
  return new Date().toISOString();
}

function makeRequirementsMarkdown({ idea = "", audience = "", flow = "" }) {
  return [
    "# Product Requirements",
    "",
    "## Idea",
    idea || "N/A",
    "",
    "## Audience",
    audience || "N/A",
    "",
    "## User Flow",
    flow || "N/A",
    "",
  ].join("\n");
}

function normalizeProjectId(value) {
  return String(value || "").trim();
}

function toMarkdownFromObject(value) {
  if (!value || typeof value !== "object") return "";
  const orderedKeys = [
    "title",
    "overview",
    "problem",
    "solution",
    "goals",
    "nonGoals",
    "scope",
    "users",
    "flows",
    "requirements",
  ];
  const keys = [...new Set([...orderedKeys, ...Object.keys(value)])];
  const sections = [];
  for (const key of keys) {
    const sectionValue = value[key];
    if (sectionValue == null || sectionValue === "") continue;
    if (Array.isArray(sectionValue)) {
      if (sectionValue.length === 0) continue;
      sections.push(`## ${key}\n${sectionValue.map((x) => `- ${String(x)}`).join("\n")}`);
      continue;
    }
    if (typeof sectionValue === "object") {
      const lines = Object.entries(sectionValue)
        .map(([k, v]) => `- ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join("\n");
      if (lines) sections.push(`## ${key}\n${lines}`);
      continue;
    }
    sections.push(`## ${key}\n${String(sectionValue)}`);
  }
  return sections.join("\n\n").trim();
}

function extractRequirementsFromProjectDoc(projectDoc) {
  if (!projectDoc || typeof projectDoc !== "object") return "";
  const candidate =
    projectDoc.requirementDoc ??
    projectDoc.requirement_docs ??
    projectDoc.requirementDocs ??
    projectDoc.requirementsDoc ??
    projectDoc.requirements_docs ??
    projectDoc.requirementsMarkdown ??
    projectDoc.requirements ??
    projectDoc.prd ??
    projectDoc.finalPRD ??
    "";
  if (typeof candidate === "string") return candidate.trim();
  if (candidate && typeof candidate === "object") return toMarkdownFromObject(candidate);
  return "";
}

function extractProjectTitle(projectDoc, fallbackProjectId) {
  if (!projectDoc || typeof projectDoc !== "object") return fallbackProjectId;
  return (
    String(
      projectDoc.title ||
        projectDoc.name ||
        projectDoc.projectName ||
        projectDoc.idea ||
        fallbackProjectId,
    ).trim() || fallbackProjectId
  );
}

async function findProjectDocByProjectId(projectId) {
  const normalized = normalizeProjectId(projectId);
  if (!normalized) return null;
  const or = [
    { projectId: normalized },
    { projectID: normalized },
    { id: normalized },
    { project_id: normalized },
  ];
  if (ObjectId.isValid(normalized)) {
    try {
      or.push({ _id: new ObjectId(normalized) });
    } catch {
      // ignore invalid object id parse edge-cases
    }
  } else {
    or.push({ _id: normalized });
  }
  return projects.findOne({ $or: or });
}

function sanitizeSchema(payload) {
  const tables = Array.isArray(payload?.tables)
    ? payload.tables
        .filter((table) => table && typeof table.name === "string")
        .map((table) => ({
          name: table.name.trim(),
          description: typeof table.description === "string" ? table.description.trim() : "",
          columns: Array.isArray(table.columns)
            ? table.columns
                .filter((col) => col && typeof col.name === "string")
                .map((col) => ({
                  name: col.name.trim(),
                  type: typeof col.type === "string" ? col.type.trim() : "text",
                  constraints:
                    typeof col.constraints === "string" ? col.constraints.trim() : "",
                  notes: typeof col.notes === "string" ? col.notes.trim() : "",
                }))
            : [],
        }))
    : [];

  const relationships = Array.isArray(payload?.relationships)
    ? payload.relationships
        .filter((rel) => rel && typeof rel.from === "string" && typeof rel.to === "string")
        .map((rel) => ({
          from: rel.from.trim(),
          to: rel.to.trim(),
          type:
            rel.type === "one-to-many" || rel.type === "many-to-many"
              ? rel.type
              : "many-to-one",
        }))
    : [];

  return { tables, relationships };
}

function mermaidFromSchema(schema) {
  const lines = ["erDiagram"];
  for (const table of schema.tables) {
    lines.push(`  ${table.name.toUpperCase()} {`);
    for (const col of table.columns) {
      const type = (col.type || "text").replace(/\s+/g, "_");
      lines.push(`    ${type} ${col.name}`);
    }
    lines.push("  }");
  }
  for (const rel of schema.relationships) {
    const [fromTable = "A"] = rel.from.split(".");
    const [toTable = "B"] = rel.to.split(".");
    const connector =
      rel.type === "many-to-many"
        ? "}o--o{"
        : rel.type === "one-to-many"
          ? "||--o{"
          : "}o--||";
    lines.push(`  ${fromTable.toUpperCase()} ${connector} ${toTable.toUpperCase()} : relates`);
  }
  return lines.join("\n");
}

function drawioMxfileFromSchema(schema) {
  const boxW = 640;
  const headerH = 38;
  const rowH = 20;
  const gapX = 360;
  const gapY = 300;
  const cols = Math.max(2, Math.min(2, Math.ceil(Math.sqrt(Math.max(1, schema.tables.length)))));

  const cells = [];
  let cellId = 2;
  const tableToMeta = new Map();

  const palette = ["#eef6ff", "#f5f3ff", "#ecfeff", "#f0fdf4", "#fff7ed"];

  schema.tables.forEach((table, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 40 + col * (boxW + gapX);
    const y = 40 + row * (180 + gapY);

    const rectId = String(++cellId);
    const rawTableName = String(table.name || "").replace(/\\n/g, "\n");
    const lines = [];
    const fallbackLines = [];
    let displayName = rawTableName || "table";

    if ((!Array.isArray(table.columns) || table.columns.length === 0) && rawTableName.includes("\n")) {
      const parts = rawTableName
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (parts.length > 0) {
        displayName = parts[0];
        fallbackLines.push(...parts.slice(1));
      }
    }
    if ((!Array.isArray(table.columns) || table.columns.length === 0) && fallbackLines.length === 0 && /:\s/.test(rawTableName)) {
      const cleaned = rawTableName.replace(/\s+/g, " ").trim();
      const pieces = cleaned.split(/\s+(?=[a-zA-Z_][a-zA-Z0-9_]*\s*:\s)/g);
      if (pieces.length > 1) {
        displayName = pieces[0].replace(/:$/, "").trim();
        fallbackLines.push(...pieces.slice(1));
      }
    }

    table.columns.forEach((c) => {
      const normalized = String(c.constraints || "")
        .replace(/\s+/g, " ")
        .trim();
      const tags = [];
      if (/\b(PK|PRIMARY KEY)\b/i.test(normalized)) tags.push("PK");
      if (/\b(FK|FOREIGN KEY)\b/i.test(normalized)) tags.push("FK");
      const firstLine = `${c.name}: ${c.type}${tags.length ? ` [${tags.join("/")}]` : ""}`;
      lines.push(...wrapLine(firstLine, 48));
      if (normalized) {
        lines.push(...wrapLine(`  ${normalized}`, 50));
      }
    });

    if (lines.length === 0 && fallbackLines.length > 0) {
      for (const fl of fallbackLines) {
        lines.push(...wrapLine(fl, 64));
      }
    }

    const htmlValue = [
      `<b>${escapeXml(displayName)}</b>`,
      `<span style="color:#64748b;">--------------------</span>`,
      ...lines.map((line) => escapeXml(line)),
    ].join("<br/>");
    const h = headerH + Math.max(5, lines.length + 2) * rowH + 18;
    cells.push(
      `<mxCell id="${rectId}" value="${encodeDrawioHtmlValue(
        htmlValue,
      )}" style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacing=10;spacingTop=16;spacingLeft=10;spacingRight=10;spacingBottom=10;fillColor=${palette[i % palette.length]};strokeColor=#334155;fontSize=11;fontFamily=Menlo;overflow=hidden;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${boxW}" height="${h}" as="geometry"/></mxCell>`,
    );
    tableToMeta.set(table.name, { rectId, x, y, w: boxW, h });
  });

  schema.relationships.forEach((rel) => {
    const [fromTable = ""] = rel.from.split(".");
    const [toTable = ""] = rel.to.split(".");
    const from = tableToMeta.get(fromTable);
    const to = tableToMeta.get(toTable);
    if (!from || !to) return;

    const edgeId = String(++cellId);
    const relLabel = `${rel.type}`;
    cells.push(
      `<mxCell id="${edgeId}" value="${encodeDrawioValue(
        relLabel,
      )}" style="edgeStyle=orthogonalEdgeStyle;orthogonalLoop=1;jettySize=auto;rounded=0;endArrow=block;endFill=1;strokeWidth=1.5;strokeColor=#475569;fontSize=9;labelBackgroundColor=#ffffff;html=0;whiteSpace=wrap;" edge="1" parent="1" source="${from.rectId}" target="${to.rectId}"><mxGeometry relative="1" as="geometry"/></mxCell>`,
    );
  });

  const rows = Math.max(1, Math.ceil(Math.max(1, schema.tables.length) / cols));
  const pageWidth = Math.max(1600, 80 + cols * boxW + Math.max(0, cols - 1) * gapX);
  const pageHeight = Math.max(1200, 160 + rows * 460);

  const graph = `<mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageWidth}" pageHeight="${pageHeight}" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    ${cells.join("\n    ")}
  </root>
</mxGraphModel>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${nowIso()}" agent="design-de-coder" version="24.7.17" type="device">
  <diagram id="schema" name="Schema" compressed="false"><![CDATA[${graph}]]></diagram>
</mxfile>`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function encodeDrawioValue(value) {
  return escapeXml(String(value).replace(/\\n/g, "\n")).replace(/\r?\n/g, "&#xa;");
}

function encodeDrawioHtmlValue(value) {
  return escapeXml(String(value || ""));
}

function wrapLine(input, maxLen) {
  const text = String(input || "");
  if (text.length <= maxLen) return [text];
  const words = text.split(" ");
  const out = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLen) {
      if (current) out.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) out.push(current);
  return out;
}

function fallbackMentorOutput(userMessage) {
  const lower = userMessage.toLowerCase();
  const isGpuTopic = lower.includes("gpu");
  return {
    reply: isGpuTopic
      ? "Great question. A GPU is a processor optimized for running many math operations in parallel. In product systems, GPUs are usually needed for high-throughput ML inference, embeddings at scale, or image/video generation. They are usually not needed for CRUD APIs, auth, payments, and standard business logic. Hint: estimate your expected inference requests per second and acceptable latency before deciding. What feature in your product truly depends on real-time ML?"
      : "Nice progress. Let us make this decision concrete with load targets. Define your expected DAU, peak concurrent users, and the p95 latency target for your most critical action. Hint: if unsure, estimate peak concurrency as 3x to 8x average active users during top hour. Which one can you quantify first?",
    hint: "Use one realistic number and one acceptable range, then validate with logs later.",
    terminology: inferTerminology(`${userMessage}`),
    pointsAwarded: lower.includes("p95") || lower.includes("concurrent") ? 10 : 0,
    isAnswerCorrect: lower.includes("p95") || lower.includes("concurrent"),
    nextQuestion:
      "What is your first measurable performance target for launch, and why that number?",
    recommendedAnswers: [
      "How many users do you expect online at the same minute during your busiest hour, and what assumption supports that estimate?",
      "What p95 latency would still feel fast to your user for the most important action in your product?",
      "Which feature in your roadmap truly requires ML inference before you decide on GPUs?",
    ],
  };
}

function inferTerminology(text) {
  const t = text.toLowerCase();
  const out = [];
  if (t.includes("dau")) {
    out.push({
      term: "DAU",
      explanation:
        "Daily Active Users: number of unique users active in one day. It helps estimate baseline daily load.",
    });
  }
  if (t.includes("mau")) {
    out.push({
      term: "MAU",
      explanation:
        "Monthly Active Users: unique users active in a month. Useful for growth and retention planning.",
    });
  }
  if (t.includes("concurrency") || t.includes("concurrent")) {
    out.push({
      term: "Peak concurrency",
      explanation:
        "How many users are active at the same time during peak periods. This directly drives server/database sizing.",
    });
  }
  if (t.includes("p95")) {
    out.push({
      term: "p95 latency",
      explanation:
        "The response time within which 95% of requests complete. It reflects real user speed better than averages.",
    });
  }
  if (t.includes("rps") || t.includes("qps")) {
    out.push({
      term: "RPS/QPS",
      explanation:
        "Requests (or queries) per second handled by your system. Useful for throughput and capacity planning.",
    });
  }
  return out;
}

async function getMentorStructuredOutput({
  userMessage,
  previousQuestion,
  requirementsMarkdown,
  architectureSummary,
  dbSchema,
}) {
  if (!openai) return fallbackMentorOutput(userMessage);

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are an encouraging engineering mentor. Ask probing open-ended questions (no MCQ). Explain terminology clearly in plain language BEFORE asking the next question. Always include: reply, hint, nextQuestion, terminology, recommendedAnswers. Evaluate the user's latest answer quality against the previous question and award points (0, 5, 10). 10 means technically solid and specific. 5 means partially correct. 0 means unclear or wrong. If the answer is far off, gently correct and guide with a concrete hint.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              userMessage,
              previousQuestion,
              requirementsMarkdown,
              architectureSummary,
              dbSchema,
            }),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "mentor_response",
        schema: {
          type: "object",
          additionalProperties: false,
          required: [
            "reply",
            "hint",
            "nextQuestion",
            "terminology",
            "isAnswerCorrect",
            "pointsAwarded",
            "recommendedAnswers",
          ],
          properties: {
            reply: { type: "string" },
            hint: { type: "string" },
            nextQuestion: { type: "string" },
            isAnswerCorrect: { type: "boolean" },
            pointsAwarded: { type: "number" },
            terminology: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["term", "explanation"],
                properties: {
                  term: { type: "string" },
                  explanation: { type: "string" },
                },
              },
            },
            recommendedAnswers: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
  });

  const parsed = JSON.parse(response.output_text || "{}");
  return {
    reply: parsed.reply || fallbackMentorOutput(userMessage).reply,
    hint: parsed.hint || "",
    terminology: Array.isArray(parsed.terminology)
      ? parsed.terminology
      : inferTerminology(`${userMessage} ${previousQuestion || ""}`),
    pointsAwarded:
      parsed.pointsAwarded === 10 || parsed.pointsAwarded === 5 ? parsed.pointsAwarded : 0,
    isAnswerCorrect: Boolean(parsed.isAnswerCorrect),
    nextQuestion: parsed.nextQuestion || "",
    recommendedAnswers:
      Array.isArray(parsed.recommendedAnswers) && parsed.recommendedAnswers.length > 0
        ? parsed.recommendedAnswers.slice(0, 3)
        : fallbackMentorOutput(userMessage).recommendedAnswers,
  };
}

async function generateSchemaFromRequirements(requirementsMarkdown, architectureSummary) {
  if (!openai) {
    const schema = {
      tables: [
        {
          name: "users",
          description: "Core user accounts",
          columns: [
            { name: "id", type: "uuid", constraints: "PK", notes: "Primary key" },
            { name: "email", type: "varchar(255)", constraints: "UNIQUE, NOT NULL", notes: "" },
            { name: "created_at", type: "timestamp", constraints: "NOT NULL", notes: "" },
          ],
        },
        {
          name: "activities",
          description: "Primary user flow actions",
          columns: [
            { name: "id", type: "uuid", constraints: "PK", notes: "" },
            { name: "user_id", type: "uuid", constraints: "FK -> users.id, NOT NULL", notes: "" },
            { name: "status", type: "varchar(32)", constraints: "NOT NULL", notes: "" },
          ],
        },
      ],
      relationships: [{ from: "activities.user_id", to: "users.id", type: "many-to-one" }],
    };
    return {
      schema,
      rationale: "Generated with fallback logic because OpenAI key was not available.",
    };
  }

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Generate a practical relational DB schema from product requirements and architecture summary. Include PK/FK, constraints, and concise notes. Return strict JSON.",
          },
        ],
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: JSON.stringify({ requirementsMarkdown, architectureSummary }) },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "db_schema_payload",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["tables", "relationships", "rationale"],
          properties: {
            tables: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "description", "columns"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  columns: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["name", "type", "constraints", "notes"],
                      properties: {
                        name: { type: "string" },
                        type: { type: "string" },
                        constraints: { type: "string" },
                        notes: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
            relationships: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["from", "to", "type"],
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  type: {
                    type: "string",
                    enum: ["many-to-one", "one-to-many", "many-to-many"],
                  },
                },
              },
            },
            rationale: { type: "string" },
          },
        },
      },
    },
  });

  const parsed = JSON.parse(response.output_text || "{}");
  return {
    schema: sanitizeSchema(parsed),
    rationale: parsed.rationale || "Schema generated from requirements.",
  };
}

async function applySchemaAgentInstruction({ instruction, schema, requirementsMarkdown }) {
  if (!openai) return schema;

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are a DB schema change agent. Apply the user's instruction to the provided schema. Return only the updated schema JSON with keys tables and relationships. Keep cardinalities valid and preserve existing constraints unless explicitly changed.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({ instruction, schema, requirementsMarkdown }),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "schema_update",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["tables", "relationships"],
          properties: {
            tables: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "description", "columns"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  columns: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["name", "type", "constraints", "notes"],
                      properties: {
                        name: { type: "string" },
                        type: { type: "string" },
                        constraints: { type: "string" },
                        notes: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
            relationships: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["from", "to", "type"],
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  type: {
                    type: "string",
                    enum: ["many-to-one", "one-to-many", "many-to-many"],
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return sanitizeSchema(JSON.parse(response.output_text || "{}"));
}

function shapeResponse(projectId, session) {
  return {
    projectId,
    requirementsMarkdown: session?.requirementsMarkdown || "",
    dbSchema: session?.dbSchema || { tables: [], relationships: [] },
    dbSchemaMermaid: session?.dbSchemaMermaid || "erDiagram",
    dbSchemaDrawioXml: session?.dbSchemaDrawioXml || "",
    dbSchemaRationale: session?.dbSchemaRationale || "",
    mentorScore: session?.mentorScore || 0,
    lastMentorQuestion: session?.lastMentorQuestion || "",
    updatedAt: session?.updatedAt || "",
  };
}

async function backfillSchemaArtifacts(projectId, session) {
  if (!session) return null;
  const schema = sanitizeSchema(session.dbSchema || { tables: [], relationships: [] });
  const mermaid = mermaidFromSchema(schema);
  const xml = drawioMxfileFromSchema(schema);

  const needsWrite =
    session.dbSchemaMermaid !== mermaid ||
    session.dbSchemaDrawioXml !== xml ||
    JSON.stringify(schema) !== JSON.stringify(session.dbSchema || {});

  if (needsWrite) {
    await sessions.updateOne(
      { projectId },
      {
        $set: {
          dbSchema: schema,
          dbSchemaMermaid: mermaid,
          dbSchemaDrawioXml: xml,
          updatedAt: nowIso(),
        },
      },
    );
    return sessions.findOne({ projectId });
  }
  return session;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, now: nowIso() });
});

app.post("/api/engineer/session", async (req, res) => {
  try {
    const { projectId, answers, architecture } = req.body || {};
    const normalizedProjectId = normalizeProjectId(projectId);
    if (!normalizedProjectId) return res.status(400).json({ error: "projectId is required" });

    const projectDoc = await findProjectDocByProjectId(normalizedProjectId);
    const requirementsFromDb = extractRequirementsFromProjectDoc(projectDoc);
    const requirementsMarkdown = requirementsFromDb || makeRequirementsMarkdown(answers || {});
    const architectureSummary = Array.isArray(architecture)
      ? architecture.map((c) => `${c.name} (${c.kind})`).join(", ")
      : "";

    await sessions.updateOne(
      { projectId: normalizedProjectId },
      {
        $set: {
          projectId: normalizedProjectId,
          requirementsMarkdown,
          architectureSummary,
          updatedAt: nowIso(),
          openAiApiKeySavedFromEnv: openAiApiKey || "",
        },
        $setOnInsert: {
          createdAt: nowIso(),
          mentorHistory: [],
          mentorScore: 0,
          lastMentorQuestion:
            "What scale are you designing for in month one: expected daily users, peak concurrent users, and p95 latency target?",
          dbSchema: { tables: [], relationships: [] },
          dbSchemaMermaid: mermaidFromSchema({ tables: [], relationships: [] }),
          dbSchemaDrawioXml: drawioMxfileFromSchema({ tables: [], relationships: [] }),
        },
      },
      { upsert: true },
    );

    const session = await sessions.findOne({ projectId: normalizedProjectId });
    const hydrated = await backfillSchemaArtifacts(normalizedProjectId, session);
    return res.json(shapeResponse(normalizedProjectId, hydrated));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to initialize session" });
  }
});

app.get("/api/engineer/schema/:projectId", async (req, res) => {
  try {
    const projectId = normalizeProjectId(req.params.projectId);
    const session = await sessions.findOne({ projectId });
    if (!session) return res.status(404).json({ error: "Session not found" });
    const hydrated = await backfillSchemaArtifacts(projectId, session);
    return res.json(shapeResponse(projectId, hydrated));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch schema" });
  }
});

app.post("/api/engineer/schema/generate", async (req, res) => {
  try {
    const projectId = normalizeProjectId(req.body?.projectId);
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    const session = await sessions.findOne({ projectId });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const generated = await generateSchemaFromRequirements(
      session.requirementsMarkdown || "",
      session.architectureSummary || "",
    );
    const schema = sanitizeSchema(generated.schema);
    const mermaid = mermaidFromSchema(schema);
    const xml = drawioMxfileFromSchema(schema);

    await sessions.updateOne(
      { projectId },
      {
        $set: {
          dbSchema: schema,
          dbSchemaMermaid: mermaid,
          dbSchemaDrawioXml: xml,
          dbSchemaRationale: generated.rationale || "",
          updatedAt: nowIso(),
        },
      },
    );

    const next = await sessions.findOne({ projectId });
    if (!next?.dbSchemaDrawioXml) {
      return res.status(500).json({ error: "Schema generated but XML was not persisted" });
    }
    return res.json(shapeResponse(projectId, next));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to generate schema" });
  }
});

app.put("/api/engineer/schema/:projectId", async (req, res) => {
  try {
    const projectId = normalizeProjectId(req.params.projectId);
    const nextSchema = sanitizeSchema(req.body?.dbSchema);
    const mermaid = mermaidFromSchema(nextSchema);
    const xml = drawioMxfileFromSchema(nextSchema);

    await sessions.updateOne(
      { projectId },
      {
        $set: {
          dbSchema: nextSchema,
          dbSchemaMermaid: mermaid,
          dbSchemaDrawioXml: xml,
          updatedAt: nowIso(),
        },
      },
      { upsert: true },
    );

    const next = await sessions.findOne({ projectId });
    if (!next?.dbSchemaDrawioXml) {
      return res.status(500).json({ error: "Schema saved but XML was not persisted" });
    }
    return res.json(shapeResponse(projectId, next));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save schema" });
  }
});

app.post("/api/engineer/agent/apply", async (req, res) => {
  try {
    const projectId = normalizeProjectId(req.body?.projectId);
    const instruction = String(req.body?.instruction || "").trim();
    if (!projectId || !instruction) {
      return res.status(400).json({ error: "projectId and instruction are required" });
    }

    const session = await sessions.findOne({ projectId });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const updatedSchema = await applySchemaAgentInstruction({
      instruction,
      schema: session.dbSchema || { tables: [], relationships: [] },
      requirementsMarkdown: session.requirementsMarkdown || "",
    });
    const mermaid = mermaidFromSchema(updatedSchema);
    const xml = drawioMxfileFromSchema(updatedSchema);

    await sessions.updateOne(
      { projectId },
      {
        $set: {
          dbSchema: updatedSchema,
          dbSchemaMermaid: mermaid,
          dbSchemaDrawioXml: xml,
          updatedAt: nowIso(),
        },
      },
    );

    const next = await sessions.findOne({ projectId });
    if (!next?.dbSchemaDrawioXml) {
      return res.status(500).json({ error: "Agent updated schema but XML was not persisted" });
    }
    return res.json(shapeResponse(projectId, next));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to apply agent schema change" });
  }
});

app.post("/api/engineer/mentor", async (req, res) => {
  try {
    const projectId = normalizeProjectId(req.body?.projectId);
    const message = String(req.body?.message || "").trim();
    if (!projectId || !message) {
      return res.status(400).json({ error: "projectId and message are required" });
    }

    const session = await sessions.findOne({ projectId });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const mentor = await getMentorStructuredOutput({
      userMessage: message,
      previousQuestion: session.lastMentorQuestion || "",
      requirementsMarkdown: session.requirementsMarkdown || "",
      architectureSummary: session.architectureSummary || "",
      dbSchema: session.dbSchema || { tables: [], relationships: [] },
    });

    const nextScore = Math.max(0, Number(session.mentorScore || 0) + Number(mentor.pointsAwarded || 0));
    const termBlock =
      mentor.terminology && mentor.terminology.length > 0
        ? `Terminology:\n${mentor.terminology
            .map((t) => `- ${t.term}: ${t.explanation}`)
            .join("\n")}\n\n`
        : "";
    const assistantText = `${termBlock}${mentor.reply}\n\nHint: ${mentor.hint}\n\nNext question: ${mentor.nextQuestion}`;

    await sessions.updateOne(
      { projectId },
      {
        $set: {
          mentorScore: nextScore,
          lastMentorQuestion: mentor.nextQuestion || session.lastMentorQuestion || "",
          updatedAt: nowIso(),
        },
        $push: {
          mentorHistory: {
            $each: [
              { role: "user", text: message, createdAt: nowIso() },
              { role: "assistant", text: assistantText, createdAt: nowIso() },
            ],
          },
        },
      },
    );

    return res.json({
      reply: assistantText,
      pointsAwarded: mentor.pointsAwarded || 0,
      totalPoints: nextScore,
      isAnswerCorrect: mentor.isAnswerCorrect || false,
      terminology: mentor.terminology || [],
      recommendedAnswers: mentor.recommendedAnswers || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to generate mentor response" });
  }
});

app.get("/api/engineer/projects", async (_req, res) => {
  try {
    const projectDocs = await projects
      .find(
        {},
        {
          projection: {
            _id: 1,
            projectId: 1,
            projectID: 1,
            id: 1,
            project_id: 1,
            title: 1,
            name: 1,
            projectName: 1,
            updatedAt: 1,
            requirementDoc: 1,
            requirementDocs: 1,
            requirementsDoc: 1,
          },
        },
      )
      .limit(500)
      .toArray();

    const projectsList = projectDocs
      .map((d) => {
        const pid = normalizeProjectId(
          d.projectId || d.projectID || d.id || d.project_id || d._id,
        );
        if (!pid) return null;
        return {
          projectId: pid,
          title: String(d.title || d.name || d.projectName || pid).trim() || pid,
          source: "projects",
          updatedAt: d.updatedAt || "",
          hasRequirements: Boolean(extractRequirementsFromProjectDoc(d)),
        };
      })
      .filter(Boolean)
      .sort((a, b) =>
      String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
    );
    return res.json({ projects: projectsList, db: "straightup", collection: "projects" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to list projects" });
  }
});

async function start() {
  await mongo.connect();
  db = mongo.db("straightup");
  sessions = db.collection("engineer_sessions");
  projects = db.collection("projects");
  await sessions.createIndex({ projectId: 1 }, { unique: true });
  app.listen(port, () => {
    console.log(
      `Engineer API listening on http://localhost:${port} (db=straightup, collections=projects,engineer_sessions)`,
    );
  });
}

start().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
