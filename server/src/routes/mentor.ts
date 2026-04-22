import { Router, Request, Response } from "express";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";
import openai from "../lib/openai.js";
import { Project } from "../models/Project.js";
import { ChatMessage } from "../models/ChatMessage.js";

const router = Router();

// POST /api/mentor/chat
router.post("/chat", async (req: Request, res: Response) => {
  const { projectId, message, componentContext } = req.body as {
    projectId: string;
    message: string;
    componentContext?: {
      name: string;
      tech?: string;
      description: string;
      why: string;
      pros: string[];
      cons: string[];
    } | null;
  };

  if (!projectId || !message) {
    res.status(400).json({ error: "projectId and message are required" });
    return;
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Load last 10 messages for context
    const history = await ChatMessage.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    const historyAsc = history.reverse();

    const componentCtx = componentContext
      ? `\n\nThe user is currently viewing the "${componentContext.name}" component (using ${componentContext.tech ?? "unspecified tech"}):
Description: ${componentContext.description}
Why it's here: ${componentContext.why}
Pros: ${componentContext.pros.join(", ")}
Cons: ${componentContext.cons.join(", ")}`
      : "";

    const systemPrompt = `You are a wise, concise system design mentor guiding someone building their first product.
The user's idea: "${project.idea}"
Target audience: "${project.audience}"
Core user flow: "${project.flow}"
${componentCtx}

Speak directly and warmly. Give concrete, actionable advice in 2–4 sentences.
If you recommend alternatives, explain the trade-off in plain language.
Avoid jargon. Encourage the user to think, not just copy answers.`;

    // Save user message
    await ChatMessage.create({ projectId, role: "user", content: message });

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...historyAsc.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "I'm not sure — can you rephrase that?";

    // Save assistant reply
    await ChatMessage.create({ projectId, role: "assistant", content: reply });

    res.json({ reply });
  } catch (err) {
    console.error("POST /api/mentor/chat error:", err);
    res.status(500).json({ error: "Failed to get mentor response" });
  }
});

export default router;
