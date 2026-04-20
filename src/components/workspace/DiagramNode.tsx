import { useEffect, useRef, useState } from "react";
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

const TINTS: Record<ComponentKind, string> = {
  frontend: "bg-node-frontend/80 border-node-frontend",
  backend: "bg-node-backend/80 border-node-backend",
  api: "bg-node-api/80 border-node-api",
  database: "bg-node-database/80 border-node-database",
  ai: "bg-node-ai/80 border-node-ai",
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
        const newX = component.x + info.offset.x;
        const newY = component.y + info.offset.y;
        onMove(newX, newY);
      }}
      onClick={() => !dragging && onSelect()}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`absolute left-0 top-0 flex w-44 cursor-grab items-center gap-3 rounded-2xl border-2 ${TINTS[component.kind]} p-3 text-left shadow-pop backdrop-blur-sm transition-smooth active:cursor-grabbing ${
        selected ? "ring-4 ring-primary ring-offset-2 ring-offset-background" : ""
      }`}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card/90 shadow-soft">
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <div className="min-w-0">
        <div className="font-display text-sm font-bold leading-tight text-foreground">{component.name}</div>
        <div className="truncate text-[10px] uppercase tracking-wider text-foreground/70">{component.kind}</div>
      </div>
      {selected && (
        <span className="pointer-events-none absolute -inset-2 -z-10 animate-pulse-ring rounded-3xl bg-primary/30" />
      )}
    </motion.button>
  );
};
