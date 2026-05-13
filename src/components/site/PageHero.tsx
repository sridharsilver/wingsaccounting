import { ReactNode } from "react";
import { motion } from "framer-motion";

export function PageHero({ eyebrow, title, desc, children }: { eyebrow?: string; title: string; desc?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="relative mx-auto max-w-7xl container-px pt-10 md:pt-20 pb-12 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl"
        >
          {eyebrow && (
            <span className="inline-block px-3 py-1 text-xs uppercase tracking-widest rounded-full glass text-gradient-brand font-medium mb-8">
              {eyebrow}
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-gradient">
            {title}
          </h1>
          {desc && (
            <p className="mt-6 text-muted-foreground md:text-lg max-w-2xl">
              {desc}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </motion.div>
      </div>
    </section>
  );
}
