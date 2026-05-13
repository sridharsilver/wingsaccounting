import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CreditCard, BookOpen, FileText, Layers, Package, Sticker, Flag, Briefcase,
  Palette, Sparkles, ImageIcon, Megaphone, Boxes, Camera,
  Globe, ShoppingBag, User, Rocket, MousePointer, Wrench, ArrowRight,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Section, SectionHeader } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Wings Design Studio" },
      { name: "description", content: "Commercial printing, graphic design and website design services from Wings Design Studio." },
      { property: "og:title", content: "Services — Wings Design Studio" },
      { property: "og:description", content: "Print, design and web — under one roof." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: res } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });
      if (res) setData(res);
      setLoading(false);
    }
    load();
  }, []);
  
  // Group services by category
  const categories = Array.from(new Set((data || []).map(s => s.category || "General")));
  const groups = categories.map((cat, i) => ({
    eyebrow: `0${i + 1}`,
    title: cat,
    desc: `Premium ${(cat || "").toLowerCase()} services tailored to your brand's needs.`,
    items: data.filter(s => (s.category || "General") === cat)
  }));
  return (
    <SiteLayout>
      <PageHero 
        eyebrow="Services"
        title="Everything your brand needs — in one studio."
        desc="Print, design and web — crafted to a premium standard, delivered on time."
      />

      {groups.map((g) => (
        <Section key={g.title}>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <span className="text-xs uppercase tracking-widest text-brand">{g.eyebrow}</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gradient">{g.title}</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl">{g.desc}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {g.items.map((s: any, i: number) => {
              const Icon = s.category.toLowerCase().includes('design') ? Palette : 
                          s.category.toLowerCase().includes('digital') ? Globe : 
                          s.category.toLowerCase().includes('print') ? FileText : Briefcase;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative p-8 rounded-3xl glass hover:bg-white/[0.06] transition shadow-elegant overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute -top-12 -right-12 size-40 rounded-full bg-gradient-brand opacity-0 group-hover:opacity-25 blur-2xl transition" />
                  <div className="flex-1">
                    <div className="size-11 grid place-items-center rounded-xl bg-gradient-brand text-brand-foreground mb-5 group-hover:scale-110 transition-transform shadow-glow">
                      <Icon size={20} />
                    </div>
                    <div className="font-bold text-lg">{s.title}</div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                    {s.price && <div className="mt-2 text-xs font-bold text-brand">{s.price}</div>}
                  </div>
                  <div className="mt-6 pt-5 border-t border-white/5">
                    <Link to="/contact" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-brand group-hover:gap-2 transition-all">
                      Get a quote <ArrowRight size={12} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Section>
      ))}

      <Section>
        <div className="rounded-3xl p-10 md:p-16 glass shadow-elegant text-center bg-gradient-hero">
          <h2 className="text-3xl md:text-5xl font-bold text-gradient">Have a project in mind?</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Send us your brief — we'll respond with ideas and an estimate within 24 hours.</p>
          <Link to="/contact" className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-brand text-brand-foreground font-medium shadow-glow">
            Start a project <ArrowRight size={18} />
          </Link>
        </div>
      </Section>
    </SiteLayout>
  );
}
