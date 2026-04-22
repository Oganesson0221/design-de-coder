import { Router, Request, Response } from "express";
import openai from "../lib/openai.js";
import { Project } from "../models/Project.js";

const router = Router();

interface FlowNode {
  id: string;
  type?: string;
  data: { label: string; nodeType?: string };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

// POST /api/pm/questions — generate PM thinking questions for the user's idea
router.post("/questions", async (req: Request, res: Response) => {
  const { projectId } = req.body as { projectId: string };
  if (!projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a product management coach creating 3 Socratic questions to help a new PM think deeply about their product.
Questions should be specific to the idea, not generic.
Each question should push the person to think about prioritisation, user value, or trade-offs.
Return JSON only — an array of 3 objects: [{ "question": "...", "hint": "...", "followUp": "..." }]
- question: the main question
- hint: a nudge that helps without giving the answer
- followUp: a deeper question to ask after they answer`,
        },
        {
          role: "user",
          content: `Idea: ${project.idea}\nAudience: ${project.audience}\nFlow: ${project.flow}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.75,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { questions?: unknown[] } = {};
    try {
      parsed = JSON.parse(raw) as { questions?: unknown[] };
    } catch {
      parsed = { questions: [] };
    }

    const questions = Array.isArray(parsed.questions)
      ? parsed.questions
      : Array.isArray(parsed)
      ? parsed
      : [];

    res.json({ questions });
  } catch (err) {
    console.error("POST /api/pm/questions error:", err);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// POST /api/pm/evaluate-answer — evaluate a user's short text answer to a PM question
router.post("/evaluate-answer", async (req: Request, res: Response) => {
  const { projectId, question, answer } = req.body as {
    projectId: string;
    question: string;
    answer: string;
  };

  if (!projectId || !question || !answer) {
    res.status(400).json({ error: "projectId, question, and answer are required" });
    return;
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a product management coach evaluating a student's answer.
Be encouraging but honest. Score the quality of thinking, not the "right" answer.
Return JSON: { "score": 0-10, "feedback": "2-3 sentence mentor response", "pointsAwarded": 5-15, "strengthsFound": ["..."], "improvement": "one thing they could add" }
score 8-10: insightful, user-centric, trade-off aware → pointsAwarded 15
score 5-7: decent thinking, partially there → pointsAwarded 10
score 1-4: surface-level or off-track → pointsAwarded 5`,
        },
        {
          role: "user",
          content: `Context: building "${project.idea}" for "${project.audience}"
Question: ${question}
Student answer: ${answer}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
      temperature: 0.5,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: Record<string, unknown> = {};
    try {
      result = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      result = { score: 5, feedback: "Good effort!", pointsAwarded: 5 };
    }

    res.json(result);
  } catch (err) {
    console.error("POST /api/pm/evaluate-answer error:", err);
    res.status(500).json({ error: "Failed to evaluate answer" });
  }
});

// POST /api/pm/diagram-exercise — generate a tailored diagram exercise for a given diagram type
router.post("/diagram-exercise", async (req: Request, res: Response) => {
  const { projectId, diagramType } = req.body as { projectId: string; diagramType: string };

  if (!projectId || !diagramType) {
    res.status(400).json({ error: "projectId and diagramType are required" });
    return;
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const typeDescriptions: Record<string, string> = {
      "event-flow":  "an event flow diagram that maps user actions and system responses in sequence",
      "dialog-map":  "a dialog map showing all screen states and the transitions/triggers between them",
      "data-flow":   "a data flow diagram (DFD) illustrating how data moves through the system, including inputs, processes, stores, and outputs",
      "sequence":    "a UML sequence diagram showing time-ordered interactions between actors (user, frontend, backend, database, external services)",
      "er-diagram":  "an entity-relationship (ER) diagram modelling the key data entities and their relationships",
    };

    const typeDesc = typeDescriptions[diagramType] ?? `a ${diagramType} diagram`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a PM/design coach creating a specific diagram exercise for a student.
The exercise must be tailored to the student's actual product idea — reference it directly.
Return JSON only:
{
  "task": "2-3 sentence specific task description referencing the actual product. Tell them exactly what scenario to diagram.",
  "hint": "1-2 sentence nudge that helps without giving the answer away. Mention 2-3 elements they should consider including.",
  "evaluationCriteria": ["criterion 1 (specific to diagram type)", "criterion 2", "criterion 3", "criterion 4"]
}`,
        },
        {
          role: "user",
          content: `Product idea: ${project.idea}
Audience: ${project.audience}
Core user flow: ${project.flow}

The student needs to draw ${typeDesc}. Generate a specific exercise for them.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.65,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: Record<string, unknown> = {};
    try {
      result = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      result = { task: "Draw the diagram for your product.", hint: "Start with the user action.", evaluationCriteria: [] };
    }

    res.json({ ...result, diagramType });
  } catch (err) {
    console.error("POST /api/pm/diagram-exercise error:", err);
    res.status(500).json({ error: "Failed to generate diagram exercise" });
  }
});

// POST /api/pm/evaluate-diagram — evaluate a draw.io diagram (via XML) or React Flow graph
router.post("/evaluate-diagram", async (req: Request, res: Response) => {
  const { projectId, nodes, edges, stage, diagramType, task, diagramXml } = req.body as {
    projectId: string;
    nodes?: FlowNode[];
    edges?: FlowEdge[];
    stage?: string;
    diagramType?: string;
    task?: string;
    diagramXml?: string;
  };

  if (!projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Build diagram description — prefer XML parsing, fall back to node/edge list
    let diagramText = "";

    if (diagramXml && diagramXml.trim()) {
      // Extract node labels from draw.io XML: mxCell elements with value and vertex="1"
      const vertexMatches = [...diagramXml.matchAll(/value="([^"<][^"]*)"[^>]*vertex="1"/g)];
      const edgeMatches   = [...diagramXml.matchAll(/value="([^"]*)"[^>]*edge="1"/g)];

      const nodeLabels = vertexMatches
        .map((m) => m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#xa;/gi, " ").trim())
        .filter((l) => l.length > 0 && l !== " ");

      const edgeLabels = edgeMatches
        .map((m) => m[1].trim())
        .filter((l) => l.length > 0);

      diagramText = `NODES (${nodeLabels.length}):\n${nodeLabels.map((l) => `- "${l}"`).join("\n") || "(none)"}`;
      if (edgeLabels.length > 0) {
        diagramText += `\n\nEDGE LABELS:\n${edgeLabels.map((l) => `- "${l}"`).join("\n")}`;
      }
      diagramText += `\n\nTotal connections: approximately ${edgeMatches.length}`;
    } else if (nodes && edges) {
      const nodeList = nodes
        .map((n) => `- [${n.data.nodeType ?? n.type ?? "node"}] "${n.data.label}" (id: ${n.id})`)
        .join("\n");
      const edgeList = edges
        .map((e) => {
          const src = nodes.find((n) => n.id === e.source)?.data.label ?? e.source;
          const tgt = nodes.find((n) => n.id === e.target)?.data.label ?? e.target;
          return `- "${src}" → "${tgt}"${e.label ? ` [${e.label}]` : ""}`;
        })
        .join("\n");
      diagramText = `NODES:\n${nodeList || "(none)"}\n\nEDGES:\n${edgeList || "(none)"}`;
    } else {
      diagramText = "(no diagram data received)";
    }

    const typeLabel = diagramType ?? "event flow";
    const taskContext = task ? `\nThe specific exercise task was: "${task}"` : "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior PM and systems design coach evaluating a student's ${typeLabel} diagram.
Be like a great teacher: specific, encouraging, and honest. Reference the actual product and diagram content in your feedback.

Evaluate whether the diagram:
1. Covers the core scenario end-to-end (not stopping halfway)
2. Uses appropriate node types for a ${typeLabel} (e.g. for event flow: user actions AND system responses; for ER: entities with cardinality)
3. Is specific to the product (not generic boxes like "User" → "System")
4. Has sufficient detail and connections — not just 2-3 isolated nodes
5. Flows logically from entry to outcome

Return JSON:
{
  "passed": boolean,
  "score": 0-100,
  "feedback": "2-3 sentence overall assessment — address the student directly, reference their specific diagram",
  "whatYouDidWell": ["specific strength with example from their diagram", "another strength"],
  "whatCouldBeBetter": ["specific area to improve with example", "another area"],
  "specificImprovements": ["concrete actionable suggestion e.g. 'Add an error state after the payment node'", "another suggestion"],
  "hints": ["hint 1 to guide next iteration", "hint 2", "hint 3"],
  "pointsAwarded": 0-30
}
passed = score >= 65
pointsAwarded: score>=85→30, >=65→20, >=40→10, otherwise→5
Be specific — reference actual node names from the diagram if possible.`,
        },
        {
          role: "user",
          content: `Product: "${project.idea}"
Audience: "${project.audience}"
Expected flow: "${project.flow}"
Diagram type: ${typeLabel}${taskContext}

Student's diagram:
${diagramText}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: Record<string, unknown> = {};
    try {
      result = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      result = { passed: false, score: 0, feedback: "Could not evaluate", hints: [], pointsAwarded: 0 };
    }

    res.json({ ...result, stage });
  } catch (err) {
    console.error("POST /api/pm/evaluate-diagram error:", err);
    res.status(500).json({ error: "Failed to evaluate diagram" });
  }
});

export default router;
