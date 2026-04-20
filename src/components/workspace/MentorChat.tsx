import { useRef, useState, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useProject } from "@/stores/project";

interface Message {
  role: "mentor" | "user";
  text: string;
}

const SUGGESTIONS = [
  "Why do I need an API gateway?",
  "How would this scale to 10,000 users?",
  "What's the simplest version I could ship?",
];

function mockMentorReply(userText: string, idea: string): string {
  const t = userText.toLowerCase();
  if (t.includes("scale") || t.includes("10000") || t.includes("users")) {
    return `Great question. For "${idea || "your idea"}" at thousands of users, the bottleneck is usually the database. You'd add caching in front of reads, push slow work into the background workers, and put a CDN in front of the web frontend. Want me to mark those on the diagram?`;
  }
  if (t.includes("gateway") || t.includes("api")) {
    return `An API gateway is the front door to your backend. It centralizes auth, rate-limiting, and routing — so each individual service stays simple. You can skip it early on, but most apps add one once they have more than one service.`;
  }
  if (t.includes("simple") || t.includes("ship") || t.includes("mvp")) {
    return `For a first shippable version, start with just the Web Frontend, Application Service, and Primary Database. Skip workers and the AI mentor service until you have real users. We can hide them on the canvas if you'd like.`;
  }
  if (t.includes("database") || t.includes("schema")) {
    return `Your database is the heart of your data story. For "${idea || "your idea"}", I'd start with a relational database — it gives you transactions and is easy to reason about. Want me to sketch a starter schema?`;
  }
  return `That's a thoughtful question. The honest answer is: it depends on your priorities. Tell me whether you care more about speed, cost, or simplicity, and I'll suggest a path.`;
}

export const MentorChat = () => {
  const idea = useProject((s) => s.answers.idea);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "mentor",
      text: `Hi! I'm your AI mentor. I sketched a starter architecture for "${idea || "your idea"}". Click any component to learn more — or ask me anything.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "mentor", text: mockMentorReply(trimmed, idea) }]);
      setThinking(false);
    }, 700);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-warm shadow-soft">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <div className="font-display text-sm font-bold">AI Mentor</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Always here to help</div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-node-database opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-node-database" />
          </span>
          online
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-secondary-foreground rounded-bl-sm"
              }`}
            >
              {m.text}
            </div>
          </motion.div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-secondary-foreground/60"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-smooth hover:border-primary hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-border/60 p-3"
      >
        <div className="flex items-center gap-2 rounded-full bg-muted px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/40">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your mentor anything..."
            className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="grid h-8 w-8 place-items-center rounded-full bg-warm text-primary-foreground shadow-soft transition-bounce hover:scale-105 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
