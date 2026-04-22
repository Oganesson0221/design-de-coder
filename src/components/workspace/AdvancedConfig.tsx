import { useState } from "react";
import { useProject, AdvancedConstraints } from "@/stores/project";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Users, Cpu, Shield, Wifi, WifiOff, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface TechSuggestion {
  componentId: string;
  componentName: string;
  currentTech: string;
  suggestedTech: string;
  suggestedLogoKey: string;
  reason: string;
}

const USER_OPTIONS = [
  { value: "< 1k", label: "< 1k" },
  { value: "1k–100k", label: "1k – 100k" },
  { value: "100k–1M", label: "100k – 1M" },
  { value: "> 1M", label: "> 1M" },
];

const MEMORY_OPTIONS = [
  { value: "low", label: "Low (< 1 GB)" },
  { value: "medium", label: "Medium (1–8 GB)" },
  { value: "high", label: "High (8–64 GB)" },
  { value: "unlimited", label: "Unlimited" },
];

const PRIVACY_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "gdpr", label: "GDPR" },
  { value: "hipaa", label: "HIPAA" },
  { value: "both", label: "GDPR + HIPAA" },
];

export const AdvancedConfig = () => {
  const constraints = useProject((s) => s.constraints);
  const setConstraints = useProject((s) => s.setConstraints);
  const projectId = useProject((s) => s.projectId);
  const components = useProject((s) => s.components);
  const requirementsDoc = useProject((s) => s.requirementsDoc);
  const setComponents = useProject((s) => s.setComponents);
  const setConnections = useProject((s) => s.setConnections);

  const [suggestions, setSuggestions] = useState<TechSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const toggle = (key: keyof AdvancedConstraints, val?: string) => {
    if (val !== undefined) {
      setConstraints({ [key]: val });
    } else {
      setConstraints({ [key]: !constraints[key as keyof AdvancedConstraints] });
    }
  };

  const getSuggestions = async () => {
    if (!projectId) { toast("No project loaded"); return; }
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch(`/api/projects/${projectId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ constraints, components }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { suggestions: TechSuggestion[] };
      setSuggestions(data.suggestions ?? []);
    } catch {
      toast("Could not fetch suggestions — check the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const regenerateDiagram = async () => {
    if (!projectId) { toast("No project loaded"); return; }
    setRegenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ constraints, requirementsDoc }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { components: unknown[]; connections: unknown[] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setComponents(data.components as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setConnections(data.connections as any);
      toast("Diagram regenerated with your constraints.");
    } catch {
      toast("Could not regenerate — check the backend.");
    } finally {
      setRegenerating(false);
    }
  };

  const ToggleButton = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-all ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-foreground/20 bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );

  const SelectRow = ({
    label,
    icon: Icon,
    options,
    value,
    onChange,
  }: {
    label: string;
    icon: React.ElementType;
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="label-caps">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <ToggleButton key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </ToggleButton>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="label-caps mb-1">— Advanced Configuration —</div>
      <p className="mb-5 font-display text-xs italic text-muted-foreground">
        Set constraints and get tailored tech suggestions for each component.
      </p>

      <div className="space-y-5">
        <SelectRow
          label="Expected users"
          icon={Users}
          options={USER_OPTIONS}
          value={constraints.expectedUsers}
          onChange={(v) => toggle("expectedUsers", v)}
        />

        <SelectRow
          label="Memory budget"
          icon={Cpu}
          options={MEMORY_OPTIONS}
          value={constraints.memoryBudget}
          onChange={(v) => toggle("memoryBudget", v)}
        />

        <SelectRow
          label="Privacy compliance"
          icon={Shield}
          options={PRIVACY_OPTIONS}
          value={constraints.privacy}
          onChange={(v) => toggle("privacy", v)}
        />

        {/* Boolean toggles */}
        <div>
          <div className="label-caps mb-1.5">Feature flags</div>
          <div className="flex flex-wrap gap-1.5">
            <ToggleButton
              active={constraints.gpuRequired}
              onClick={() => toggle("gpuRequired")}
            >
              <Cpu className="h-3 w-3" /> GPU / ML
            </ToggleButton>
            <ToggleButton
              active={constraints.realtime}
              onClick={() => toggle("realtime")}
            >
              <Wifi className="h-3 w-3" /> Real-time
            </ToggleButton>
            <ToggleButton
              active={constraints.offline}
              onClick={() => toggle("offline")}
            >
              <WifiOff className="h-3 w-3" /> Offline
            </ToggleButton>
            <ToggleButton
              active={constraints.costSensitive}
              onClick={() => toggle("costSensitive")}
            >
              <DollarSign className="h-3 w-3" /> Cost-sensitive
            </ToggleButton>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-2">
        <Button
          onClick={() => void getSuggestions()}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Getting suggestions…</>
          ) : (
            <><Zap className="h-3.5 w-3.5" /> Suggest tech for my constraints</>
          )}
        </Button>

        <Button
          onClick={() => void regenerateDiagram()}
          disabled={regenerating}
          variant="hero"
          className="w-full"
        >
          {regenerating ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Regenerating…</>
          ) : (
            "Regenerate full diagram"
          )}
        </Button>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 space-y-3"
          >
            <div className="label-caps">— Recommendations —</div>
            {suggestions.map((s, i) => (
              <div key={i} className="border border-foreground/15 bg-paper p-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-medium">{s.componentName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9px] text-muted-foreground line-through">
                      {s.currentTech}
                    </span>
                    <span className="font-mono text-[9px] text-primary">→ {s.suggestedTech}</span>
                  </div>
                </div>
                <p className="mt-1.5 font-display text-xs italic leading-relaxed text-muted-foreground">
                  {s.reason}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
