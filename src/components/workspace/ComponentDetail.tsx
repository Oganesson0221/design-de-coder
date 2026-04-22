import { ArchComponent, useProject } from "@/stores/project";
import { Button } from "@/components/ui/button";
import { Trash2, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { techLogoUrl, getTechMeta } from "@/lib/techRegistry";

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
          {/* Header */}
          <div className="flex items-start justify-between border-b border-foreground/15 p-4">
            <div className="flex items-center gap-3">
              {/* Tech logo */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-foreground/15 bg-paper p-1.5">
                <img
                  src={techLogoUrl(component.logoKey)}
                  alt={component.tech}
                  className="h-full w-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div>
                <div className="label-caps text-[9px]">{component.kind}</div>
                <h2 className="font-display text-xl font-medium leading-tight">{component.name}</h2>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: getTechMeta(component.logoKey).color }}
                  />
                  <span className="font-mono text-[10px] tracking-wide text-muted-foreground">
                    {component.tech}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground transition-smooth hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-5 p-4">

              {/* Description */}
              <section>
                <p className="font-display text-sm leading-relaxed text-foreground/90">
                  {component.description}
                </p>
              </section>

              {/* Why this tech */}
              <section className="border-l-2 border-primary bg-secondary/30 p-3">
                <div className="label-caps mb-1.5">Why {component.tech}?</div>
                <p className="font-display text-sm italic leading-relaxed text-foreground/80">
                  {component.why}
                </p>
              </section>

              {/* Pros */}
              <section>
                <div className="label-caps mb-2">In favour</div>
                <ul className="space-y-1.5">
                  {component.pros.map((p, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                      <span className="font-display text-sm leading-relaxed text-foreground/85">{p}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Cons */}
              <section>
                <div className="label-caps mb-2">Watch out for</div>
                <ul className="space-y-1.5">
                  {component.cons.map((c, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                      <span className="font-display text-sm leading-relaxed text-foreground/85">{c}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Alternatives with logos */}
              {component.alternatives?.length > 0 && (
                <section>
                  <div className="label-caps mb-2">Worthy alternatives</div>
                  <div className="space-y-2">
                    {component.alternatives.map((alt) => {
                      const altMeta = getTechMeta(alt.logoKey ?? alt.name.toLowerCase().replace(/\s/g, ""));
                      return (
                        <div
                          key={alt.name}
                          className="flex items-start gap-3 border border-foreground/15 bg-paper p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-foreground/10 bg-card p-1">
                            <img
                              src={techLogoUrl(alt.logoKey ?? altMeta.slug)}
                              alt={alt.name}
                              className="h-full w-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-display text-sm font-medium">{alt.name}</div>
                            <p className="mt-0.5 font-display text-xs italic leading-relaxed text-muted-foreground">
                              {alt.reason}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-foreground/10 pt-3">
                <Button
                  onClick={() => { removeComponent(component.id); onClose(); }}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(component.tech + " documentation")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
                >
                  Docs <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
