import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Target, Eye, Award, Users, Printer, Heart, Lightbulb, Shield } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Section, SectionHeader } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";


import imgAanya from "@/assets/team/aanya.png";
import imgVikram from "@/assets/team/vikram.png";
import imgIshita from "@/assets/team/ishita.png";
import imgKaran from "@/assets/team/karan.png";

import imgInfrastructure from "@/assets/infrastructure.png";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — The Story of Wings Design Studio" },
      { name: "description", content: "Learn about the heritage and craft behind Wings Design Studio. 12+ years of expertise in premium printing, graphic design, and brand building." },
      { property: "og:title", content: "About Wings Design Studio — A Decade of Craft" },
      { property: "og:description", content: "A premium printing and design studio dedicated to quality and innovation since 2013." },
      { property: "og:type", content: "profile" },
      { name: "twitter:title", content: "About Wings Design Studio" },
      { name: "twitter:description", content: "12+ years of expertise in premium printing and brand building." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Heart, t: "Craft First", d: "We sweat the details so your brand shines." },
  { icon: Lightbulb, t: "Bold Ideas", d: "We don't ship safe — we ship memorable." },
  { icon: Shield, t: "Trust", d: "Transparent, on-time and on-budget. Always." },
  { icon: Users, t: "Partnership", d: "We grow when you grow. We invest in the long run." },
];

export function AboutPage() {
  const [teamData, setTeamData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("team")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      if (data) setTeamData(data);
    }
    load();
  }, []);

  return (
    <SiteLayout>
      <PageHero 
        eyebrow="About Wings Design Studio"
        title="A studio where ink meets pixel."
        desc="Founded in 2013, Wings Design Studio began as a small print shop and has grown into a full-service design studio for ambitious brands across India and beyond."
      />


      <Section>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: Target, t: "Our Mission", d: "Empower brands with print and digital experiences that build trust, recognition and growth." },
            { icon: Eye, t: "Our Vision", d: "To be South Asia's most trusted creative studio — known for craft, speed and care." },
          ].map((m) => (
            <motion.div key={m.t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-8 rounded-2xl glass shadow-elegant">
              <div className="size-12 grid place-items-center rounded-xl bg-gradient-brand text-brand-foreground mb-4">
                <m.icon size={22} />
              </div>
              <h3 className="text-2xl font-semibold">{m.t}</h3>
              <p className="mt-3 text-muted-foreground">{m.d}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Experience" title="A decade of craft" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[["12+", "Years in business"], ["500+", "Happy clients"], ["1,200+", "Projects delivered"], ["35", "Studio members"]].map(([n,l]) => (
            <div key={l} className="p-6 rounded-2xl glass text-center">
              <div className="text-4xl font-bold text-gradient-brand">{n}</div>
              <div className="text-sm text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Our team" title="Designers, printers and developers" subtitle="A multidisciplinary crew under one roof." />
        
        {teamData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">
            Loading our creative crew...
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-5 w-full">
            {teamData.map((p: any, i: number) => (
              <motion.div 
                key={p.id} 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: i * 0.08 }} 
                className="rounded-2xl glass shadow-elegant p-5 group hover:shadow-glow transition-all duration-300 w-full sm:w-[calc(50%-1.25rem)] md:w-[calc(25%-1.25rem)] max-w-[280px]"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-surface mb-4">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-surface-elevated"><Users size={32} /></div>
                  )}
                </div>
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.role}</div>
              </motion.div>
            ))}
          </div>
        )}
      </Section>

      <Section>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <SectionHeader eyebrow="Infrastructure" title="State-of-the-art printing press" subtitle="Offset, digital and large-format machines for any scale or finish." center={false} />
            <ul className="space-y-3 text-sm">
              {["6-color offset press for premium catalogues", "Digital press for fast on-demand runs", "Large format flex & banner printing", "Foiling, embossing and spot UV finishing", "In-house pre-press and color-grading"].map((x) => (
                <li key={x} className="flex items-center gap-3"><Printer size={16} className="text-brand" /> {x}</li>
              ))}
            </ul>
          </div>
          <div className="aspect-[4/3] rounded-3xl overflow-hidden glass shadow-elegant">
            <img src={imgInfrastructure} alt="State-of-the-art printing press" className="w-full h-full object-cover" />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Values" title="What we believe in" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((v, i) => (
            <motion.div key={v.t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="p-6 rounded-2xl glass">
              <div className="size-10 grid place-items-center rounded-lg bg-gradient-brand text-brand-foreground mb-3">
                <v.icon size={18} />
              </div>
              <div className="font-semibold">{v.t}</div>
              <p className="text-sm text-muted-foreground mt-1">{v.d}</p>
            </motion.div>
          ))}
        </div>
      </Section>
    </SiteLayout>
  );
}
