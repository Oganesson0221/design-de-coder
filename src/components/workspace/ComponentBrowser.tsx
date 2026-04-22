import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProject, type ArchComponent } from "@/stores/project";
import { techLogoUrl, getTechMeta } from "@/lib/techRegistry";
import { Button } from "@/components/ui/button";
import {
  ChevronDown, ChevronRight, RefreshCw, Loader2,
  Trash2, ExternalLink, CheckCircle2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const KIND_ORDER = ["frontend", "api", "backend", "database", "cache", "queue", "auth", "storage", "cdn", "ai"];

function kindLabel(k: string) {
  const map: Record<string, string> = {
    frontend: "Frontend", api: "API / Gateway", backend: "Backend",
    database: "Database", cache: "Cache", queue: "Message Queue",
    auth: "Authentication", storage: "Storage", cdn: "CDN", ai: "AI / ML",
  };
  return map[k] ?? k;
}

// ── Single component card (expandable) ────────────────────────────────────────
const ComponentCard = ({ component }: { component: ArchComponent }) => {
  const [open, setOpen] = useState(false);
  const removeComponent = useProject((s) => s.removeComponent);
  const meta = getTechMeta(component.logoKey);

  return (
    <div className={`border-b border-foreground/10 transition-colors ${open ? "bg-secondary/20" : "hover:bg-secondary/10"}`}>
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {/* Tech logo */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-foreground/10 bg-card p-1">
          <img
            src={techLogoUrl(component.logoKey)}
            alt={meta.name}
            className="h-full w-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-sm font-medium leading-tight">
              {component.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: meta.color }}
            />
            <span className="font-mono text-[10px] text-muted-foreground truncate">
              {component.tech}
            </span>
          </div>
        </div>

        {open
          ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        }
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-4 pb-4 pt-1">
              {/* Description */}
              <p className="font-display text-xs leading-relaxed text-foreground/80">
                {component.description}
              </p>

              {/* Why this tech */}
              <div className="border-l-2 border-primary bg-secondary/30 px-3 py-2">
                <div className="label-caps mb-1 text-[8px]">Why {component.tech}?</div>
                <p className="font-display text-xs italic leading-relaxed text-foreground/75">
                  {component.why}
                </p>
              </div>

              {/* Pros */}
              <div>
                <div className="label-caps mb-1.5 text-[8px]">Pros</div>
                <ul className="space-y-1">
                  {component.pros.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-foreground/50" />
                      <span className="font-display text-xs leading-relaxed text-foreground/75">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div>
                <div className="label-caps mb-1.5 text-[8px]">Cons</div>
                <ul className="space-y-1">
                  {component.cons.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive/60" />
                      <span className="font-display text-xs leading-relaxed text-foreground/75">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Alternatives */}
              {component.alternatives?.length > 0 && (
                <div>
                  <div className="label-caps mb-2 text-[8px]">Alternatives</div>
                  <div className="space-y-2">
                    {component.alternatives.map((alt) => (
                      <div key={alt.name} className="flex items-start gap-2 border border-foreground/10 bg-paper p-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-card p-0.5">
                          <img
                            src={techLogoUrl(alt.logoKey ?? alt.name.toLowerCase().replace(/\s/g, ""))}
                            alt={alt.name}
                            className="h-full w-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-display text-xs font-medium">{alt.name}</div>
                          <p className="font-display text-[10px] italic leading-relaxed text-muted-foreground">
                            {alt.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-foreground/10 pt-2">
                <button
                  onClick={() => { removeComponent(component.id); setOpen(false); }}
                  className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-destructive/70 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(component.tech + " documentation")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground hover:text-primary"
                >
                  Docs <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main ComponentBrowser ──────────────────────────────────────────────────────
export const ComponentBrowser = () => {
  const components  = useProject((s) => s.components);
  const connections = useProject((s) => s.connections);
  const projectId   = useProject((s) => s.projectId);
  const setComponents  = useProject((s) => s.setComponents);
  const setConnections = useProject((s) => s.setConnections);

  const [expandedKind, setExpandedKind] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Group components by kind, in preferred order
  const grouped = KIND_ORDER.reduce<Record<string, ArchComponent[]>>((acc, k) => {
    const group = components.filter((c) => c.kind === k);
    if (group.length) acc[k] = group;
    return acc;
  }, {});
  // Catch any kinds not in KIND_ORDER
  for (const c of components) {
    if (!grouped[c.kind]) grouped[c.kind] = [];
    if (!grouped[c.kind].includes(c)) grouped[c.kind].push(c);
  }

  const refresh = async () => {
    if (!projectId) { toast("No project loaded."); return; }
    setRefreshing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { components: unknown[]; connections: unknown[] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setComponents(data.components as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setConnections(data.connections as any);
      toast("Architecture refreshed with latest suggestions.");
    } catch {
      toast("Could not refresh — check backend is running.");
    } finally {
      setRefreshing(false);
    }
  };

  if (components.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="label-caps mb-2">No components yet</div>
        <p className="max-w-xs font-display text-sm italic text-muted-foreground">
          Complete onboarding to generate your architecture.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header + refresh button */}
      <div className="shrink-0 border-b border-foreground/15 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="label-caps mb-0.5">Architecture</div>
            <p className="font-mono text-[9px] text-muted-foreground">
              {components.length} component{components.length !== 1 ? "s" : ""} · click to expand
            </p>
          </div>
          <Button
            onClick={() => void refresh()}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            {refreshing
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <><RefreshCw className="h-3.5 w-3.5" /> Refresh</>
            }
          </Button>
        </div>
      </div>

      {/* Grouped component list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([kind, comps]) => (
          <div key={kind}>
            {/* Kind header */}
            <button
              onClick={() => setExpandedKind(expandedKind === kind ? null : kind)}
              className="flex w-full items-center justify-between border-b border-foreground/10 bg-background px-4 py-2 hover:bg-secondary/30"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/70">
                  {kindLabel(kind)}
                </span>
                <span className="flex h-4 min-w-[1rem] items-center justify-center border border-foreground/20 px-1 font-mono text-[8px] text-muted-foreground">
                  {comps.length}
                </span>
              </div>
              {expandedKind === kind
                ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                : <ChevronRight className="h-3 w-3 text-muted-foreground" />
              }
            </button>

            {/* Components in this kind */}
            <AnimatePresence initial={false}>
              {expandedKind === kind && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  {comps.map((c) => (
                    <ComponentCard key={c.id} component={c} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};
