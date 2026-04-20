import { useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { ArchComponent, ComponentKind } from "@/stores/project";
import { Database, Globe, Server, Plug, Sparkles } from "lucide-react";

const ICONS: Record<ComponentKind, typeof Globe> = {
  frontend: Globe,
  backend: Server,
  api: Plug,
  database: Database,
  ai: Sparkles,
};

const KIND_LABEL: Record<ComponentKind, string> = {
  frontend: "Frontend",
  backend: "Backend",
  api: "API",
  database: "Database",
  ai: "AI",
};

interface Props {
  component: ArchComponent;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const DiagramNode = ({ component, selected, onSelect, onMove, containerRef }: Props) => {
  const Icon = ICONS[component.kind];
  const x = useMotionValue(component.x);
  const y = useMotionValue(component.y);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    x.set(component.x);
    y.set(component.y);
  }, [component.x, component.y, x, y]);

  return (
    <motion.button
      drag
      dragMomentum={false}
      dragConstraints={containerRef}
      style={{ x, y }}
      onDragStart={() => setDragging(true)}
      onDragEnd={(_, info) => {
        setDragging(false);
        onMove(component.x + info.offset.x, component.y + info.offset.y);
      }}
      onClick={() => !dragging && onSelect()}
      whileHover={{ y: -2 }}
      className={`absolute left-0 top-0 flex w-44 cursor-grab flex-col items-start gap-2 border bg-card p-3 text-left shadow-paper transition-smooth active:cursor-grabbing ${
        selected ? "border-primary ring-1 ring-primary" : "border-foreground/30"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          {KIND_LABEL[component.kind]}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="font-display text-base font-medium leading-tight text-foreground">
        {component.name}
      </div>
      <div
        className="h-0.5 w-8"
        style={{ backgroundColor: `hsl(var(--node-${component.kind}))` }}
      />
    </motion.button>
  );
};
