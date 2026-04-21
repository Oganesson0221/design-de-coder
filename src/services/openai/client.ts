interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface LogEntry {
  timestamp: string;
  step: string;
  input: {
    model: string;
    messages: ChatMessage[];
    temperature: number;
    maxTokens: number;
  };
  output: string | null;
  error: string | null;
  durationMs: number;
}

const logs: LogEntry[] = [];

function getStepName(messages: ChatMessage[]): string {
  const systemContent = messages.find((m) => m.role === "system")?.content || "";
  if (systemContent.includes("inclusive design expert")) return "1-persona-generator";
  if (systemContent.includes("user experience researcher")) return "2-journey-verifier";
  if (systemContent.includes("fairness and inclusion analyst")) return "3-bias-calculator";
  return "unknown";
}

class OpenAIClient {
  private baseUrl = "/api/openai/v1";

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    const {
      model = "gpt-4o",
      temperature = 0.7,
      maxTokens = 4000,
    } = options;

    const startTime = Date.now();
    const step = getStepName(messages);

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      step,
      input: { model, messages, temperature, maxTokens },
      output: null,
      error: null,
      durationMs: 0,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMsg = error.error?.message || `OpenAI API error: ${response.status}`;
        logEntry.error = errorMsg;
        logEntry.durationMs = Date.now() - startTime;
        logs.push(logEntry);
        this.downloadLogs();
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";

      logEntry.output = content;
      logEntry.durationMs = Date.now() - startTime;
      logs.push(logEntry);

      // Auto-download logs after bias calculator (final step)
      if (step === "3-bias-calculator") {
        this.downloadLogs();
      }

      return content;
    } catch (error) {
      if (!logEntry.error) {
        logEntry.error = error instanceof Error ? error.message : String(error);
        logEntry.durationMs = Date.now() - startTime;
        logs.push(logEntry);
        this.downloadLogs();
      }
      throw error;
    }
  }

  downloadLogs() {
    const logContent = JSON.stringify(logs, null, 2);
    const blob = new Blob([logContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bias-detector-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getLogs(): LogEntry[] {
    return [...logs];
  }

  clearLogs() {
    logs.length = 0;
  }

  async chatWithRetry(
    messages: ChatMessage[],
    options: { retries?: number } & ChatOptions = {}
  ): Promise<string> {
    const { retries = 2, ...chatOptions } = options;
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      try {
        return await this.chat(messages, chatOptions);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < retries) {
          await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        }
      }
    }
    throw lastError;
  }
}

export const openaiClient = new OpenAIClient();
