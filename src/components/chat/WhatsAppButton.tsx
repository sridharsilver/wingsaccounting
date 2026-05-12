import React from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

import { useSiteSettings } from "@/hooks/use-site-settings";

export const WhatsAppButton: React.FC = () => {
  const { settings } = useSiteSettings();
  const phoneNumber = settings.whatsapp_number || "919951979988";
  const message = encodeURIComponent("Hi Wings Design Studio! I'm interested in your services.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <div className={cn(
      "fixed bottom-6 z-[100] pointer-events-none transition-all duration-500",
      settings.show_chatbot ? "left-6" : "right-6"
    )}>
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1, x: 5 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center shadow-lg pointer-events-auto",
          "bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white",
          "border-2 border-white/20 relative group"
        )}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-[#25D366] blur-md opacity-0 group-hover:opacity-40 transition-opacity animate-pulse" />
        
        {/* Icon */}
        <MessageSquare size={24} className="relative z-10" />
        
        {/* Label on hover - Dynamic positioning */}
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-black/80 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none backdrop-blur-md border border-white/10",
          settings.show_chatbot 
            ? "left-full ml-3 group-hover:translate-x-0 -translate-x-2" 
            : "right-full mr-3 group-hover:translate-x-0 translate-x-2"
        )}>
          Chat on WhatsApp
        </div>

        {/* Pulse ring */}
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-full bg-[#25D366]/50"
        />
      </motion.a>
    </div>
  );
};
