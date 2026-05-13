import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Section, SectionHeader } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — Wings Design Studio" },
      { name: "description", content: "Real stories from brands we've helped grow with print, branding and web design." },
      { property: "og:title", content: "Testimonials — Wings Design Studio" },
      { property: "og:description", content: "Hear from our happy clients." },
    ],
  }),
  component: TestimonialsPage,
});

const logos = ["lumen", "bloomly", "northwave", "skyline"];

function TestimonialsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: res } = await supabase
        .from("testimonials")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (res) setData(res);
      setLoading(false);
    }
    load();
  }, []);
  const [idx, setIdx] = useState(0);
  
  const featured = (data || []).slice(0, 3);
  const reviews = (data || []).slice(3);

  useEffect(() => {
    if (featured.length === 0) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length]);

  if (featured.length === 0 && reviews.length === 0) {
    return (
      <SiteLayout>
        <PageHero eyebrow="Testimonials" title="Loved by brands" desc="Hear from teams we've helped grow." />
        <Section><div className="text-center text-muted-foreground">No testimonials yet.</div></Section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero 
        eyebrow="Testimonials"
        title="Loved by brands across India"
        desc="Hear from teams we've helped grow."
      />

      {featured.length > 0 && (
        <Section>
          <div className="relative max-w-3xl mx-auto">
            <div className="rounded-3xl glass shadow-elegant p-8 md:p-12 text-center min-h-[280px] grid place-items-center bg-gradient-hero">
              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <Quote className="text-brand mx-auto" size={32} />
                  <p className="mt-4 text-xl md:text-2xl font-display">"{featured[idx].content}"</p>
                  <div className="flex justify-center gap-0.5 mt-5">
                    {Array.from({ length: featured[idx].rating }).map((_, i) => <Star key={i} size={16} className="fill-brand text-brand" />)}
                  </div>
                  <div className="mt-4">
                    <div className="font-semibold">{featured[idx].name}</div>
                    <div className="text-sm text-muted-foreground">{featured[idx].company}</div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            {featured.length > 1 && (
              <>
                <button onClick={() => setIdx((i) => (i - 1 + featured.length) % featured.length)} className="absolute -left-2 md:-left-12 top-1/2 -translate-y-1/2 size-10 grid place-items-center rounded-full glass" aria-label="Prev"><ChevronLeft size={18} /></button>
                <button onClick={() => setIdx((i) => (i + 1) % featured.length)} className="absolute -right-2 md:-right-12 top-1/2 -translate-y-1/2 size-10 grid place-items-center rounded-full glass" aria-label="Next"><ChevronRight size={18} /></button>
                <div className="flex justify-center gap-2 mt-5">
                  {featured.map((_, i) => (
                    <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-gradient-brand" : "w-2 bg-white/20"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </Section>
      )}

      {reviews.length > 0 && (
        <Section>
          <SectionHeader eyebrow="More reviews" title="Words from our clients" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="p-6 rounded-2xl glass shadow-elegant">
                <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={14} className="fill-brand text-brand" />)}</div>
                <p className="mt-3 text-sm">"{r.content}"</p>
                <div className="mt-4">
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      <Section>
        <SectionHeader eyebrow="Trusted by" title="Brands we've worked with" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {logos.map((l) => (
            <div key={l} className="h-20 rounded-xl glass grid place-items-center text-muted-foreground font-display font-semibold tracking-wider">
              {l.toUpperCase()}
            </div>
          ))}
        </div>
      </Section>
    </SiteLayout>
  );
}
