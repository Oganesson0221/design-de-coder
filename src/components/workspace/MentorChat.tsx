import { useRef, useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useProject } from "@/stores/project";
import type { ArchComponent } from "@/stores/project";

interface Message {
  role: "mentor" | "user";
  text: string;
}

const SUGGESTIONS = [
  "Why an API gateway?",
  "How would this scale to 10,000 users?",
  "What is the simplest version I could ship?",
];

interface MentorChatProps {
  selectedComponent?: ArchComponent | null;
}

export const MentorChat = ({ selectedComponent }: MentorChatProps) => {
  const idea = useProject((s) => s.answers.idea);
  const projectId = useProject((s) => s.projectId);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "mentor",
      text: `A first draft of "${idea || "your idea"}" has been sketched on the page. Click any component to read its annotation, or pose a question of your own.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: trimmed,
          componentContext: selectedComponent
            ? {
                name: selectedComponent.name,
                tech: selectedComponent.tech,
                description: selectedComponent.description,
                why: selectedComponent.why,
                pros: selectedComponent.pros,
                cons: selectedComponent.cons,
              }
            : null,
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json() as { reply: string };
      setMessages((m) => [...m, { role: "mentor", text: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "mentor", text: "I couldn't reach the server right now — please check the backend is running." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-foreground/15 px-5 py-4">
        <div className="label-caps">— The Mentor —</div>
        <div className="font-display text-lg font-medium">In the margin, attentively</div>
        {selectedComponent && (
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
            Viewing: {selectedComponent.name}
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="label-caps mb-1">
              {m.role === "user" ? "— You" : "— Mentor"}
            </div>
            <p
              className={`font-display text-sm leading-relaxed ${
                m.role === "user" ? "text-foreground" : "italic text-foreground/80"
              }`}
            >
              {m.text}
            </p>
          </motion.div>
        ))}
        {thinking && (
          <div>
            <div className="label-caps mb-1">— Mentor</div>
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="font-mono text-[10px] text-muted-foreground">thinking…</span>
            </div>
          </div>
        )}

        {messages.length <= 1 && (
          <div className="space-y-2 border-t border-foreground/15 pt-4">
            <div className="label-caps">Suggested openings</div>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="block w-full border-l-2 border-foreground/20 py-1.5 pl-3 text-left font-display text-sm italic text-muted-foreground transition-smooth hover:border-primary hover:text-foreground"
              >
                "{s}"
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="border-t border-foreground/15 p-3"
      >
        <div className="flex items-center gap-2 border border-foreground/20 bg-card px-3 focus-within:border-primary">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pose a question…"
            className="flex-1 bg-transparent py-2.5 font-display text-sm outline-none placeholder:italic placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="text-muted-foreground transition-smooth hover:text-primary disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
