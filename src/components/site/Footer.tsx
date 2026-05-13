import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin, Twitter } from "lucide-react";
import { Logo } from "../ui/Logo";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function Footer() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { settings, loading } = useSiteSettings();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <footer className="mt-12 md:mt-16 border-t border-border bg-surface/50">
      <div className="mx-auto max-w-7xl container-px py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="inline-block mb-4">
            <Logo className="h-11" />
          </Link>
          <p className="text-sm text-muted-foreground max-w-sm">
            From print to pixel — Wings Design Studio crafts premium printing, branding and digital experiences for ambitious brands.
          </p>
          <div className="flex gap-3 mt-5">
            {[Instagram, Facebook, Linkedin, Twitter].map((Icon, i) => (
              <a key={i} href="#" className="size-9 grid place-items-center rounded-full glass hover:bg-gradient-brand transition" aria-label="social">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link to="/portfolio" className="hover:text-foreground">Portfolio</Link></li>
            <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            {isAdmin && (
              <li><Link to="/admin" className="text-[10px] text-muted-foreground/30 hover:text-brand transition">Admin (Dev Only)</Link></li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 text-brand shrink-0" /> 
              <span>{settings.studio_address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-brand shrink-0" /> 
              <span>{settings.contact_phone}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="text-brand shrink-0" /> 
              <span>{settings.contact_email}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Wings Design Studio. All rights reserved.
      </div>
    </footer>
  );
}
