import { useRef, useState, useEffect } from "react";
import { Send } from "lucide-react";
import { motion } from "framer-motion";
import { useProject } from "@/stores/project";

interface Message {
  role: "mentor" | "user";
  text: string;
}

const SUGGESTIONS = [
  "Why an API gateway?",
  "How would this scale to 10,000 users?",
  "What is the simplest version I could ship?",
];

function mockMentorReply(userText: string, idea: string): string {
  const t = userText.toLowerCase();
  if (t.includes("scale") || t.includes("10000") || t.includes("users")) {
    return `For "${idea || "your idea"}" at thousands of users, the bottleneck is usually the database. Add caching in front of reads, push slow work into background workers, and place a CDN before the frontend. Modest investments, lasting returns.`;
  }
  if (t.includes("gateway") || t.includes("api")) {
    return `An API gateway is the front door to your backend. It centralises authentication, rate-limiting, and routing, leaving each service free to remain simple. One may begin without it, but most apps add one once a second service appears.`;
  }
  if (t.includes("simple") || t.includes("ship") || t.includes("mvp")) {
    return `For a first shippable version, retain only Web Frontend, Application Service, and Primary Database. Set workers and the AI mentor service aside until real users arrive.`;
  }
  if (t.includes("database") || t.includes("schema")) {
    return `For "${idea || "your idea"}", a relational database is a quiet, dependable choice — transactions and constraints make the data legible to those who follow you.`;
  }
  return `A thoughtful question. The honest answer depends on your priorities. Tell me whether you value speed, cost, or simplicity above the others, and I will suggest a path.`;
}

export const MentorChat = () => {
  const idea = useProject((s) => s.answers.idea);
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
      <div className="border-b border-foreground/15 px-5 py-4">
        <div className="label-caps">— The Mentor —</div>
        <div className="font-display text-lg font-medium">In the margin, attentively</div>
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
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1 w-1 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        {messages.length <= 1 && (
          <div className="space-y-2 border-t border-foreground/15 pt-4">
            <div className="label-caps">Suggested openings</div>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full border-l-2 border-foreground/20 py-1.5 pl-3 text-left font-display text-sm italic text-muted-foreground transition-smooth hover:border-primary hover:text-foreground"
              >
                “{s}”
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
            disabled={!input.trim()}
            className="text-muted-foreground transition-smooth hover:text-primary disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
