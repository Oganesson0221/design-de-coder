import { ArchComponent, useProject } from "@/stores/project";
import { Button } from "@/components/ui/button";
import { Check, Trash2, X, ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  component: ArchComponent | null;
  onClose: () => void;
}

export const ComponentDetail = ({ component, onClose }: Props) => {
  const removeComponent = useProject((s) => s.removeComponent);

  return (
    <AnimatePresence>
      {component && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25 }}
          className="flex h-full flex-col"
        >
          <div className="flex items-start justify-between p-5 pb-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {component.kind}
              </div>
              <h2 className="font-display text-2xl font-black leading-tight">{component.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-5">
            <Section title="What it does">
              <p className="text-sm leading-relaxed text-muted-foreground">{component.description}</p>
            </Section>

            <Section title="Why it's here" icon={<Lightbulb className="h-3.5 w-3.5" />}>
              <p className="text-sm leading-relaxed text-muted-foreground">{component.why}</p>
            </Section>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-accent/40 p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-foreground">
                  <ThumbsUp className="h-3 w-3" /> Pros
                </div>
                <ul className="space-y-1.5 text-xs leading-relaxed text-foreground/80">
                  {component.pros.map((p) => (
                    <li key={p} className="flex gap-1.5">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-node-database" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-foreground">
                  <ThumbsDown className="h-3 w-3" /> Cons
                </div>
                <ul className="space-y-1.5 text-xs leading-relaxed text-foreground/80">
                  {component.cons.map((p) => (
                    <li key={p} className="flex gap-1.5">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/50" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Section title="Alternatives worth knowing">
              <ul className="space-y-2">
                {component.alternatives.map((a) => (
                  <li key={a.name} className="rounded-2xl border border-border/60 bg-card p-3">
                    <div className="font-display text-sm font-bold">{a.name}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{a.reason}</div>
                  </li>
                ))}
              </ul>
            </Section>

            <Button
              onClick={() => {
                removeComponent(component.id);
                onClose();
              }}
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Remove from architecture
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground/70">
      {icon}
      {title}
    </div>
    {children}
  </div>
);
