import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
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
  const boxW = 560;
  const headerH = 38;
  const rowH = 20;
  const gapX = 260;
  const gapY = 240;
  const cols = Math.max(2, Math.min(3, Math.ceil(Math.sqrt(Math.max(1, schema.tables.length)))));

  const cells = [];
  let cellId = 2;
  const tableToMeta = new Map();

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
      lines.push(...wrapLine(firstLine, 56));
      if (normalized) {
        lines.push(...wrapLine(`  ${normalized}`, 58));
      }
    });

    if (lines.length === 0 && fallbackLines.length > 0) {
      for (const fl of fallbackLines) {
        lines.push(...wrapLine(fl, 64));
      }
    }

    const text = [displayName, "--------------------", ...lines].join("\n");
    const h = headerH + Math.max(5, lines.length + 2) * rowH + 18;
    cells.push(
      `<mxCell id="${rectId}" value="${encodeDrawioValue(
        text,
      )}" style="rounded=1;whiteSpace=wrap;html=0;align=left;verticalAlign=top;spacing=10;fillColor=#f8fafc;strokeColor=#334155;fontSize=11;fontFamily=Menlo;overflow=hidden;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${boxW}" height="${h}" as="geometry"/></mxCell>`,
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
    const relLabel = `${rel.type}\n${rel.from} → ${rel.to}`;
    cells.push(
      `<mxCell id="${edgeId}" value="${encodeDrawioValue(
        relLabel,
      )}" style="endArrow=block;endFill=1;strokeWidth=1.5;strokeColor=#475569;fontSize=10;labelBackgroundColor=#ffffff;rounded=1;html=0;whiteSpace=wrap;" edge="1" parent="1" source="${from.rectId}" target="${to.rectId}"><mxGeometry relative="1" as="geometry"/></mxCell>`,
    );
  });

  const rows = Math.max(1, Math.ceil(Math.max(1, schema.tables.length) / cols));
  const pageWidth = Math.max(1600, 80 + cols * boxW + Math.max(0, cols - 1) * gapX);
  const pageHeight = Math.max(1200, 120 + rows * 360);

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
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    const requirementsMarkdown = makeRequirementsMarkdown(answers || {});
    const architectureSummary = Array.isArray(architecture)
      ? architecture.map((c) => `${c.name} (${c.kind})`).join(", ")
      : "";

    await sessions.updateOne(
      { projectId },
      {
        $set: {
          projectId,
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

    const session = await sessions.findOne({ projectId });
    const hydrated = await backfillSchemaArtifacts(projectId, session);
    return res.json(shapeResponse(projectId, hydrated));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to initialize session" });
  }
});

app.get("/api/engineer/schema/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
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
    const { projectId } = req.body || {};
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
    const { projectId } = req.params;
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
    const { projectId, instruction } = req.body || {};
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
    const { projectId, message } = req.body || {};
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

// ==================== BIAS DETECTOR API ====================

let projectsCollection;
let schemasCollection;
let requirementsCollection;
let biasConsiderationsCollection;

const BIAS_METRICS = [
  { name: "Accessibility Inclusion", weight: 0.20 },
  { name: "Language & Literacy Equity", weight: 0.15 },
  { name: "Economic Accessibility", weight: 0.15 },
  { name: "Cultural Sensitivity", weight: 0.15 },
  { name: "Demographic Neutrality", weight: 0.15 },
  { name: "Technical Barrier Level", weight: 0.10 },
  { name: "Geographic Fairness", weight: 0.10 },
];

function buildPersonaGeneratorPrompt(requirements, schema) {
  const schemaStr = schema?.schema_json?.collections
    ? schema.schema_json.collections.map(c => `- ${c.name}: ${c.description || 'No description'}`).join('\n')
    : 'No schema defined';

  return `You are an expert in inclusive design and bias detection for software systems.

## Task
Generate 5-7 diverse test personas who might interact with the following system. These personas should represent a wide range of backgrounds, abilities, and circumstances to help identify potential biases in the system design.

## System Requirements
${requirements?.requirements_markdown || 'No requirements defined'}

## Database Schema
${schemaStr}

## Persona Generation Guidelines
Generate personas covering: Language & Communication, Physical & Cognitive Abilities, Economic Circumstances, Cultural Background, Technical Proficiency, Life Circumstances, Geographic Factors.

Always include a "default user" as baseline, plus 4-6 personas representing potentially underserved groups.

## Output Format
Return valid JSON:
{
  "personas": [
    {
      "id": "persona-1",
      "name": "Short descriptive name",
      "description": "2-3 sentence background",
      "characteristics": ["trait1", "trait2"],
      "potentialChallenges": ["challenge1", "challenge2"]
    }
  ]
}`;
}

function buildVerifierPrompt(persona, requirements, schema) {
  const schemaStr = schema?.schema_json?.collections
    ? schema.schema_json.collections.map(c => `- ${c.name}: ${c.description || ''}`).join('\n')
    : 'No schema';

  return `Simulate how this persona would experience the software system.

## Persona
**Name:** ${persona.name}
**Background:** ${persona.description}
**Characteristics:** ${persona.characteristics.join(", ")}
**Expected Challenges:** ${persona.potentialChallenges.join(", ")}

## System Requirements
${requirements?.requirements_markdown || 'No requirements'}

## Database Schema
${schemaStr}

## Bias Categories
language, accessibility, economic, cultural, technical, temporal, geographic, demographic, experience, trust

## Output Format
Return valid JSON:
{
  "personaId": "${persona.id}",
  "personaName": "${persona.name}",
  "outcome": "success|partial|rejected|filtered|abandoned",
  "outcomeLabel": "Human readable outcome",
  "problem": "Main issue or null",
  "problemCategory": "bias category or null",
  "journeyNarrative": "2-3 sentences",
  "frictionPoints": ["point1", "point2"]
}`;
}

function buildBiasCalculatorPrompt(_personas, journeyResults, requirements) {
  const resultsTable = journeyResults
    .map(r => `| ${r.personaName} | ${r.outcomeLabel} | ${r.problem || "None"} | ${r.problemCategory || "N/A"} |`)
    .join("\n");

  return `Calculate a comprehensive bias score for this system.

## System Requirements
${requirements?.requirements_markdown || 'No requirements'}

## Persona Simulation Results
| Persona | Outcome | Problem | Category |
|---------|---------|---------|----------|
${resultsTable}

## Metrics to Calculate (0-100 each, 100 = no bias)
${BIAS_METRICS.map(m => `- ${m.name} (${m.weight * 100}% weight)`).join('\n')}

## Output Format
Return valid JSON:
{
  "overallScore": <0-100>,
  "scoreLabel": "Excellent|Good|Moderate Concern|Significant Issues|Critical",
  "metrics": [
    { "name": "Metric Name", "score": <0-100>, "weight": <decimal>, "description": "explanation", "findings": ["finding1"] }
  ],
  "explanation": "2-3 paragraphs explaining the score",
  "methodology": "Brief methodology description",
  "recommendations": [
    { "id": "rec-1", "priority": "critical|high|medium|low", "title": "Title", "description": "Details", "affectedPersonas": ["names"], "implementationHint": "Technical hint" }
  ]
}`;
}

async function callOpenAI(systemPrompt, userPrompt) {
  if (!openai) throw new Error("OpenAI API key not configured");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: "json_object" }
  });

  return response.choices[0]?.message?.content || "{}";
}

// Get project data for bias detection
app.get("/api/bias/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    // Fetch from all relevant collections
    const [requirements, schema, existingBias] = await Promise.all([
      requirementsCollection.findOne({ project_id: projectId }, { sort: { version: -1 } }),
      schemasCollection.findOne({ project_id: projectId }, { sort: { version: -1 } }),
      biasConsiderationsCollection.findOne({ project_id: projectId }, { sort: { version: -1 } })
    ]);

    if (!requirements && !schema) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json({
      projectId,
      requirements,
      schema,
      existingBias
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({ error: "Failed to fetch project data" });
  }
});

// Generate bias analysis
app.post("/api/bias/generate", async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    // Fetch project data
    const [requirements, schema] = await Promise.all([
      requirementsCollection.findOne({ project_id: projectId }, { sort: { version: -1 } }),
      schemasCollection.findOne({ project_id: projectId }, { sort: { version: -1 } })
    ]);

    if (!requirements) {
      return res.status(404).json({ error: "Requirements not found for project" });
    }

    // Step 1: Generate personas
    const personaPrompt = buildPersonaGeneratorPrompt(requirements, schema);
    const personaResponse = await callOpenAI(
      "You are an inclusive design expert. Generate diverse test personas. Respond with valid JSON only.",
      personaPrompt
    );
    const { personas } = JSON.parse(personaResponse);

    // Step 2: Simulate journeys for each persona
    const journeyResults = [];
    for (const persona of personas) {
      const verifierPrompt = buildVerifierPrompt(persona, requirements, schema);
      const verifierResponse = await callOpenAI(
        "You are a UX researcher simulating user journeys. Respond with valid JSON only.",
        verifierPrompt
      );
      journeyResults.push(JSON.parse(verifierResponse));
    }

    // Step 3: Calculate bias score
    const calculatorPrompt = buildBiasCalculatorPrompt(personas, journeyResults, requirements);
    const analysisResponse = await callOpenAI(
      "You are a fairness analyst calculating bias scores. Respond with valid JSON only.",
      calculatorPrompt
    );
    const analysis = JSON.parse(analysisResponse);

    // Build the unbias_json structure matching existing schema
    const unbiasJson = {
      bias_types: [...new Set(journeyResults.filter(r => r.problemCategory).map(r => r.problemCategory + "_bias"))],
      detection_points: journeyResults
        .filter(r => r.problem)
        .map(r => ({
          point: r.journeyNarrative,
          risk: r.problem,
          impacted_personas: [r.personaName.toLowerCase().replace(/\s+/g, '_')]
        })),
      mitigation_strategies: analysis.recommendations.map(rec => ({
        strategy: rec.title,
        owner: "Development Team",
        implementation: rec.description
      })),
      validation_checks: analysis.metrics.map(m => ({
        check: m.name,
        method: m.description,
        pass_criteria: `Score >= 70 (current: ${m.score})`
      })),
      personas_analysis: personas.map(p => {
        const journey = journeyResults.find(j => j.personaId === p.id);
        return {
          persona: p.name.toLowerCase().replace(/\s+/g, '_'),
          impact: journey?.problem || "No significant issues identified",
          risk_level: journey?.outcome === 'success' ? 'low' : journey?.outcome === 'partial' ? 'medium' : 'high',
          mitigation: journey?.frictionPoints?.join('; ') || "No specific mitigation needed"
        };
      }),
      metrics: analysis.metrics.map(m => ({
        metric: m.name,
        definition: m.description,
        target: ">= 70",
        current_score: m.score,
        bias_scoring_strategy: m.findings?.join('; ') || ''
      })),
      overall_score: analysis.overallScore,
      score_label: analysis.scoreLabel,
      explanation: analysis.explanation,
      methodology: analysis.methodology,
      recommendations: analysis.recommendations,
      personas: personas,
      journey_results: journeyResults
    };

    // Get existing version
    const existing = await biasConsiderationsCollection.findOne(
      { project_id: projectId },
      { sort: { version: -1 } }
    );
    const nextVersion = (existing?.version || 0) + 1;

    // Save to database
    const biasDoc = {
      project_id: projectId,
      unbias_json: unbiasJson,
      version: nextVersion,
      updated_at: nowIso()
    };

    await biasConsiderationsCollection.insertOne(biasDoc);

    return res.json({
      success: true,
      projectId,
      version: nextVersion,
      result: unbiasJson
    });
  } catch (error) {
    console.error("Error generating bias analysis:", error);
    return res.status(500).json({ error: error.message || "Failed to generate bias analysis" });
  }
});

// Get bias analysis results
app.get("/api/bias/result/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await biasConsiderationsCollection.findOne(
      { project_id: projectId },
      { sort: { version: -1 } }
    );

    if (!result) {
      return res.status(404).json({ error: "No bias analysis found for this project" });
    }

    return res.json({
      projectId,
      version: result.version,
      updatedAt: result.updated_at,
      result: result.unbias_json
    });
  } catch (error) {
    console.error("Error fetching bias result:", error);
    return res.status(500).json({ error: "Failed to fetch bias analysis" });
  }
});

// List all projects with bias analysis
app.get("/api/bias/projects", async (_req, res) => {
  try {
    const projects = await biasConsiderationsCollection.aggregate([
      { $sort: { version: -1 } },
      { $group: { _id: "$project_id", latestVersion: { $first: "$version" }, updatedAt: { $first: "$updated_at" } } }
    ]).toArray();

    return res.json({ projects });
  } catch (error) {
    console.error("Error listing projects:", error);
    return res.status(500).json({ error: "Failed to list projects" });
  }
});

async function start() {
  await mongo.connect();
  db = mongo.db(process.env.MONGODB_DB || "straightup");
  sessions = db.collection("engineer_sessions");
  projectsCollection = db.collection("projects");
  schemasCollection = db.collection("schemas");
  requirementsCollection = db.collection("requirements");
  biasConsiderationsCollection = db.collection("bias_considerations");

  await sessions.createIndex({ projectId: 1 }, { unique: true });
  app.listen(port, () => {
    console.log(`Engineer API listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});