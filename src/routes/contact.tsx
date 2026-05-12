import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, MessageCircle, Instagram, Facebook, Linkedin, Twitter, Send } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Wings Graphics" },
      { name: "description", content: "Get in touch with Wings Graphics for printing, branding and website design enquiries." },
      { property: "og:title", content: "Contact Wings Graphics" },
      { property: "og:description", content: "Tell us about your project." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { settings } = useSiteSettings();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setFormData({
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone"),
      subject: data.get("service"),
      message: data.get("message"),
      status: "new",
    });
    setShowChoice(true);
  };

  const handleProceed = async (method: 'whatsapp' | 'email') => {
    setLoading(true);
    setShowChoice(false);

    try {
      const { error } = await supabase.from("enquiries").insert([formData]);
      if (error) throw error;

      if (method === 'whatsapp') {
        const waNumber = settings.whatsapp_number || "919951979988";
        const waMessage = `Hi Wings Graphics! My name is ${formData.name}. I'm interested in ${formData.subject || 'your services'}.\n\nMessage: ${formData.message}`;
        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
        window.open(waUrl, "_blank");
      }

      setSent(true);
    } catch (err: any) {
      alert(err.message || "Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title="Let's make something premium."
        desc="Tell us about your project — we'll respond within one business day."
      />

      <Section>
        <div className="grid lg:grid-cols-5 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-3 rounded-3xl glass shadow-elegant p-8 flex flex-col">
            {!settings.show_enquiry_form ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 min-h-[400px] text-center">
                <div className="size-16 rounded-full bg-amber-500/10 grid place-items-center text-amber-500 mb-6"><Clock size={24} /></div>
                <h3 className="text-2xl font-bold mb-3">Enquiries Temporarily Closed</h3>
                <p className="text-muted-foreground max-w-sm">We are currently at full capacity and not taking new projects. Please check back later or reach out via email for urgent matters.</p>
                <div className="mt-8 p-4 rounded-2xl bg-surface/50 border border-border">
                  <p className="text-sm font-medium">Direct Email</p>
                  <a href="mailto:hello@wingsgraphics.in" className="text-brand font-bold">hello@wingsgraphics.in</a>
                </div>
              </div>
            ) : sent ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-500 min-h-[400px]">
                <div className="size-16 rounded-full bg-gradient-brand grid place-items-center text-brand-foreground shadow-glow mb-6"><Send size={24} /></div>
                <h3 className="text-3xl font-bold text-gradient mb-3">Thanks — message received!</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto text-center">We'll get back to you within one business day to discuss your project.</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-10 px-8 py-3 text-sm font-bold rounded-full glass hover:bg-white/5 border border-white/10 transition-all hover:scale-105"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Name" name="name" required />
                  <Field label="Email" name="email" type="email" required />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Phone" name="phone" />
                  <Field label="Service" name="service" placeholder="e.g. Brochure printing" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Message</label>
                  <textarea name="message" required rows={5} className="mt-2 w-full rounded-xl glass px-4 py-3 outline-none focus:ring-2 ring-brand/50 bg-transparent" />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-brand text-brand-foreground font-medium shadow-glow hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Send Message"} <Send size={16} />
                </button>
              </form>
            )}
          </motion.div>

          {/* Choice Modal */}
          {showChoice && (
            <div className="fixed inset-0 z-[100] grid place-items-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full glass p-8 rounded-3xl border border-white/10 shadow-2xl text-center">
                <div className="size-16 mx-auto rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-6">
                  <MessageCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Almost there!</h3>
                <p className="text-muted-foreground mb-8">How would you like to receive your response? WhatsApp is much faster for instant quotes.</p>

                <div className="grid gap-3">
                  <button
                    onClick={() => handleProceed('whatsapp')}
                    className="w-full py-4 px-6 rounded-2xl bg-[#25D366] text-white font-bold flex items-center justify-center gap-3 hover:brightness-110 transition shadow-lg shadow-[#25D366]/20"
                  >
                    <MessageCircle size={20} /> Send via WhatsApp
                  </button>
                  <button
                    onClick={() => handleProceed('email')}
                    className="w-full py-4 px-6 rounded-2xl glass border border-white/10 font-bold hover:bg-white/5 transition"
                  >
                    Submit via Email
                  </button>
                </div>

                <button onClick={() => setShowChoice(false)} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
                  Go back and edit
                </button>
              </motion.div>
            </div>
          )}

          <div className="lg:col-span-2 grid gap-5">
            <Info icon={MapPin} t="Studio" d="SRT 12, Sanath Nagar, Hyderabad, TS 500018" />
            <Info icon={Phone} t="Phone" d="+91 9951979988" />
            <Info icon={Mail} t="Email" d="hello@wingsgraphics.in" />
            <Info icon={Clock} t="Hours" d="Mon–Sat · 10:00 — 19:00" />
            <a href={`https://wa.me/${settings.whatsapp_number || "919951979988"}`} target="_blank" rel="noopener" className="flex items-center justify-between p-5 rounded-2xl bg-gradient-brand text-brand-foreground shadow-glow font-medium">
              <span className="flex items-center gap-3"><MessageCircle size={20} /> Chat on WhatsApp</span>
              <span>→</span>
            </a>
            <div className="flex gap-3">
              {[Instagram, Facebook, Linkedin, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="size-10 grid place-items-center rounded-full glass hover:bg-white/10" aria-label="social"><Icon size={16} /></a>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {settings.show_contact_map && (
        <Section>
          <div className="rounded-3xl overflow-hidden glass shadow-elegant">
            <iframe
              title="Studio location"
              src="https://maps.google.com/maps?q=7-2-234+Kailash+Nagar,+Balkampet,+Hyderabad,+Telangana+500018&t=&z=16&ie=UTF8&iwloc=&output=embed"
              className="w-full h-[420px] border-0 grayscale-[0.4] contrast-[1.1]"
              loading="lazy"
            />
          </div>
        </Section>
      )}
    </SiteLayout>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input {...props} className="mt-2 w-full rounded-xl glass px-4 py-3 outline-none focus:ring-2 ring-brand/50 bg-transparent" />
    </div>
  );
}

function Info({ icon: Icon, t, d }: { icon: React.ElementType; t: string; d: string }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl glass">
      <div className="size-10 grid place-items-center rounded-xl bg-gradient-brand text-brand-foreground shrink-0"><Icon size={18} /></div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{t}</div>
        <div className="font-medium mt-0.5">{d}</div>
      </div>
    </div>
  );
}
