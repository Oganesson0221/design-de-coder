import { ArchComponent, useProject } from "@/stores/project";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-full flex-col"
        >
          <div className="flex items-start justify-between border-b border-foreground/15 p-5">
            <div>
              <div className="label-caps">{component.kind} · entry</div>
              <h2 className="mt-1 font-display text-3xl font-medium leading-none">{component.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground transition-smooth hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <article className="space-y-6">
              <section>
                <p className="drop-cap font-display text-base leading-relaxed text-foreground/90">
                  {component.description}
                </p>
              </section>

              <section className="border-l-2 border-primary pl-4">
                <div className="label-caps mb-1.5">On its purpose</div>
                <p className="font-display text-base italic leading-relaxed text-foreground/80">
                  {component.why}
                </p>
              </section>

              <section>
                <div className="label-caps mb-3">— In favor —</div>
                <ul className="space-y-2 font-display text-sm leading-relaxed text-foreground/85">
                  {component.pros.map((p, i) => (
                    <li key={p} className="flex gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <div className="label-caps mb-3">— Against —</div>
                <ul className="space-y-2 font-display text-sm leading-relaxed text-foreground/85">
                  {component.cons.map((p, i) => (
                    <li key={p} className="flex gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <div className="label-caps mb-3">— Worthy alternatives —</div>
                <dl className="space-y-3">
                  {component.alternatives.map((a) => (
                    <div key={a.name} className="border-t border-foreground/15 pt-3">
                      <dt className="font-display text-base font-medium">{a.name}</dt>
                      <dd className="mt-1 font-display text-sm italic leading-relaxed text-muted-foreground">
                        {a.reason}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <Button
                onClick={() => {
                  removeComponent(component.id);
                  onClose();
                }}
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove from architecture
              </Button>
            </article>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
