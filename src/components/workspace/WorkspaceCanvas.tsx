import { useEffect, useRef, useState, useCallback } from "react";
import { useProject } from "@/stores/project";
import { buildDrawioXml } from "@/lib/drawioXml";
import { getTechsByKind, techLogoUrl, getTechMeta } from "@/lib/techRegistry";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

// draw.io embed — proto=json enables postMessage API
const DRAWIO_EMBED =
  "https://embed.diagrams.net/?embed=1&proto=json&ui=min&noSaveBtn=1&noExitBtn=1&spin=1&libraries=0&lang=en";

export const WorkspaceCanvas = () => {
  const components   = useProject((s) => s.components);
  const connections  = useProject((s) => s.connections);
  const addComponent = useProject((s) => s.addComponent);

  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [leftOpen, setLeftOpen]       = useState(true);
  const [expandedKind, setExpandedKind] = useState<string | null>("frontend");
  const diagramSentRef = useRef(false);
  const techGroups = getTechsByKind();

  const sendDiagram = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    const xml = buildDrawioXml(components, connections);
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ action: "load", xml }),
      "*"
    );
  }, [components, connections]);

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      if (!iframeRef.current) return;
      let msg: Record<string, unknown> = {};
      try {
        if (typeof ev.data === "string") msg = JSON.parse(ev.data) as Record<string, unknown>;
        else if (typeof ev.data === "object" && ev.data !== null) msg = ev.data as Record<string, unknown>;
      } catch { return; }

      const event = msg.event as string | undefined;
      if (event === "init") {
        setIframeReady(true);
        if (components.length > 0 && !diagramSentRef.current) {
          diagramSentRef.current = true;
          sendDiagram();
        }
      }
      if (event === "load") setIframeReady(true);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [components, sendDiagram]);

  useEffect(() => {
    if (iframeReady && components.length > 0) sendDiagram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [components, connections, iframeReady]);

  const handleAddTech = (logoKey: string) => {
    const meta = getTechMeta(logoKey);
    const kindMap: Record<string, string> = {
      frontend: "frontend", backend: "backend", api: "api",
      database: "database", cache: "cache", queue: "queue",
      ai: "ai", auth: "auth", storage: "storage", cdn: "cdn", infra: "backend",
    };
    const kind = (kindMap[meta.kind] ?? "backend") as import("@/stores/project").ComponentKind;
    addComponent({
      id: `custom-${logoKey}-${Date.now()}`,
      name: meta.name, kind, tech: meta.name, logoKey,
      description: `${meta.name} added to the architecture.`,
      why: "Added manually.",
      pros: ["Purpose-built for this role"],
      cons: ["Review integration points carefully"],
      alternatives: [],
      x: 200 + Math.random() * 400,
      y: 100 + Math.random() * 250,
    });
    toast(`Added ${meta.name} to diagram`);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left panel — tech library */}
      <div className={`flex shrink-0 flex-col border-r-2 border-foreground bg-card transition-all duration-200 ${leftOpen ? "w-52" : "w-10"}`}>
        <button
          onClick={() => setLeftOpen((v) => !v)}
          className="flex h-10 items-center justify-between border-b border-foreground/15 px-3"
          title={leftOpen ? "Collapse" : "Add components"}
        >
          {leftOpen && <span className="label-caps text-[9px]">Add to diagram</span>}
          {leftOpen ? <ChevronRight className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
        {leftOpen && (
          <div className="flex-1 overflow-y-auto py-1">
            {Object.entries(techGroups).map(([kind, techs]) => (
              <div key={kind}>
                <button
                  onClick={() => setExpandedKind(expandedKind === kind ? null : kind)}
                  className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-secondary/40"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{kind}</span>
                  {expandedKind === kind
                    ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                </button>
                {expandedKind === kind && (
                  <div className="pb-1">
                    {techs.map(({ logoKey, meta }) => (
                      <button
                        key={logoKey}
                        onClick={() => handleAddTech(logoKey)}
                        title={`Add ${meta.name}`}
                        className="flex w-full items-center gap-2 px-3 py-1.5 transition-colors hover:bg-secondary/60"
                      >
                        <img src={techLogoUrl(logoKey)} alt={meta.name} className="h-4 w-4 shrink-0 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <span className="truncate font-mono text-[10px] text-foreground/80">{meta.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* draw.io iframe */}
      <div className="relative flex-1">
        {!iframeReady && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-paper">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Loading diagram…</span>
          </div>
        )}
        <iframe ref={iframeRef} src={DRAWIO_EMBED} className="h-full w-full border-0"
          title="Architecture diagram editor" allow="clipboard-write" />
        {iframeReady && components.length > 0 && (
          <div className="pointer-events-none absolute bottom-4 left-3 border border-foreground/20 bg-card/90 px-3 py-1.5 backdrop-blur">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              Edit freely · use right panel to inspect components
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
