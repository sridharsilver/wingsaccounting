import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, MessageCircle, Instagram, Facebook, Linkedin, Twitter, Send, ChevronDown } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { formatWhatsAppNumber, cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Wings Design Studio" },
      { name: "description", content: "Get in touch with Wings Design Studio for printing, branding and website design enquiries." },
      { property: "og:title", content: "Contact Wings Design Studio" },
      { property: "og:description", content: "Tell us about your project." },
    ],
  }),
  component: ContactPage,
});

const COUNTRIES = [
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+1", label: "USA", flag: "🇺🇸" },
  { code: "+44", label: "UK", flag: "🇬🇧" },
  { code: "+971", label: "UAE", flag: "🇦🇪" },
  { code: "+966", label: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+61", label: "Australia", flag: "🇦🇺" },
  { code: "+65", label: "Singapore", flag: "🇸🇬" },
  { code: "+49", label: "Germany", flag: "🇩🇪" },
];

function ContactPage() {
  const { settings } = useSiteSettings();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");

  useEffect(() => {
    async function fetchServices() {
      const { data, error } = await supabase
        .from("services")
        .select("title")
        .eq("status", "live")
        .order("title");
      if (data) setServices(data);
    }
    fetchServices();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const phone = data.get("phone") as string;
    
    // Combine selected country code with the entered phone number for the database
    const finalPhone = phone ? `${selectedCountry.code} ${phone.trim()}` : "";

    const serviceValue = data.get("service") as string;
    const customServiceValue = data.get("custom_service") as string;
    const finalService = serviceValue === "other" ? customServiceValue : serviceValue;

    const newFormData = {
      name: data.get("name"),
      email: data.get("email"),
      phone: finalPhone,
      subject: finalService,
      message: data.get("message"),
      status: "new",
    };

    setFormData(newFormData);
    setShowChoice(true);
  };

  const handleProceed = async (method: 'whatsapp' | 'email') => {
    setLoading(true);
    setShowChoice(false);

    try {
      const { error } = await supabase.from("enquiries").insert([formData]);
      if (error) throw error;

      if (method === 'whatsapp') {
        const rawWaNumber = settings.whatsapp_number || "919951979988";
        const waNumber = formatWhatsAppNumber(rawWaNumber);
        const defaultMsg = settings.whatsapp_message || "Hi Wings Design Studio! I'm interested in your services.";
        const waMessage = `${defaultMsg}\n\nMy name is ${formData.name}. I'm interested in ${formData.subject || 'your services'}.\n\nMessage: ${formData.message}`;
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
                  <Field 
                    label="Phone" 
                    name="phone" 
                    type="tel"
                    placeholder="99519 79988" 
                    prefix={
                      <CountryCodeSelector 
                        selected={selectedCountry} 
                        onSelect={setSelectedCountry} 
                      />
                    }
                  />
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">Service</label>
                    <div className="relative mt-2">
                      <ServiceSelector 
                        services={services} 
                        selected={selectedService} 
                        onSelect={setSelectedService} 
                      />
                      <input type="hidden" name="service" value={selectedService} required />
                    </div>
                  </div>
                </div>

                {selectedService === "other" && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <Field label="Custom Service" name="custom_service" placeholder="Please specify your requirement" required />
                  </motion.div>
                )}
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Message</label>
                  <textarea name="message" required rows={5} className="mt-2 w-full rounded-xl glass px-4 py-3 outline-none focus:ring-2 ring-brand/50 bg-transparent" />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-brand text-brand-foreground font-medium shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
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

            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className="flex-1 flex flex-col gap-4">
                <Info icon={MapPin} t="Studio" d={settings.studio_address || "SRT 12, Sanath Nagar, Hyderabad, TS 500018"} />
                <Info icon={Phone} t="Phone" d={settings.contact_phone || "+91 9951979988"} />
                <Info icon={Mail} t="Email" d={settings.contact_email || "hello@wingsgraphics.in"} />
                <Info icon={Clock} t="Hours" d={settings.working_hours || "Mon–Sat · 10:00 — 19:00"} />
              </div>

              <a 
                href={`https://wa.me/${formatWhatsAppNumber(settings.whatsapp_number || "919951979988")}?text=${encodeURIComponent(settings.whatsapp_message || "")}`} 
                target="_blank" 
                rel="noopener" 
                className="flex items-center justify-between p-6 rounded-3xl bg-gradient-to-br from-[#25D366] to-[#075E54] text-white shadow-xl shadow-green-500/20 hover:shadow-green-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-all duration-500">
                    <MessageCircle size={28} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.2em] opacity-80 font-black">Instant Quotes</span>
                    <span className="font-bold text-xl tracking-tight">Chat on WhatsApp</span>
                  </div>
                </div>
                <div className="size-10 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform backdrop-blur-sm border border-white/10">
                  <span className="text-xl">→</span>
                </div>
              </a>

              <div className="flex items-center gap-3 px-2">
                <SocialIcon icon={Instagram} href={settings.social_instagram} label="instagram" brandColor="#E4405F" />
                <SocialIcon icon={Facebook} href={settings.social_facebook} label="facebook" brandColor="#1877F2" />
                <SocialIcon icon={Linkedin} href={settings.social_linkedin} label="linkedin" brandColor="#0A66C2" />
                <SocialIcon icon={Twitter} href={settings.social_twitter} label="twitter" brandColor="#1DA1F2" />
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

function Field({ label, prefix, ...props }: { label: string; prefix?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative mt-2">
        {prefix && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center z-20">
            {prefix}
            <div className="h-6 w-[1px] bg-white/10 mx-1" />
          </div>
        )}
        <input 
          {...props} 
          className={cn(
            "w-full rounded-xl glass py-3 outline-none focus:ring-2 ring-brand/50 bg-transparent relative z-10",
            prefix ? "pl-28 pr-4" : "px-4"
          )} 
        />
      </div>
    </div>
  );
}

function ServiceSelector({ services, selected, onSelect }: { services: any[]; selected: string; onSelect: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const displayValue = selected === "other" ? "Other / Custom Service" : (selected || "Select a service");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between rounded-xl glass px-4 py-3 outline-none focus:ring-2 ring-brand/50 bg-transparent text-left transition-all hover:bg-white/5"
      >
        <span className={cn("truncate pr-4", !selected && "text-muted-foreground")}>{displayValue}</span>
        <ChevronDown size={16} className={cn("transition-transform duration-200 text-muted-foreground shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[999] cursor-default" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }} 
          />
          <div className="absolute left-0 right-0 top-full mt-2 z-[1000] max-h-64 overflow-y-auto glass border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 space-y-1">
              {services.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(s.title);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/10 active:scale-[0.98] text-left",
                    selected === s.title ? "bg-brand/10 text-brand font-bold" : "text-foreground"
                  )}
                >
                  {s.title}
                </button>
              ))}
              <div className="h-[1px] bg-white/5 my-1" />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect("other");
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/10 active:scale-[0.98] text-left italic",
                  selected === "other" ? "bg-brand/10 text-brand font-bold" : "text-brand/80"
                )}
              >
                Other / Custom Service
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CountryCodeSelector({ selected, onSelect }: { selected: typeof COUNTRIES[0]; onSelect: (c: typeof COUNTRIES[0]) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative h-full">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="h-full px-4 flex items-center gap-2 hover:bg-white/5 transition-colors rounded-l-xl text-sm font-medium focus:outline-none"
      >
        <span className="text-base">{selected.flag}</span>
        <span>{selected.code}</span>
        <ChevronDown size={14} className={cn("transition-transform duration-200 text-muted-foreground", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[999] cursor-default" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }} 
          />
          <div className="absolute left-0 top-full mt-2 z-[1000] w-52 max-h-64 overflow-y-auto glass border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 space-y-1">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(c);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/10 active:scale-[0.98]",
                    selected.code === c.code ? "bg-brand/10 text-brand font-bold" : "text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{c.flag}</span>
                    <span>{c.label}</span>
                  </div>
                  <span className="text-muted-foreground text-xs font-mono">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Info({ icon: Icon, t, d }: { icon: React.ElementType; t: string; d: string }) {
  return (
    <motion.div 
      whileHover={{ x: 5 }}
      className="flex items-start gap-4 p-5 rounded-2xl glass border border-white/5 hover:border-brand/30 transition-all duration-300 group"
    >
      <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-brand shrink-0 group-hover:scale-110 group-hover:bg-brand/10 group-hover:text-brand transition-all duration-500 border border-white/5">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-1">{t}</div>
        <div className="font-semibold text-sm leading-relaxed group-hover:text-foreground transition-colors line-clamp-2">{d}</div>
      </div>
    </motion.div>
  );
}

function SocialIcon({ icon: Icon, href, label, brandColor }: { icon: React.ElementType; href?: string; label: string; brandColor: string }) {
  if (!href) return null;
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      whileHover={{ y: -4, scale: 1.1 }}
      className="size-12 grid place-items-center rounded-2xl glass border border-white/5 transition-all duration-300 relative group overflow-hidden"
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300" 
        style={{ backgroundColor: brandColor }}
      />
      <Icon size={20} className="relative z-10 transition-colors duration-300 group-hover:text-white" />
      <div 
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-full group-hover:translate-y-0"
        style={{ backgroundColor: brandColor }}
      />
    </motion.a>
  );
}
