import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/919951979988?text=Hello%20Wings%20Graphics%2C%20I%27m%20interested%20in%20your%20services."
      target="_blank"
      rel="noopener"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-40 size-14 rounded-full grid place-items-center bg-gradient-brand text-brand-foreground shadow-glow hover:scale-110 transition-transform animate-float"
    >
      <MessageCircle size={24} />
    </a>
  );
}
