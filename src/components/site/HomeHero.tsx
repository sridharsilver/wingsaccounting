import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Star, CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/hero-print.jpg";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="relative mx-auto max-w-7xl px-12 md:px-20 pt-10 md:pt-20 pb-24 md:pb-32 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs uppercase tracking-widest rounded-full glass text-gradient-brand mb-10">
            <Sparkles size={14} className="text-brand" /> From Print to Pixel
          </span>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.15] text-gradient pb-2 drop-shadow-sm">
            Premium printing<br />& design that <span className="text-gradient-brand">moves brands</span>
          </h1>
          <p className="mt-6 text-muted-foreground md:text-lg max-w-xl">
            Wings Design Studio is a full-service studio crafting commercial printing, brand identities and digital experiences for ambitious teams.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-brand text-brand-foreground font-medium shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all">
              Get a Quote <ArrowRight size={18} />
            </Link>
            <Link to="/portfolio" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass shadow-elegant hover:scale-[1.02] active:scale-[0.98] hover:bg-white/10 transition-all">
              View Portfolio
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
            {[["12+", "Years"], ["500+", "Brands"], ["1.2k", "Projects"]].map(([n, l]) => (
              <div key={l}>
                <div className="text-2xl md:text-3xl font-bold text-gradient-brand">{n}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{l}</div>
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.8, delay: 0.2 }} 
          className="relative lg:ml-auto"
        >
          {/* Background Glows */}
          <div className="absolute -inset-10 bg-gradient-brand opacity-20 blur-[100px] rounded-full animate-pulse" />
          <div className="absolute -top-20 -right-20 size-64 bg-brand-purple/20 blur-[80px] rounded-full" />
          
          {/* Floating Badges */}
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -left-6 z-20 glass p-4 rounded-2xl shadow-glow flex items-center gap-3"
          >
            <div className="size-10 rounded-xl bg-gradient-brand grid place-items-center text-brand-foreground shadow-glow">
              <Star size={20} fill="currentColor" />
            </div>
            <div>
              <div className="text-sm font-bold">5.0 Rating</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Rated Studio</div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }} 
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-10 -right-6 z-20 glass p-4 rounded-2xl shadow-elegant flex items-center gap-3"
          >
            <div className="size-10 rounded-xl bg-surface-elevated grid place-items-center text-brand shadow-sm">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-sm font-bold">Quality First</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Verified Delivery</div>
            </div>
          </motion.div>

          {/* Main Image Container */}
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-elegant border border-white/10 bg-white/5 p-3 backdrop-blur-sm group">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand/10 via-transparent to-brand-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <img 
              src={heroImg} 
              alt="Premium printed materials" 
              width={1536} 
              height={1024} 
              className="w-full h-auto rounded-[2rem] shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]" 
            />
            
            {/* Overlay Glass Tag */}
            <div className="absolute bottom-8 left-8 right-8 p-4 glass rounded-2xl flex items-center justify-between opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-brand animate-pulse" />
                <span className="text-xs font-medium uppercase tracking-widest">Premium Offset Press</span>
              </div>
              <div className="text-[10px] font-bold text-brand">EST. 2012</div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-4 -left-4 size-20 rounded-full border border-white/10 glass opacity-50 blur-sm" />
        </motion.div>
      </div>
    </section>
  );
}
