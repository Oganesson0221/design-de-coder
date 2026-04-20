import { useRef } from "react";
import { ArchComponent, useProject } from "@/stores/project";
import { DiagramNode } from "./DiagramNode";

interface Props {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const CONNECTIONS: [string, string][] = [
  ["fe-web", "api-gw"],
  ["fe-mobile", "api-gw"],
  ["api-gw", "be-app"],
  ["api-gw", "ai-mentor"],
  ["be-app", "be-worker"],
  ["be-app", "db-main"],
  ["be-worker", "db-main"],
];

export const DiagramCanvas = ({ selectedId, onSelect }: Props) => {
  const components = useProject((s) => s.components);
  const moveComponent = useProject((s) => s.moveComponent);
  const containerRef = useRef<HTMLDivElement>(null);
  const byId = (id: string): ArchComponent | undefined => components.find((c) => c.id === id);

  return (
    <div
      ref={containerRef}
      onClick={() => onSelect(null)}
      className="relative h-full w-full overflow-hidden bg-paper"
    >
      {/* Faint engineering grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 100%)",
        }}
      />

      {/* Margin notation */}
      <div className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Plate I — Architecture in Draft
      </div>
      <div className="pointer-events-none absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Scale 1:1
      </div>

      {/* Connections */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--foreground) / 0.4)" />
          </marker>
        </defs>
        {CONNECTIONS.map(([fromId, toId]) => {
          const a = byId(fromId);
          const b = byId(toId);
          if (!a || !b) return null;
          const x1 = a.x + 88;
          const y1 = a.y + 36;
          const x2 = b.x + 88;
          const y2 = b.y + 36;
          const mx = (x1 + x2) / 2;
          return (
            <path
              key={`${fromId}-${toId}`}
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke="hsl(var(--foreground) / 0.4)"
              strokeWidth={1}
              markerEnd="url(#arrow)"
            />
          );
        })}
      </svg>

      {components.map((c) => (
        <div key={c.id} onClick={(e) => e.stopPropagation()}>
          <DiagramNode
            component={c}
            selected={selectedId === c.id}
            onSelect={() => onSelect(c.id)}
            onMove={(x, y) => moveComponent(c.id, x, y)}
            containerRef={containerRef}
          />
        </div>
      ))}

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-4 left-4 border border-foreground/20 bg-card/90 p-3 backdrop-blur">
        <div className="label-caps mb-2">Legend</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {(["frontend", "api", "backend", "database", "ai"] as const).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="h-2 w-4" style={{ backgroundColor: `hsl(var(--node-${k}))` }} />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
