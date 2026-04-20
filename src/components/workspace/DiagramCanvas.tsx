import { useRef } from "react";
import { ArchComponent, useProject } from "@/stores/project";
import { DiagramNode } from "./DiagramNode";

interface Props {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

// Simple connections between core layers
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
      className="relative h-full w-full overflow-hidden bg-mesh"
    >
      {/* dotted grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground) / 0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* connections */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {CONNECTIONS.map(([fromId, toId]) => {
          const a = byId(fromId);
          const b = byId(toId);
          if (!a || !b) return null;
          const x1 = a.x + 88;
          const y1 = a.y + 32;
          const x2 = b.x + 88;
          const y2 = b.y + 32;
          const mx = (x1 + x2) / 2;
          return (
            <path
              key={`${fromId}-${toId}`}
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke="hsl(var(--foreground) / 0.25)"
              strokeWidth={2}
              strokeDasharray="4 6"
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

      {/* legend */}
      <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2 rounded-2xl bg-card/80 p-3 text-xs shadow-soft backdrop-blur">
        {[
          ["frontend", "Frontend"],
          ["api", "API"],
          ["backend", "Backend"],
          ["database", "Database"],
          ["ai", "AI"],
        ].map(([k, label]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full bg-node-${k}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
