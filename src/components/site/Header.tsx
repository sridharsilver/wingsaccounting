import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";
import { Logo } from "../ui/Logo";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [path]);

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-4"}`}>
      <div className={`mx-auto max-w-7xl container-px`}>
        <nav className={`flex items-center justify-between rounded-2xl px-4 md:px-6 py-3 transition-all duration-300 ${scrolled || open ? "glass shadow-elegant" : ""}`}>
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-12 md:h-11" />
          </Link>
          <ul className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => {
              const active = path === n.to;
              return (
                <li key={n.to}>
                  <Link to={n.to} className={`px-3.5 py-2 text-sm rounded-lg transition-colors ${active ? "text-foreground bg-foreground/5" : "text-muted-foreground hover:text-foreground"}`}>
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <Link to="/contact" className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90 transition">
              Get a Quote
            </Link>
          </div>
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setOpen((v) => !v)} className="p-2 rounded-md text-foreground" aria-label="Menu">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
        {open && (
          <div className="lg:hidden mt-2 glass rounded-2xl p-4 space-y-1">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="block px-3 py-2.5 rounded-lg text-sm hover:bg-foreground/5">{n.label}</Link>
            ))}
            <Link to="/contact" className="block mt-2 text-center px-4 py-2.5 rounded-lg bg-gradient-brand text-brand-foreground font-medium">Get a Quote</Link>
          </div>
        )}
      </div>
    </header>
    </>
  );
}
