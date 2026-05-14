import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Selected Creative Projects & Printing Showcase" },
      { name: "description", content: "Explore our diverse portfolio of premium print design, strategic branding, custom packaging, and modern website development projects." },
      { property: "og:title", content: "Our Creative Portfolio — Wings Design Studio" },
      { property: "og:description", content: "A showcase of premium design and print projects crafted for ambitious brands." },
      { name: "twitter:title", content: "Wings Design Studio Portfolio" },
      { name: "twitter:description", content: "A curated look at our projects across print, brand, and digital." },
    ],
  }),
  component: PortfolioPage,
});

const CATS = ["All", "Print Design", "Branding", "Packaging", "Social Media", "Website Design"] as const;
type Cat = typeof CATS[number];

type Project = { id: number; title: string; category: string; description: string; image_url: string; featured: boolean };

function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<Cat>("All");
  const [open, setOpen] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setProjects(data);
      setLoading(false);
    }
    load();
  }, []);
  
  const list = filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <SiteLayout>
      <PageHero 
        eyebrow="Portfolio"
        title="Selected work from our studio"
        desc="A curated look at projects across print, brand and digital."
      />
      <Section>
        <div className="mt-10 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 text-sm rounded-full transition ${filter === c ? "bg-gradient-brand text-brand-foreground shadow-glow" : "glass hover:bg-white/10"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <motion.div layout className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-[220px]">
          <AnimatePresence>
            {list.map((p) => (
              <motion.button
                layout
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                onClick={() => setOpen(p)}
                className={`group relative rounded-2xl overflow-hidden glass shadow-elegant text-left ${p.featured ? "row-span-2" : ""}`}
              >
                <img 
                  src={p.image_url} 
                  alt={p.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition" />
                <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-300 text-white">
                  <div className="text-[10px] uppercase tracking-widest text-brand-purple font-bold">{p.category}</div>
                  <div className="font-bold mt-1 text-lg leading-tight">{p.title}</div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </Section>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div className="relative w-full max-w-4xl flex items-center justify-center gap-4">
              {/* Previous Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = list.findIndex(p => p.id === open.id);
                  const prev = list[idx - 1] || list[list.length - 1];
                  setOpen(prev);
                }}
                className="hidden md:grid size-12 place-items-center rounded-full glass hover:bg-white/10 transition-all shrink-0"
                aria-label="Previous Project"
              >
                <ChevronLeft size={24} />
              </button>

              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl rounded-3xl glass shadow-elegant overflow-hidden"
              >
                <div className="aspect-[16/9] relative overflow-hidden">
                  <img src={open.image_url} alt={open.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-40" />
                </div>
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-brand-purple font-bold">{open.category}</div>
                      <h3 className="mt-1 text-2xl font-bold">{open.title}</h3>
                      <div className="text-sm text-muted-foreground mt-1">Project Details</div>
                    </div>
                    <div className="flex gap-2">
                      {/* Mobile Nav Arrows */}
                      <button 
                        onClick={() => {
                          const idx = list.findIndex(p => p.id === open.id);
                          const prev = list[idx - 1] || list[list.length - 1];
                          setOpen(prev);
                        }}
                        className="md:hidden size-9 grid place-items-center rounded-full glass"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          const idx = list.findIndex(p => p.id === open.id);
                          const next = list[idx + 1] || list[0];
                          setOpen(next);
                        }}
                        className="md:hidden size-9 grid place-items-center rounded-full glass"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button onClick={() => setOpen(null)} className="size-9 grid place-items-center rounded-full glass" aria-label="Close"><X size={16} /></button>
                    </div>
                  </div>
                  <p className="mt-4 text-muted-foreground leading-relaxed">{open.description}</p>
                </div>
              </motion.div>

              {/* Next Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = list.findIndex(p => p.id === open.id);
                  const next = list[idx + 1] || list[0];
                  setOpen(next);
                }}
                className="hidden md:grid size-12 place-items-center rounded-full glass hover:bg-white/10 transition-all shrink-0"
                aria-label="Next Project"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SiteLayout>
  );
}
