import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Insights & Blog — Design, Print & Brand Strategy Tips" },
      { name: "description", content: "Expert insights on premium printing techniques, branding strategies, packaging trends, and modern web design from the Wings Design Studio team." },
      { property: "og:title", content: "Wings Design Studio Insights — The Blog" },
      { property: "og:description", content: "Tips, trends, and creative ideas from our studio to help elevate your brand." },
      { name: "twitter:title", content: "Wings Design Studio Blog" },
      { name: "twitter:description", content: "Expert insights on printing, branding, and web design." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("blog")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setPosts(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <SiteLayout>
      <PageHero 
        eyebrow="Insights"
        title="The Wings Design Studio blog"
        desc="Tips, trends and ideas on print, brand and web design."
      />
      <Section>
        {loading ? (
          <div className="text-center py-20 animate-pulse text-muted-foreground">Loading articles...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p, i) => {
              const hue = (p.id.length % 360) || 200; // Generate a pseudo-random hue from UUID
              return (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="group rounded-2xl glass shadow-elegant overflow-hidden hover:bg-white/[0.06] transition"
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full" style={{ background: `linear-gradient(135deg, oklch(0.5 0.2 ${hue}), oklch(0.2 0.05 ${hue + 50}))` }} />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-full glass text-brand">{p.category}</span>
                      <span className="inline-flex items-center gap-1"><Calendar size={12} /> {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <Link to="/blog/$id" params={{ id: p.id }}>
                      <h3 className="mt-3 font-semibold text-lg leading-snug group-hover:text-brand transition">{p.title}</h3>
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                    <Link to="/blog/$id" params={{ id: p.id }} className="mt-4 inline-flex items-center gap-1 text-sm text-brand group-hover:gap-2 transition-all">
                      Read article <ArrowRight size={14} />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </Section>
    </SiteLayout>
  );
}
