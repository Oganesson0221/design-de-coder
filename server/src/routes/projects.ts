import { Router, Request, Response } from "express";
import openai from "../lib/openai.js";
import { Project } from "../models/Project.js";

const router = Router();

// POST /api/projects
router.post("/", async (req: Request, res: Response) => {
  const { idea, audience, flow } = req.body as { idea: string; audience: string; flow: string };

  if (!idea || !audience || !flow) {
    res.status(400).json({ error: "idea, audience, and flow are required" });
    return;
  }

  try {
    // 1. Generate requirements doc
    const docCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior software architect writing a concise requirements document.
Write in clear plain prose — no bullet points, no markdown headers. Just 4 focused paragraphs:
1. Purpose & Vision
2. Target Users & Context
3. Core User Flows
4. Open Questions & Risks
Keep to ~250 words. Be direct and specific.`,
        },
        { role: "user", content: `Idea: ${idea}\nAudience: ${audience}\nUser flow: ${flow}` },
      ],
      max_tokens: 600,
      temperature: 0.6,
    });

    const requirementsDoc = docCompletion.choices[0]?.message?.content ?? "";

    // 2. Generate real architecture with specific tech choices
    const archCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior software architect. Given a product idea, generate a realistic system architecture with SPECIFIC technology choices (not just "a database" — say "PostgreSQL").

Return ONLY valid JSON with this exact structure:
{
  "components": [
    {
      "id": "string (kebab-case, unique)",
      "name": "string (role name, e.g. 'Web Frontend')",
      "kind": "frontend|backend|api|database|cache|queue|ai|auth|storage|cdn",
      "tech": "string (specific tech, e.g. 'Next.js')",
      "logoKey": "string (from this list: react, nextjs, vue, nuxt, svelte, angular, flutter, reactnative, nodejs, express, fastify, django, fastapi, rails, springboot, go, rust, nestjs, nginx, kong, graphql, trpc, apigw, postgresql, mysql, mongodb, sqlite, supabase, planetscale, firebase, dynamodb, cockroachdb, redis, memcached, kafka, rabbitmq, sqs, bullmq, auth0, clerk, supabaseauth, nextauth, cognito, s3, cloudinary, r2, cloudflare, vercel, fastly, openai, anthropic, huggingface, replicate, langchain, pinecone, docker, kubernetes, awslambda)",
      "description": "string (2 sentences, what this specific tech does for this product)",
      "why": "string (1–2 sentences, why THIS tech for THIS specific idea)",
      "pros": ["string", "string", "string"],
      "cons": ["string", "string"],
      "alternatives": [
        { "name": "string", "logoKey": "string", "reason": "string (trade-off vs chosen tech)" }
      ],
      "x": number (canvas x position, spread across 0–1100),
      "y": number (canvas y position, spread across 0–500)
    }
  ],
  "connections": [
    { "from": "component-id", "to": "component-id", "label": "optional short label" }
  ]
}

Rules:
- Generate 6–9 components appropriate for the product scale (start-up / early stage)
- Choose techs that fit the use case — consumer app → Next.js + PostgreSQL; real-time → add Redis; media uploads → add S3; etc.
- DO NOT add a component just to pad the list. Every component must be justified by the idea.
- Positions: Frontend left (x~80–200), API/gateway center-left (x~320–420), backend center-right (x~540–700), data/services right (x~820–1100). Use y to separate rows.
- Always include at least: one frontend, one backend/API, one database.
- Keep connections minimal and meaningful.`,
        },
        {
          role: "user",
          content: `Product idea: ${idea}\nTarget audience: ${audience}\nCore user flow: ${flow}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
      temperature: 0.4,
    });

    let arch: { components: object[]; connections: object[] } = { components: [], connections: [] };
    try {
      const raw = archCompletion.choices[0]?.message?.content ?? "{}";
      arch = JSON.parse(raw) as typeof arch;
    } catch {
      arch = { components: [], connections: [] };
    }

    const project = await Project.create({
      idea,
      audience,
      flow,
      requirementsDoc,
      components: arch.components,
    });

    res.status(201).json({
      projectId: project._id.toString(),
      requirementsDoc,
      components: arch.components,
      connections: arch.connections,
    });
  } catch (err) {
    console.error("POST /api/projects error:", err);
    res.status(500).json({ error: "Failed to generate architecture" });
  }
});

// GET /api/projects/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) { res.status(404).json({ error: "Not found" }); return; }
    res.json(project);
  } catch {
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// POST /api/projects/:id/regenerate — regenerate architecture from updated spec + optional constraints
router.post("/:id/regenerate", async (req: Request, res: Response) => {
  const { requirementsDoc, constraints } = req.body as {
    requirementsDoc?: string;
    constraints?: {
      expectedUsers?: string;
      gpuRequired?: boolean;
      memoryBudget?: string;
      privacy?: string;
      realtime?: boolean;
      offline?: boolean;
      costSensitive?: boolean;
    };
  };

  try {
    const project = await Project.findById(req.params.id);
    if (!project) { res.status(404).json({ error: "Not found" }); return; }

    // Use the updated requirementsDoc if provided, fall back to stored one
    const specToUse = (requirementsDoc ?? "").trim() || project.requirementsDoc || "";

    // Persist updated spec back to DB so future calls stay in sync
    if (requirementsDoc && requirementsDoc.trim()) {
      project.requirementsDoc = requirementsDoc.trim();
      await project.save();
    }

    const constraintText = constraints
      ? `\nTechnical constraints to honour:
- Expected users: ${constraints.expectedUsers ?? "unknown"}
- GPU/ML inference needed: ${constraints.gpuRequired ? "yes" : "no"}
- Memory budget: ${constraints.memoryBudget ?? "medium"}
- Privacy compliance: ${constraints.privacy ?? "standard"}
- Real-time features required: ${constraints.realtime ? "yes" : "no"}
- Offline support needed: ${constraints.offline ? "yes" : "no"}
- Cost sensitive: ${constraints.costSensitive ? "yes" : "no"}`
      : "";

    const archCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior software architect generating a system architecture diagram from a product requirements document.

IMPORTANT RULES:
1. Read the requirements doc carefully — every explicit technology, API, or integration mentioned MUST appear as a component.
   For example, if "Google Maps API" is mentioned, add an "external" or "api" component for it and connect it appropriately.
2. Generate 6–10 components that cover the full product — never cut corners for brevity.
3. Choose SPECIFIC technologies (not "a database" — say "PostgreSQL").
4. Layout positions: Frontend left (x 80–200), API/Gateway center-left (x 300–450), Backend services center (x 500–700), Data/External right (x 750–1100). Use y 60–160 for primary row, y 280–400 for secondary row.
5. Keep connections meaningful and complete — every component should connect to at least one other.

Return ONLY valid JSON:
{
  "components": [
    {
      "id": "kebab-case-id",
      "name": "Role name (e.g. 'Maps Integration')",
      "kind": "frontend|backend|api|database|cache|queue|ai|auth|storage|cdn",
      "tech": "Specific tech (e.g. 'Google Maps Platform')",
      "logoKey": "closest match from: react, nextjs, vue, nuxt, svelte, angular, flutter, reactnative, nodejs, express, fastify, django, fastapi, rails, springboot, go, rust, nestjs, nginx, kong, graphql, trpc, apigw, postgresql, mysql, mongodb, sqlite, supabase, planetscale, firebase, dynamodb, cockroachdb, redis, memcached, kafka, rabbitmq, sqs, bullmq, auth0, clerk, supabaseauth, nextauth, cognito, s3, cloudinary, r2, cloudflare, vercel, fastly, openai, anthropic, huggingface, replicate, langchain, pinecone, docker, kubernetes, awslambda",
      "description": "2 sentences — what this component does for THIS specific product",
      "why": "1–2 sentences — why this tech for this specific idea",
      "pros": ["...", "...", "..."],
      "cons": ["...", "..."],
      "alternatives": [{ "name": "...", "logoKey": "...", "reason": "trade-off vs chosen tech" }],
      "x": number,
      "y": number
    }
  ],
  "connections": [{ "from": "id", "to": "id", "label": "short label (optional)" }]
}`,
        },
        {
          role: "user",
          content: `Product idea: ${project.idea}
Target audience: ${project.audience}
Core user flow: ${project.flow}

Requirements document (use this as the primary source of truth — every feature and integration here must be reflected in the architecture):
${specToUse || "(no requirements doc — use the idea, audience, and flow above)"}${constraintText}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
      temperature: 0.3,
    });

    let arch: { components: object[]; connections: object[] } = { components: [], connections: [] };
    try {
      const raw = archCompletion.choices[0]?.message?.content ?? "{}";
      arch = JSON.parse(raw) as typeof arch;
    } catch {
      arch = { components: [], connections: [] };
    }

    await Project.findByIdAndUpdate(req.params.id, { components: arch.components });

    res.json({ components: arch.components, connections: arch.connections });
  } catch (err) {
    console.error("POST /api/projects/:id/regenerate error:", err);
    res.status(500).json({ error: "Failed to regenerate architecture" });
  }
});

// POST /api/projects/:id/suggestions — get tech swap suggestions based on constraints
router.post("/:id/suggestions", async (req: Request, res: Response) => {
  const { constraints, components } = req.body as {
    constraints?: Record<string, unknown>;
    components?: Array<{ id: string; name: string; tech: string; kind: string }>;
  };

  try {
    const project = await Project.findById(req.params.id);
    if (!project) { res.status(404).json({ error: "Not found" }); return; }

    const componentList = (components ?? [])
      .map((c) => `- ${c.name} (${c.kind}): currently using ${c.tech}`)
      .join("\n");

    const constraintText = constraints
      ? Object.entries(constraints)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "none";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a software architect advisor. Given a list of architecture components and user constraints, suggest specific tech changes where the constraints demand it.
Only suggest changes where there is a clear reason — do not suggest changes just for variety.

Return JSON: {
  "suggestions": [
    {
      "componentId": "string",
      "componentName": "string",
      "currentTech": "string",
      "suggestedTech": "string",
      "suggestedLogoKey": "string (from known logoKeys)",
      "reason": "1-2 sentences why this change is warranted by the constraints"
    }
  ]
}
If no changes are warranted, return { "suggestions": [] }.`,
        },
        {
          role: "user",
          content: `Product: ${project.idea}\nConstraints: ${constraintText}\n\nCurrent components:\n${componentList}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.4,
    });

    let result: { suggestions: unknown[] } = { suggestions: [] };
    try {
      result = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as typeof result;
    } catch {
      result = { suggestions: [] };
    }

    res.json(result);
  } catch (err) {
    console.error("POST /api/projects/:id/suggestions error:", err);
    res.status(500).json({ error: "Failed to get suggestions" });
  }
});

export default router;
