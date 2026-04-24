import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  Edit2,
  KeyRound,
  Link2,
  Loader2,
  PanelRight,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useProject } from "@/stores/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  applySchemaAgentChange,
  askEngineerMentor,
  generateSchema,
  getSchema,
  initEngineerSession,
  saveSchema,
  type DbSchemaData,
  type SchemaColumn,
  type SchemaRelationship,
  type SchemaTable,
} from "@/services/engineerApi";
import { toast } from "sonner";

type MainTab = "schema" | "diagram";
type SideTab = "mentor" | "agent";
type ChatMessage = { role: "assistant" | "user"; text: string };

const EMPTY_SCHEMA: DbSchemaData = { tables: [], relationships: [] };

function toProjectId(idea: string, audience: string, flow: string) {
  const raw = `${idea}|${audience}|${flow}`.trim() || "workspace";
  return `project_${raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 60)}`;
}

function cloneSchema(schema: DbSchemaData): DbSchemaData {
  return JSON.parse(JSON.stringify(schema));
}

function EditCell({
  value,
  onChange,
  mono = false,
  placeholder = "",
}: {
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-7 text-xs px-2 border-foreground/20 bg-background ${mono ? "font-mono" : ""}`}
    />
  );
}

function DrawioFrame({ xml }: { xml: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);
  const [hasPostedLoad, setHasPostedLoad] = useState(false);
  const xmlRef = useRef(xml);

  useEffect(() => {
    xmlRef.current = xml;
    setHasPostedLoad(false);
  }, [xml]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      let parsed: Record<string, unknown> | null = null;
      if (typeof event.data === "string" && event.data.startsWith("{")) {
        try {
          parsed = JSON.parse(event.data) as Record<string, unknown>;
        } catch {
          parsed = null;
        }
      } else if (event.data && typeof event.data === "object") {
        parsed = event.data as Record<string, unknown>;
      }
      const raw = typeof event.data === "string" ? event.data : "";
      const evt = typeof parsed?.event === "string" ? parsed.event : "";
      if (evt === "init" || raw === "ready") {
        setIsEditorReady(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (
      !iframeRef.current?.contentWindow ||
      !isFrameLoaded ||
      !isEditorReady ||
      !xmlRef.current.trim()
    )
      return;
    const normalizeForDrawio = (source: string) => {
      const normalizeNewlines = (s: string) =>
        s.replace(/\\\\n/g, "\n").replace(/\\n/g, "\n").replace(/&#10;/g, "\n");
      const upgradeLegacyModel = (model: string) => {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(model, "application/xml");
          const graph = doc.querySelector("mxGraphModel");
          if (!graph) return model;

          const asStyleMap = (style: string) => {
            const out = new Map<string, string>();
            style
              .split(";")
              .map((x) => x.trim())
              .filter(Boolean)
              .forEach((kv) => {
                const idx = kv.indexOf("=");
                if (idx === -1) return;
                out.set(kv.slice(0, idx), kv.slice(idx + 1));
              });
            return out;
          };
          const styleString = (m: Map<string, string>) =>
            Array.from(m.entries())
              .map(([k, v]) => `${k}=${v}`)
              .join(";");
          const normalizeCellText = (rawValue: string) => {
            const normalized = rawValue
              .split("\\\\n")
              .join("\n")
              .split("\\n")
              .join("\n");

            const wrapRows = (rows: string[], maxLen = 72) => {
              const out: string[] = [];
              for (const row of rows) {
                const line = row.replace(/\s+/g, " ").trim();
                if (!line) continue;
                if (line.length <= maxLen) {
                  out.push(line);
                  continue;
                }
                const words = line.split(" ");
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
              }
              return out;
            };

            if (normalized.includes("\n")) {
              return wrapRows(normalized.split(/\r?\n/), 72).join("\n");
            }
            const compact = normalized.replace(/\s+/g, " ").trim();
            const parts = compact.split(
              /\s+(?=[a-zA-Z_][a-zA-Z0-9_]*\s*:\s)/g,
            );
            if (parts.length <= 1) return compact;
            const header = parts[0].trim();
            const rows = parts
              .slice(1)
              .map((x) => x.trim())
              .filter(Boolean);
            const wrapped = wrapRows(rows, 72);
            return [header, ...wrapped].join("\n");
          };

          const vertices = Array.from(
            doc.querySelectorAll("mxCell[vertex='1']"),
          );
          const withLayout: Array<{
            cell: Element;
            width: number;
            height: number;
          }> = [];

          const palette = ["#eef6ff", "#f5f3ff", "#ecfeff", "#f0fdf4", "#fff7ed"];

          vertices.forEach((cell, idx) => {
            const rawValue = cell.getAttribute("value") || "";
            const normalizedValue = normalizeCellText(rawValue);
            const rowLines = normalizedValue
              .split(/\r?\n/)
              .map((x) => x.trim())
              .filter(Boolean);
            const header = rowLines[0] || "table";
            const rest = rowLines.slice(1);
            const htmlValue = [
              `<b>${header}</b>`,
              `<span style="color:#64748b;">--------------------</span>`,
              ...rest,
            ].join("<br/>");
            cell.setAttribute("value", htmlValue);

            const style = asStyleMap(cell.getAttribute("style") || "");
            style.set("whiteSpace", "wrap");
            style.set("html", "1");
            style.set("align", "left");
            style.set("verticalAlign", "top");
            style.set("spacing", "10");
            style.set("spacingTop", "16");
            style.set("spacingLeft", "10");
            style.set("spacingRight", "10");
            style.set("spacingBottom", "10");
            style.set("overflow", "hidden");
            style.set("fontSize", style.get("fontSize") || "11");
            style.set("fontFamily", style.get("fontFamily") || "Menlo");
            style.set("fillColor", palette[idx % palette.length]);
            style.set("strokeColor", "#334155");
            cell.setAttribute("style", styleString(style));

            const g = cell.querySelector("mxGeometry");
            if (!g) return;
            const oldW = Number(g.getAttribute("width") || 0);
            const oldH = Number(g.getAttribute("height") || 0);
            const lineCount = Math.max(
              4,
              normalizedValue.split(/\r?\n/).length,
            );
            const targetW = Math.max(oldW, 640);
            const targetH = Math.max(oldH, 44 + lineCount * 20);
            g.setAttribute("width", String(targetW));
            g.setAttribute("height", String(targetH));
            withLayout.push({ cell, width: targetW, height: targetH });
          });

          if (withLayout.length > 0) {
            const cols = Math.max(
              2,
              Math.min(2, Math.ceil(Math.sqrt(withLayout.length))),
            );
            const startX = 40;
            const startY = 40;
            const gapX = 420;
            const gapY = 260;
            const rowHeights: number[] = [];
            for (let i = 0; i < withLayout.length; i++) {
              const row = Math.floor(i / cols);
              rowHeights[row] = Math.max(
                rowHeights[row] || 0,
                withLayout[i].height,
              );
            }
            const rowY: number[] = [];
            let yCursor = startY;
            for (let r = 0; r < rowHeights.length; r++) {
              rowY[r] = yCursor;
              yCursor += rowHeights[r] + gapY;
            }
            for (let i = 0; i < withLayout.length; i++) {
              const row = Math.floor(i / cols);
              const col = i % cols;
              const item = withLayout[i];
              const g = item.cell.querySelector("mxGeometry");
              if (!g) continue;
              g.setAttribute("x", String(startX + col * (item.width + gapX)));
              g.setAttribute("y", String(rowY[row]));
            }

            const maxRowWidth = Math.max(...withLayout.map((x) => x.width), 0);
            const totalRows = Math.max(1, Math.ceil(withLayout.length / cols));
            const totalHeight =
              rowHeights.reduce((sum, h) => sum + h, 0) +
              Math.max(0, totalRows - 1) * gapY +
              startY +
              80;
            const totalWidth =
              startX + cols * maxRowWidth + Math.max(0, cols - 1) * gapX + 80;
            graph.setAttribute("pageWidth", String(Math.max(Number(graph.getAttribute("pageWidth") || 0), totalWidth)));
            graph.setAttribute("pageHeight", String(Math.max(Number(graph.getAttribute("pageHeight") || 0), totalHeight)));
          }

          doc.querySelectorAll("mxCell[edge='1']").forEach((cell) => {
            const rawValue = cell.getAttribute("value") || "";
            const compactEdge = rawValue
              .split("\\\\n")
              .join("\n")
              .split("\\n")
              .join("\n")
              .split(/\r?\n/)
              .map((x) => x.trim())
              .filter(Boolean)[0] || rawValue;
            cell.setAttribute(
              "value",
              compactEdge,
            );
            const style = asStyleMap(cell.getAttribute("style") || "");
            style.set("html", "0");
            style.set("whiteSpace", "wrap");
            style.set("labelBackgroundColor", "#ffffff");
            style.set("fontSize", style.get("fontSize") || "9");
            style.set("edgeStyle", "orthogonalEdgeStyle");
            style.set("orthogonalLoop", "1");
            style.set("jettySize", "auto");
            cell.setAttribute("style", styleString(style));
          });

          return new XMLSerializer().serializeToString(graph);
        } catch {
          return model;
        }
      };
      const raw = source.trim();
      const modelMatch = raw.match(/<mxGraphModel[\s\S]*<\/mxGraphModel>/i);
      if (modelMatch?.[0])
        return upgradeLegacyModel(normalizeNewlines(modelMatch[0].trim()));
      const unescaped = raw
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&");
      const modelUnescaped = unescaped.match(
        /<mxGraphModel[\s\S]*<\/mxGraphModel>/i,
      );
      if (modelUnescaped?.[0])
        return upgradeLegacyModel(normalizeNewlines(modelUnescaped[0].trim()));
      if (raw.includes("<mxfile")) {
        const cdata = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
        if (cdata?.[1]?.includes("<mxGraphModel")) {
          const nested = cdata[1].match(
            /<mxGraphModel[\s\S]*<\/mxGraphModel>/i,
          );
          if (nested?.[0])
            return upgradeLegacyModel(normalizeNewlines(nested[0].trim()));
        }
      }
      return "";
    };
    const normalizedXml = normalizeForDrawio(xmlRef.current);
    if (!normalizedXml) return;
    const sendLoad = () => {
      if (!iframeRef.current?.contentWindow) return;
      const payload = {
        action: "load",
        xml: normalizedXml,
        format: "xml",
        autosave: 0,
      };
      iframeRef.current.contentWindow.postMessage(JSON.stringify(payload), "*");
      iframeRef.current.contentWindow.postMessage(payload, "*");
      setHasPostedLoad(true);
    };
    const timers = [
      window.setTimeout(sendLoad, 0),
      window.setTimeout(sendLoad, 350),
      window.setTimeout(sendLoad, 1200),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [isEditorReady, xml, isFrameLoaded]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-foreground/20 bg-card h-full">
      <iframe
        ref={iframeRef}
        title="Draw.io schema diagram"
        src="https://embed.diagrams.net/?embed=1&proto=json&spin=1&ui=min&libraries=1&saveAndExit=1&modified=unsavedChanges"
        className="h-full w-full min-h-[900px]"
        onLoad={() => {
          setIsFrameLoaded(true);
        }}
      />
      {(!isFrameLoaded || !hasPostedLoad) && (
        <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground pointer-events-none">
          Loading draw.io...
        </div>
      )}
    </div>
  );
}

function TableCard({
  table,
  isEditing,
  onChange,
  onDelete,
}: {
  table: SchemaTable;
  isEditing: boolean;
  onChange: (t: SchemaTable) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const updateCol = (i: number, field: keyof SchemaColumn, value: string) => {
    const cols = table.columns.map((c, idx) =>
      idx === i ? { ...c, [field]: value } : c,
    );
    onChange({ ...table, columns: cols });
  };

  const addCol = () => {
    onChange({
      ...table,
      columns: [
        ...table.columns,
        { name: "new_column", type: "text", constraints: "", notes: "" },
      ],
    });
  };

  const deleteCol = (i: number) => {
    onChange({
      ...table,
      columns: table.columns.filter((_, idx) => idx !== i),
    });
  };

  return (
    <div className="bg-card rounded-xl border border-foreground/15 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-foreground/15 bg-background px-4 py-2.5">
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          {isEditing ? (
            <Input
              value={table.name}
              onChange={(e) => onChange({ ...table, name: e.target.value })}
              className="h-6 text-xs font-mono font-semibold border-foreground/20 bg-background w-44"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="font-mono text-sm font-semibold text-foreground">
              {table.name}
            </span>
          )}
          <Badge
            variant="outline"
            className="text-[10px] text-muted-foreground border-foreground/20"
          >
            {table.columns.length} cols
          </Badge>
        </button>
        <div className="flex items-center gap-1.5">
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="px-4 py-2 border-b border-foreground/15 bg-background">
          <Input
            value={table.description}
            onChange={(e) =>
              onChange({ ...table, description: e.target.value })
            }
            placeholder="Table description..."
            className="h-7 text-xs border-foreground/20"
          />
        </div>
      ) : table.description ? (
        <div className="px-4 py-2 border-b border-foreground/15 bg-background">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {table.description}
          </p>
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 border-b border-foreground/15">
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px] w-[170px]">
                      Column
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px] w-[180px]">
                      Type
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                      Constraints
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                      Notes
                    </th>
                    {isEditing && <th className="w-8" />}
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col, i) => {
                    const isPK = col.constraints.toUpperCase().includes("PK");
                    const isFK = col.constraints.toUpperCase().includes("FK");
                    return (
                      <tr
                        key={i}
                        className="border-b border-foreground/10 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <EditCell
                              value={col.name}
                              onChange={(v) => updateCol(i, "name", v)}
                              mono
                              placeholder="column_name"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {isPK && (
                                <KeyRound className="w-3 h-3 text-primary shrink-0" />
                              )}
                              {isFK && (
                                <Link2 className="w-3 h-3 text-primary shrink-0" />
                              )}
                              <span className="font-mono font-medium text-foreground">
                                {col.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <EditCell
                              value={col.type}
                              onChange={(v) => updateCol(i, "type", v)}
                              mono
                              placeholder="text"
                            />
                          ) : (
                            <span className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                              {col.type}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {isEditing ? (
                            <EditCell
                              value={col.constraints}
                              onChange={(v) => updateCol(i, "constraints", v)}
                              placeholder="PK, NOT NULL..."
                            />
                          ) : (
                            col.constraints || (
                              <span className="text-muted-foreground/50">
                                -
                              </span>
                            )
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {isEditing ? (
                            <EditCell
                              value={col.notes}
                              onChange={(v) => updateCol(i, "notes", v)}
                              placeholder="Note..."
                            />
                          ) : (
                            col.notes || (
                              <span className="text-muted-foreground/50">
                                -
                              </span>
                            )
                          )}
                        </td>
                        {isEditing && (
                          <td className="px-2 py-2">
                            <button
                              className="text-muted-foreground transition-colors hover:text-foreground"
                              onClick={() => deleteCol(i)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {isEditing && (
              <div className="px-3 py-2 border-t border-dashed border-foreground/20 bg-muted/20">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={addCol}
                >
                  <Plus className="w-3 h-3" /> Add column
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EngineerWorkbench() {
  const [searchParams] = useSearchParams();
  const answers = useProject((s) => s.answers);
  const components = useProject((s) => s.components);
  const storeProjectId = useProject((s) => s.projectId);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("schema");
  const [sideTab, setSideTab] = useState<SideTab>("mentor");
  const [sideOpen, setSideOpen] = useState(true);

  const [schema, setSchema] = useState<DbSchemaData>(EMPTY_SCHEMA);
  const [draft, setDraft] = useState<DbSchemaData>(EMPTY_SCHEMA);
  const [isEditing, setIsEditing] = useState(false);
  const [drawioXml, setDrawioXml] = useState("");
  const [requirementsMarkdown, setRequirementsMarkdown] = useState("");
  const [rationale, setRationale] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");

  const [mentorInput, setMentorInput] = useState("");
  const [agentInput, setAgentInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mentorPoints, setMentorPoints] = useState(0);
  const [terminology, setTerminology] = useState<
    { term: string; explanation: string }[]
  >([]);
  const [recommendedAnswers, setRecommendedAnswers] = useState<string[]>([
    "For 8,000 DAU, I can estimate peak concurrency by choosing a peak-window activity ratio and validating with logs.",
    "I will define p95 latency targets per critical user flow and tune from production traces.",
    "I will only add GPUs when we have a concrete ML inference bottleneck with measured demand.",
  ]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const mentorScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll mentor chat when messages change
  useEffect(() => {
    if (mentorScrollRef.current) {
      mentorScrollRef.current.scrollTop = mentorScrollRef.current.scrollHeight;
    }
  }, [messages, terminology]);

  const display = isEditing ? draft : schema;
  const rationalePoints = useMemo(() => {
    if (!rationale.trim()) return [];
    const base = rationale
      .split(/\r?\n/)
      .flatMap((line) => line.split(/(?<=[.?!;])\s+|(?<=:)\s+/))
      .map((x) => x.trim())
      .filter(Boolean);
    return base;
  }, [rationale]);

  const defaultProjectId = useMemo(
    () => toProjectId(answers.idea, answers.audience, answers.flow),
    [answers.idea, answers.audience, answers.flow],
  );
  const projectIdFromUrl = (searchParams.get("projectId") || "").trim();

  useEffect(() => {
    if (!activeProjectId) {
      const initial = storeProjectId || projectIdFromUrl || defaultProjectId;
      setActiveProjectId(initial);
    }
  }, [defaultProjectId, activeProjectId, projectIdFromUrl, storeProjectId]);

  const hydrateFromSession = (data: {
    dbSchema: DbSchemaData;
    dbSchemaDrawioXml: string;
    dbSchemaRationale: string;
    requirementsMarkdown: string;
    mentorScore: number;
    lastMentorQuestion: string;
    updatedAt: string;
  }) => {
    setSchema(data.dbSchema || EMPTY_SCHEMA);
    setDraft(cloneSchema(data.dbSchema || EMPTY_SCHEMA));
    setDrawioXml(data.dbSchemaDrawioXml || "");
    setRationale(data.dbSchemaRationale || "");
    setRequirementsMarkdown(data.requirementsMarkdown || "");
    setMentorPoints(Number(data.mentorScore || 0));
    setLastSavedAt(data.updatedAt || "");
    if (data.lastMentorQuestion) {
      setMessages((prev) =>
        prev.length > 0
          ? prev
          : [
              {
                role: "assistant",
                text: `Terminology:\n- DAU: Daily Active Users, used to estimate baseline daily load.\n- Peak concurrency: users active at the same time during busiest windows.\n\nEngineer mode ready. ${data.lastMentorQuestion}`,
              },
            ],
      );
    }
  };

  useEffect(() => {
    let mounted = true;
    async function boot() {
      if (!activeProjectId) return;
      setLoading(true);
      try {
        const session = await initEngineerSession({
          projectId: activeProjectId,
          answers,
          architecture: components,
        });
        if (!mounted) return;
        hydrateFromSession(session);
      } catch {
        toast.error("Could not initialize engineer workspace.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void boot();
    return () => {
      mounted = false;
    };
  }, [activeProjectId, answers, components]);

  const startEdit = () => {
    setDraft(cloneSchema(schema));
    setIsEditing(true);
  };

  const discardEdit = () => {
    setDraft(cloneSchema(schema));
    setIsEditing(false);
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      const saved = await saveSchema(projectId, draft);
      hydrateFromSession(saved);
      setIsEditing(false);
      toast.success("Schema saved to MongoDB.");
    } catch {
      toast.error("Could not save schema.");
    } finally {
      setBusy(false);
    }
  };

  const loadFromDb = async () => {
    setBusy(true);
    try {
      const data = await getSchema(projectId);
      hydrateFromSession(data);
      setIsEditing(false);
      toast.success("Schema loaded from DB.");
    } catch {
      toast.error("Could not load schema.");
    } finally {
      setBusy(false);
    }
  };

  const generateFromRequirements = async () => {
    setBusy(true);
    try {
      const generated = await generateSchema(projectId);
      hydrateFromSession(generated);
      setIsEditing(false);
      toast.success("Generated schema and draw.io XML from requirements.");
    } catch {
      toast.error("Schema generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const runSchemaAgent = async () => {
    const instruction = agentInput.trim();
    if (!instruction) return;
    setBusy(true);
    try {
      const next = await applySchemaAgentChange({ projectId, instruction });
      hydrateFromSession(next);
      setAgentInput("");
      setIsEditing(false);
      toast.success("Schema agent applied your change request.");
    } catch {
      toast.error("Schema agent failed to apply changes.");
    } finally {
      setBusy(false);
    }
  };

  const askMentor = async () => {
    const text = mentorInput.trim();
    if (!text) return;
    setMentorInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const result = await askEngineerMentor({ projectId, message: text });
      setMessages((m) => [...m, { role: "assistant", text: result.reply }]);
      setTerminology(result.terminology || []);
      setRecommendedAnswers(result.recommendedAnswers || []);
      setMentorPoints(result.totalPoints || mentorPoints);
      if (result.pointsAwarded > 0) {
        toast.success(`+${result.pointsAwarded} engineering points`);
      }
    } catch {
      toast.error("Mentor call failed.");
    } finally {
      setBusy(false);
    }
  };

  const projectId = activeProjectId || defaultProjectId;

  const updateTable = (i: number, t: SchemaTable) => {
    setDraft((prev) => ({
      ...prev,
      tables: prev.tables.map((tbl, idx) => (idx === i ? t : tbl)),
    }));
  };

  const deleteTable = (i: number) => {
    setDraft((prev) => ({
      ...prev,
      tables: prev.tables.filter((_, idx) => idx !== i),
    }));
  };

  const addTable = () => {
    setDraft((prev) => ({
      ...prev,
      tables: [
        ...prev.tables,
        {
          name: "new_table",
          description: "",
          columns: [
            {
              name: "id",
              type: "uuid",
              constraints: "PK",
              notes: "Primary key",
            },
          ],
        },
      ],
    }));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative h-full bg-paper overflow-hidden rounded-xl border border-foreground/15">
      <div className="h-full flex min-h-0 overflow-hidden">
        <main
          className={`flex-1 min-w-0 flex flex-col overflow-hidden transition-[padding-right] duration-200 ${
            sideOpen ? "pr-[320px]" : "pr-0"
          }`}
        >
          <div className="shrink-0 border-b border-foreground/15 bg-background">
            <div className="px-4 h-12 flex items-center gap-2">
              <Button
                variant={mainTab === "schema" ? "default" : "outline"}
                size="sm"
                onClick={() => setMainTab("schema")}
              >
                <Database className="w-4 h-4" />
                Database Schema
              </Button>
              <Button
                variant={mainTab === "diagram" ? "default" : "outline"}
                size="sm"
                onClick={() => setMainTab("diagram")}
              >
                <Sparkles className="w-4 h-4" />
                Draw.io Diagram
              </Button>
              <div className="ml-auto flex items-center gap-2">
                {/* <Badge variant="outline" className="border-foreground/20">
                  Engineer points: {mentorPoints}
                </Badge> */}
                <Button
                  variant={sideOpen ? "default" : "outline"}
                  size="icon"
                  onClick={() => setSideOpen((v) => !v)}
                >
                  <PanelRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {mainTab === "schema" && (
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-5 w-full max-w-none space-y-3">
                <div className="flex items-center gap-2 border border-foreground/15 rounded-xl bg-card px-3 py-2">
                  {!isEditing ? (
                    <>
                      <Button size="sm" className="gap-1.5" onClick={startEdit}>
                        <Edit2 className="w-3.5 h-3.5" /> Edit tables
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={generateFromRequirements}
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                        Generate from requirements
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadFromDb}
                        disabled={busy}
                      >
                        Reload from DB
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={saveEdit}
                        disabled={busy}
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={discardEdit}
                      >
                        <X className="w-3.5 h-3.5" /> Discard
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 ml-2"
                        onClick={addTable}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add table
                      </Button>
                    </>
                  )}
                  <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-primary" /> PK
                    </span>
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-primary" /> FK
                    </span>
                  </div>
                </div>

                {rationale && (
                  <div className="border-l-2 border-primary bg-secondary/40 p-4 rounded">
                    <div className="label-caps mb-1">Schema rationale</div>
                    <ul className="space-y-1">
                      {rationalePoints.map((pt, i) => (
                        <li
                          key={i}
                          className="text-sm text-foreground/85 leading-relaxed"
                        >
                          • {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border border-foreground/15 bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b border-foreground/15 bg-background px-4 py-2.5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Relationships
                    </h3>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs gap-1"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            relationships: [
                              ...prev.relationships,
                              {
                                from: "table.col",
                                to: "table.id",
                                type: "many-to-one",
                              },
                            ],
                          }))
                        }
                      >
                        <Plus className="w-3 h-3" /> Add
                      </Button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-foreground/15">
                          <th className="text-left px-4 py-2 font-medium text-[10px] uppercase tracking-wide text-muted-foreground">
                            From
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-[10px] uppercase tracking-wide text-muted-foreground">
                            To
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-[10px] uppercase tracking-wide text-muted-foreground">
                            Cardinality
                          </th>
                          {isEditing && <th className="w-8" />}
                        </tr>
                      </thead>
                      <tbody>
                        {display.relationships.map((rel, i) => (
                          <tr
                            key={i}
                            className="border-b border-foreground/10 last:border-0 hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-4 py-2">
                              {isEditing ? (
                                <Input
                                  value={rel.from}
                                  onChange={(e) =>
                                    setDraft((prev) => ({
                                      ...prev,
                                      relationships: prev.relationships.map(
                                        (r, ri) =>
                                          ri === i
                                            ? { ...r, from: e.target.value }
                                            : r,
                                      ),
                                    }))
                                  }
                                  className="h-7 text-xs font-mono border-foreground/20 bg-background"
                                />
                              ) : (
                                <span className="font-mono text-primary">
                                  {rel.from}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {isEditing ? (
                                <Input
                                  value={rel.to}
                                  onChange={(e) =>
                                    setDraft((prev) => ({
                                      ...prev,
                                      relationships: prev.relationships.map(
                                        (r, ri) =>
                                          ri === i
                                            ? { ...r, to: e.target.value }
                                            : r,
                                      ),
                                    }))
                                  }
                                  className="h-7 text-xs font-mono border-foreground/20 bg-background"
                                />
                              ) : (
                                <span className="font-mono text-primary">
                                  {rel.to}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {isEditing ? (
                                <select
                                  value={rel.type}
                                  onChange={(e) =>
                                    setDraft((prev) => ({
                                      ...prev,
                                      relationships: prev.relationships.map(
                                        (r, ri) =>
                                          ri === i
                                            ? {
                                                ...r,
                                                type: e.target
                                                  .value as SchemaRelationship["type"],
                                              }
                                            : r,
                                      ),
                                    }))
                                  }
                                  className="h-7 w-full rounded border border-foreground/20 bg-background px-2 text-xs text-muted-foreground"
                                >
                                  <option value="many-to-one">
                                    many-to-one
                                  </option>
                                  <option value="one-to-many">
                                    one-to-many
                                  </option>
                                  <option value="many-to-many">
                                    many-to-many
                                  </option>
                                </select>
                              ) : (
                                <span className="text-muted-foreground">
                                  {rel.type}
                                </span>
                              )}
                            </td>
                            {isEditing && (
                              <td className="px-2 py-2">
                                <button
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={() =>
                                    setDraft((prev) => ({
                                      ...prev,
                                      relationships: prev.relationships.filter(
                                        (_, ri) => ri !== i,
                                      ),
                                    }))
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {display.tables.map((table, i) => (
                  <TableCard
                    key={`${table.name}-${i}`}
                    table={table}
                    isEditing={isEditing}
                    onChange={(t) => updateTable(i, t)}
                    onDelete={() => deleteTable(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {mainTab === "diagram" && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="h-full w-full flex flex-col gap-2">
                <div className="mx-2 mt-2 rounded-xl border border-foreground/15 bg-card p-3 shrink-0">
                  <div className="label-caps mb-1">Draw.io render</div>
                  <p className="text-xs text-muted-foreground">
                    This diagram is generated from the stored DB schema XML in
                    MongoDB and rendered in the embed viewer.
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    XML size: {drawioXml.length} chars{" "}
                    {lastSavedAt
                      ? `• Saved: ${new Date(lastSavedAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <div className="min-h-0 flex-1 h-full overflow-auto px-2 pb-2">
                  <DrawioFrame xml={drawioXml} />
                </div>
              </div>
            </div>
          )}
        </main>

        <aside
          className={`absolute right-0 top-0 z-20 h-full border-l border-foreground/15 bg-card transition-transform duration-200 ${
            sideOpen ? "translate-x-0 w-[320px]" : "translate-x-full w-[320px]"
          }`}
        >
          {sideOpen && (
            <div className="h-full flex flex-col">
              <div className="shrink-0 border-b border-foreground/15">
                <div className="flex">
                  <button
                    onClick={() => setSideTab("mentor")}
                    className={`flex-1 py-3 text-xs uppercase tracking-[0.14em] ${
                      sideTab === "mentor"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    Guided Mentor
                  </button>
                  <button
                    onClick={() => setSideTab("agent")}
                    className={`flex-1 py-3 text-xs uppercase tracking-[0.14em] ${
                      sideTab === "agent"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    Schema Agent
                  </button>
                </div>
              </div>

              {sideTab === "mentor" && (
                <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
                  {/* Scrollable content area */}
                  <div ref={mentorScrollRef} className="flex-1 min-h-0 overflow-y-auto">
                    <div className="p-4 border-b border-foreground/15">
                      <div className="flex items-center justify-between">
                        <div className="label-caps">Engineering Copilot</div>
                        <Badge variant="outline" className="border-foreground/20">
                          {mentorPoints} pts
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Ask your scale/performance decisions. The mentor first
                        explains the terms in the question, then probes your
                        architecture choices.
                      </p>
                      {recommendedAnswers.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="label-caps">Thinking prompts</div>
                          {recommendedAnswers.map((ans) => (
                            <button
                              key={ans}
                              onClick={() => setMentorInput(ans)}
                              className="block w-full border-l-2 border-foreground/20 py-1 pl-2 text-left text-xs text-muted-foreground hover:text-foreground hover:border-primary"
                            >
                              {ans}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      {messages.map((m, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="label-caps mb-1">
                            {m.role === "assistant" ? "Mentor" : "You"}
                          </div>
                          <p
                            className={`text-sm leading-relaxed ${m.role === "assistant" ? "italic text-foreground/85" : "text-foreground"}`}
                          >
                            {m.text}
                          </p>
                        </motion.div>
                      ))}
                      {terminology.length > 0 && (
                        <div className="rounded-lg border border-foreground/15 bg-background p-3">
                          <div className="label-caps mb-2">Terminology</div>
                          <div className="space-y-2">
                            {terminology.map((t) => (
                              <div key={t.term}>
                                <div className="text-xs font-semibold text-foreground">
                                  {t.term}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {t.explanation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fixed input at bottom */}
                  <div className="shrink-0 p-3 border-t border-foreground/15">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void askMentor();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={mentorInput}
                        onChange={(e) => setMentorInput(e.target.value)}
                        placeholder="Ask the engineering mentor..."
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!mentorInput.trim() || busy}
                      >
                        {busy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              )}

              {sideTab === "agent" && (
                <div className="h-full flex flex-col p-4 gap-3">
                  <div>
                    <div className="label-caps mb-2">Schema Change Agent</div>
                    <p className="text-xs text-muted-foreground">
                      Request high-level DB changes and the agent updates schema
                      + relationships + draw.io XML in MongoDB.
                    </p>
                  </div>
                  <Textarea
                    value={agentInput}
                    onChange={(e) => setAgentInput(e.target.value)}
                    className="min-h-[180px] text-xs"
                    placeholder="Example: Add a subscriptions table linked to users with status, plan, and renewal_date. Create necessary relationships and constraints."
                  />
                  <Button
                    onClick={runSchemaAgent}
                    disabled={!agentInput.trim() || busy}
                    className="gap-2"
                  >
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                    Apply DB changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={loadFromDb}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Refresh from DB
                  </Button>
                  <div className="rounded-lg border border-foreground/15 bg-background p-3">
                    <div className="label-caps mb-2">Source requirements</div>
                    <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
                      {requirementsMarkdown}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
