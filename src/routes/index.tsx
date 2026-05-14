import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Printer, Palette, Globe, Sparkles, CheckCircle2, Quote, Star, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Section, SectionHeader, SectionDivider } from "@/components/site/Section";
import { supabase } from "@/lib/supabase";
import { HomeHero } from "@/components/site/HomeHero";
import { useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wings Design Studio — Premium Printing, Branding & Digital Design" },
      { name: "description", content: "Wings Design Studio delivers high-end commercial printing, strategic branding, and modern web design. Over 12 years of crafting excellence for ambitious brands." },
      { property: "og:title", content: "Wings Design Studio — From Print to Pixel" },
      { property: "og:description", content: "Premium printing, branding and digital design studio. Elevating brands with craft and technology." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b8cb60f6-b5d9-4c40-a0d4-b29c693523c4/id-preview-f9453e97--b2dd65e2-5a5a-4884-9255-a0ff02aa1e00.lovable.app-1778338578672.png" },
      { name: "twitter:title", content: "Wings Design Studio — Premium Printing & Branding" },
      { name: "twitter:description", content: "Delivering high-end commercial printing and strategic branding for ambitious brands." },
    ],
  }),
  component: HomePage,
});

const services = [
  { icon: Printer, title: "Commercial Printing", desc: "Brochures, packaging, stationery, banners — vivid, premium and on-time." },
  { icon: Palette, title: "Graphic Designing", desc: "Logos, brand identities, marketing collateral and packaging design." },
  { icon: Globe, title: "Website Design", desc: "Modern business, ecommerce and portfolio websites that convert." },
  { icon: Sparkles, title: "Brand Identity", desc: "Strategy, visual systems and guidelines that build trust at scale." },
];

const reasons = [
  { t: "12+ Years Experience", d: "A decade of crafting print and digital across 500+ brands." },
  { t: "End-to-End Studio", d: "From concept to delivery — design, print and web under one roof." },
  { t: "State-of-the-art Press", d: "Offset, digital and large format with premium finishes." },
  { t: "Award-winning Team", d: "Designers, strategists and developers obsessed with detail." },
];

const steps = [
  { n: "01", t: "Discover", d: "We learn your brand, audience and goals." },
  { n: "02", t: "Design", d: "Concepts, iterations and approvals — fast." },
  { n: "03", t: "Produce", d: "Print, develop, refine — built to spec." },
  { n: "04", t: "Deliver", d: "Quality-checked and shipped on schedule." },
];

const testimonials = [
  { name: "Aarav Mehta", role: "CEO, Lumen Co.", quote: "Wings transformed our packaging — sales jumped 30% in a quarter." },
  { name: "Priya Shah", role: "Founder, Bloomly", quote: "Best printing partner we've worked with. Pin-sharp and premium." },
  { name: "Rohan Iyer", role: "CMO, Northwave", quote: "From rebrand to website launch — flawless execution." },
];


function HomePage() {
  const { settings } = useSiteSettings();
  const [featured, setFeatured] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (settings.show_portfolio) {
        const { data: pData } = await supabase
          .from("portfolio")
          .select("*")
          .eq("featured", true)
          .limit(6);
        if (pData) setFeatured(pData);
      }

      if (settings.show_team) {
        const { data: tData } = await supabase
          .from("team")
          .select("*")
          .eq("is_active", true)
          .order("order_index", { ascending: true });
        if (tData) setTeam(tData);
      }

      if (settings.show_blog) {
        const { data: bData } = await supabase
          .from("blog")
          .select("*")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(3);
        if (bData) setPosts(bData);
      }
    }
    load();
  }, [settings]);

  return (
    <SiteLayout>
      <HomeHero />
      <SectionDivider />

      {/* SERVICES */}
      {settings.show_services && (
        <>
          <Section>
            <SectionHeader eyebrow="What we do" title="Services that span print & pixel" subtitle="A complete creative studio under one roof." />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group relative p-8 rounded-3xl glass hover:bg-white/[0.06] transition shadow-elegant overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute -top-12 -right-12 size-40 rounded-full bg-gradient-brand opacity-0 group-hover:opacity-20 blur-2xl transition-opacity" />
                  <div className="flex-1">
                    <div className="size-12 grid place-items-center rounded-xl bg-gradient-brand text-brand-foreground mb-6 shadow-glow">
                      <s.icon size={22} />
                    </div>
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <Link to="/services" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:gap-2 transition-all">
                      Learn more <ArrowRight size={14} />
                    </Link>
                    <Link to="/contact" className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-brand transition">
                      Get a quote
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
          <SectionDivider />
        </>
      )}

      {/* WHY US */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeader eyebrow="Why choose us" title="A studio built for ambitious brands" subtitle="We blend craft, technology and speed to deliver work that performs." center={false} />
            <ul className="space-y-4">
              {reasons.map((r) => (
                <li key={r.t} className="flex gap-3">
                  <CheckCircle2 className="text-brand shrink-0 mt-1" size={20} />
                  <div>
                    <div className="font-semibold">{r.t}</div>
                    <div className="text-sm text-muted-foreground">{r.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="aspect-square rounded-3xl bg-gradient-brand p-6 flex flex-col justify-between shadow-glow relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500">
                <Printer size={64} />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-brand-foreground leading-none">12+</div>
              <div className="text-sm font-medium text-brand-foreground/80">Years of crafting excellence</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="aspect-square rounded-3xl glass p-6 flex flex-col items-center justify-center gap-3 translate-y-6 shadow-elegant relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="relative">
                <div className="absolute inset-0 bg-brand blur-xl opacity-20 animate-pulse" />
                <div className="size-12 rounded-2xl bg-surface-elevated grid place-items-center text-brand relative z-10">
                  <CheckCircle2 size={24} />
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">Zero</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Quality Compromise</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="aspect-square rounded-3xl glass p-6 flex flex-col justify-between shadow-elegant group overflow-hidden"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="size-8 rounded-full border-2 border-background bg-gradient-brand grid place-items-center text-[10px] font-bold text-brand-foreground">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                <div className="size-8 rounded-full border-2 border-background bg-surface-elevated grid place-items-center text-[10px] font-bold text-muted-foreground">
                  +500
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">500+</div>
                <div className="text-xs text-muted-foreground">Trusted partners globally</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="aspect-square rounded-3xl glass p-1 translate-y-6 shadow-elegant group overflow-hidden"
            >
              <div className="h-full w-full rounded-[22px] bg-surface-elevated overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-brand opacity-10 animate-float" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="size-8 rounded-lg bg-white/10 backdrop-blur-md grid place-items-center mb-2">
                    <Sparkles size={16} className="text-brand" />
                  </div>
                  <div className="font-bold text-sm">Modern Press</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Tech-led delivery</div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </Section>
      <SectionDivider />

      {/* PORTFOLIO PREVIEW */}
      {settings.show_portfolio && featured.length > 0 && (
        <Section>
          <SectionHeader eyebrow="Selected work" title="A glimpse of recent projects" />
          <div className="flex flex-wrap justify-center gap-5">
            {featured.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden glass shadow-elegant w-full sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-1.25rem)] max-w-[400px]"
              >
                <img
                  src={p.image_url}
                  alt={p.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-500 text-white z-10">
                  <div className="text-[10px] text-white/70 uppercase tracking-[0.2em] font-medium mb-1">{p.category}</div>
                  <div className="font-bold text-xl leading-tight tracking-tight">{p.title}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/portfolio" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass shadow-elegant hover:scale-[1.02] active:scale-[0.98] hover:bg-white/10 transition-all">
              View all work <ArrowRight size={18} />
            </Link>
          </div>
        </Section>
      )}
      <SectionDivider />

      {/* PROCESS */}
      <Section>
        <SectionHeader eyebrow="Our process" title="From brief to brilliance" />
        <div className="grid md:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl glass shadow-elegant relative overflow-hidden"
            >
              <div className="text-5xl font-bold text-gradient-brand opacity-80">{s.n}</div>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </Section>
      <SectionDivider />

      {/* TEAM SECTION */}
      {settings.show_team && team.length > 0 && (
        <>
          <Section>
            <SectionHeader eyebrow="The experts" title="Meet our creative crew" subtitle="Specialists in print, digital and brand strategy." />
            <div className="flex flex-wrap justify-center gap-5">
              {team.map((p: any, i: number) => (
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
          </Section>
          <SectionDivider />
        </>
      )}

      {/* BLOG PREVIEW */}
      {settings.show_blog && posts.length > 0 && (
        <Section>
          <SectionHeader eyebrow="Insights" title="Latest from our studio" />
          <div className="flex flex-wrap justify-center gap-6">
            {posts.map((p, i) => {
              const hue = (p.id.length % 360) || 200;
              return (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="group rounded-2xl glass shadow-elegant overflow-hidden hover:bg-white/[0.06] transition w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] max-w-[400px]"
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
          <div className="mt-10 text-center">
            <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass shadow-elegant hover:scale-[1.02] active:scale-[0.98] hover:bg-white/10 transition-all">
              Explore all insights <ArrowRight size={18} />
            </Link>
          </div>
        </Section>
      )}

      {/* CTA BANNER */}
      <Section>
        <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 glass shadow-elegant text-center">
          <div className="absolute inset-0 bg-gradient-hero opacity-80" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold text-gradient leading-[1.2] py-2">Ready to make something premium?</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Tell us about your project — print, brand or web. We'll respond within one business day.</p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-brand text-brand-foreground font-medium shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all">
                Start a project <ArrowRight size={18} />
              </Link>
              <Link to="/services" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass shadow-elegant hover:scale-[1.02] active:scale-[0.98] hover:bg-white/10 transition-all">Explore services</Link>
            </div>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}
