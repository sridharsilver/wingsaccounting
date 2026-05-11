import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft, Clock, Share2, Facebook, Twitter, Linkedin, ChevronRight, Quote, FileText } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Section } from "@/components/site/Section";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/blog/$id")({
  component: SingleBlogPost,
});

function SingleBlogPost() {
  const { id } = Route.useParams();
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<any[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setScrollProgress((currentScroll / totalScroll) * 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      const { data, error } = await supabase
        .from("blog")
        .select("*")
        .eq("id", id)
        .single();
      
      if (data) {
        setPost(data);
        const { data: relData } = await supabase
          .from("blog")
          .select("*")
          .eq("category", data.category)
          .neq("id", id)
          .limit(3);
        if (relData) setRelated(relData);
      }
      setLoading(false);
    }
    loadPost();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="size-12 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
        </div>
      </SiteLayout>
    );
  }

  if (!post) {
    return (
      <SiteLayout>
        <Section className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-bold">Article Not Found</h1>
          <p className="mt-4 text-muted-foreground">The article you're looking for might have been moved.</p>
          <Link to="/blog" className="mt-8 px-6 py-3 rounded-xl bg-gradient-brand text-brand-foreground font-medium">
            Back to Blog
          </Link>
        </Section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-white/5">
        <motion.div 
          className="h-full bg-gradient-brand shadow-glow" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Article Hero */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent opacity-50" />
        <div className="relative mx-auto max-w-4xl container-px">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-brand mb-8 hover:-translate-x-1 transition-transform group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Insights
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full glass text-brand text-[10px] font-bold uppercase tracking-widest border border-brand/20">
                {post.category}
              </span>
              <span className="h-px w-8 bg-white/10" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold italic">Studio Feature</span>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-bold leading-[1.1] text-gradient pb-2">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-8 mt-10 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-gradient-brand p-0.5 shadow-glow">
                  <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-[10px] font-black text-brand uppercase">WG</div>
                </div>
                <div>
                  <div className="text-foreground font-bold">Wings Editorial</div>
                  <div>Design & Strategy</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-brand" />
                {new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-brand" />
                6 min read
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured Image */}
      <Section className="py-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-6xl aspect-[21/9] rounded-[40px] overflow-hidden shadow-2xl glass p-2.5 border-white/10"
        >
          {post.image_url ? (
            <img src={post.image_url} alt="" className="w-full h-full object-cover rounded-[32px]" />
          ) : (
            <div className="w-full h-full rounded-[32px] bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center">
              <FileText size={64} className="text-brand/20" />
            </div>
          )}
        </motion.div>
      </Section>

      {/* Content */}
      <Section className="pb-32">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-[1fr_240px] gap-16">
          {/* Main Body */}
          <article className="space-y-10">
            {/* Lead Paragraph */}
            <div className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-medium italic border-l-4 border-brand pl-8 py-2 bg-brand/5 rounded-r-2xl">
              {post.excerpt}
            </div>
            
            <div className="text-muted-foreground leading-relaxed space-y-8 text-lg">
              {post.content ? (
                <div className="whitespace-pre-wrap selection:bg-brand/30">
                   {post.content}
                </div>
              ) : (
                <div className="py-20 rounded-3xl glass text-center border-dashed border-white/10">
                  <PageHeader title="Coming Soon" desc="Our team is putting the final touches on this insight." />
                </div>
              )}
              
              {/* Decorative Pull Quote Simulation if content is long */}
              {post.content && post.content.length > 500 && (
                <div className="py-12 px-10 rounded-3xl bg-gradient-brand text-brand-foreground shadow-glow relative overflow-hidden group">
                  <Quote className="absolute -top-6 -left-6 size-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                  <p className="text-2xl md:text-3xl font-bold leading-tight relative z-10 italic">
                    "At Wings, we believe that every print is a physical handshake between a brand and its audience."
                  </p>
                  <div className="mt-6 flex items-center gap-3 relative z-10">
                    <div className="h-px w-8 bg-brand-foreground/30" />
                    <span className="text-xs uppercase tracking-widest font-black">Studio Philosophy</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tags & Footer */}
            <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-6">
              <div className="flex gap-2">
                {["Design", "Branding", "Creative"].map(t => (
                  <span key={t} className="text-xs text-muted-foreground hover:text-brand cursor-pointer transition">#{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Share:</span>
                <div className="flex gap-2">
                  <button className="size-8 rounded-lg glass flex items-center justify-center hover:bg-brand/20 transition text-muted-foreground hover:text-brand"><Facebook size={14} /></button>
                  <button className="size-8 rounded-lg glass flex items-center justify-center hover:bg-brand/20 transition text-muted-foreground hover:text-brand"><Twitter size={14} /></button>
                  <button className="size-8 rounded-lg glass flex items-center justify-center hover:bg-brand/20 transition text-muted-foreground hover:text-brand"><Linkedin size={14} /></button>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-8">
            <div className="p-6 rounded-2xl glass border-brand/20 bg-brand/5">
              <h4 className="font-bold text-sm mb-4 flex items-center gap-2 italic">
                <Share2 size={14} className="text-brand" /> Studio Brief
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stay updated with the latest trends in high-end printing and brand strategy.
              </p>
              <div className="mt-4 flex gap-2">
                <input type="text" placeholder="Email" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs w-full outline-none focus:border-brand transition" />
                <button className="bg-brand text-brand-foreground rounded-lg px-3 py-1.5 text-xs font-bold">Join</button>
              </div>
            </div>
          </aside>
        </div>
      </Section>

      {/* Related Posts */}
      {related.length > 0 && (
        <Section className="bg-white/[0.02]">
          <div className="max-w-7xl mx-auto container-px">
            <h2 className="text-3xl font-bold mb-10 flex items-center gap-3 italic">
              Continue Reading <ChevronRight className="text-brand" size={24} />
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link key={p.id} to="/blog/$id" params={{ id: p.id }} className="group">
                  <div className="aspect-video rounded-xl overflow-hidden glass mb-4">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-surface-elevated" />
                    )}
                  </div>
                  <h3 className="font-bold leading-tight group-hover:text-brand transition">{p.title}</h3>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <span className="text-brand">{p.category}</span>
                    <span>•</span>
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}
    </SiteLayout>
  );
}
