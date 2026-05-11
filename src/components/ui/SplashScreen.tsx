import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { useEffect, useState } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Allow exit animation to finish
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0d0d0d]"
        >
          {/* Ambient Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: "easeOut",
                delay: 0.2
              }}
              className="mb-8"
            >
              <Logo className="h-16" />
            </motion.div>

            {/* Premium Loading Bar */}
            <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ 
                  duration: 2, 
                  ease: "easeInOut",
                  repeat: Infinity
                }}
                className="absolute inset-0 w-1/2 bg-gradient-brand shadow-[0_0_8px_rgba(var(--brand),0.5)]"
              />
            </div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold"
            >
              From Print to Pixel
            </motion.p>
          </div>

          <div className="absolute bottom-10 text-[10px] text-muted-foreground/30 font-medium tracking-widest uppercase">
            Wings Design Studio — 2026
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
