import { motion } from "framer-motion";
import { ReactNode } from "react";

export function Section({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`mx-auto max-w-7xl container-px py-16 md:py-24 ${className}`}>{children}</section>;
}

export function SectionHeader({ eyebrow, title, subtitle, center = true }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className={`max-w-2xl ${center ? "mx-auto text-center" : ""} mb-12`}
    >
      {eyebrow && (
        <span className="inline-block px-3 py-1 text-xs uppercase tracking-widest rounded-full glass text-gradient-brand font-medium mb-6">{eyebrow}</span>
      )}
      <h2 className="text-3xl md:text-5xl font-bold text-gradient leading-[1.2] py-1">{title}</h2>

      {subtitle && <p className="mt-4 text-muted-foreground md:text-lg">{subtitle}</p>}
    </motion.div>
  );
}
