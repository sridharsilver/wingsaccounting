import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Palette, Type, Box, Sparkles, Layout, MousePointer2 } from "lucide-react";
import { AdminCard as Card } from "@/components/admin/AdminCard";
import { PageHeader } from "@/components/admin/PageHeader";

export const Route = createFileRoute("/admin/style-guide")({
  component: StyleGuide,
});

function StyleGuide() {
  return (
    <>
      <PageHeader 
        title="Style Guide" 
        desc="Visual identity system and component library for Wings Graphics." 
      />

      <div className="space-y-10">
        {/* COLORS */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Palette className="text-brand" size={20} />
            <h2 className="text-xl font-bold">Color Palette</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ColorSwatch label="Brand Blue" color="var(--brand)" hex="#3B82F6" />
            <ColorSwatch label="Brand Purple" color="var(--brand-purple)" hex="#A855F7" />
            <ColorSwatch label="Background" color="var(--background)" hex="#F8FAFC" />
            <ColorSwatch label="Surface" color="var(--surface)" hex="#F1F5F9" />
            <ColorSwatch label="Muted" color="var(--muted)" hex="#E2E8F0" />
            <ColorSwatch label="Accent" color="var(--accent)" hex="#CBD5E1" />
          </div>
        </section>

        {/* TYPOGRAPHY */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Type className="text-brand" size={20} />
            <h2 className="text-xl font-bold">Typography</h2>
          </div>
          <Card className="p-8 space-y-8">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Display / Poppins</div>
              <h1 className="text-5xl font-bold">Heading 1</h1>
              <h2 className="text-4xl font-bold">Heading 2</h2>
              <h3 className="text-3xl font-bold">Heading 3</h3>
              <h4 className="text-2xl font-bold">Heading 4</h4>
            </div>
            <hr className="border-border/50" />
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Body / Inter</div>
              <p className="text-lg">Large Body - The quick brown fox jumps over the lazy dog.</p>
              <p className="text-base text-muted-foreground">Regular Body - Wings Graphics delivers premium commercial printing, branding and web design.</p>
              <p className="text-sm text-muted-foreground">Small Body - A studio where ink meets pixel since 2013.</p>
            </div>
          </Card>
        </section>

        {/* GRADIENTS & EFFECTS */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-brand" size={20} />
            <h2 className="text-xl font-bold">Effects & Gradients</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-32 rounded-2xl bg-gradient-brand grid place-items-center text-white font-bold shadow-glow">
              Brand Gradient
            </div>
            <div className="h-32 rounded-2xl glass grid place-items-center font-bold border border-white/20">
              Glassmorphism
            </div>
            <div className="h-32 rounded-2xl bg-surface shadow-elegant grid place-items-center font-bold">
              Elegant Shadow
            </div>
          </div>
        </section>

        {/* BUTTONS */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <MousePointer2 className="text-brand" size={20} />
            <h2 className="text-xl font-bold">Interactive Elements</h2>
          </div>
          <div className="flex flex-wrap gap-4 p-6 rounded-2xl glass border border-white/10">
            <button className="px-6 py-2.5 rounded-lg bg-gradient-brand text-brand-foreground font-medium shadow-glow">
              Primary Button
            </button>
            <button className="px-6 py-2.5 rounded-lg glass hover:bg-white/10 transition">
              Secondary Button
            </button>
            <button className="px-6 py-2.5 rounded-lg border border-border hover:bg-surface transition">
              Outline Button
            </button>
            <button className="size-10 grid place-items-center rounded-lg bg-gradient-brand text-brand-foreground">
              <Box size={18} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function ColorSwatch({ label, color, hex }: { label: string; color: string; hex: string }) {
  return (
    <div className="space-y-2">
      <div 
        className="h-20 w-full rounded-xl border border-border shadow-sm" 
        style={{ background: color }} 
      />
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[10px] text-muted-foreground font-mono uppercase">{hex}</div>
      </div>
    </div>
  );
}
