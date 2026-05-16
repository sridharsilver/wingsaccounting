import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Briefcase, FileText, Settings, Search, Menu, X, LogOut, Users, ShieldCheck, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";
import { Logo } from "../ui/Logo";
import { supabase } from "@/lib/supabase";

const NAV_GROUPS = [
  {
    label: "Sales",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/invoices", label: "Invoices", icon: FileText },
      { to: "/quotations", label: "Quotations", icon: FileText },
    ]
  },
  {
    label: "Management",
    items: [
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/products", label: "Products & Services", icon: Briefcase },
    ]
  },
  {
    label: "Analysis",
    items: [
      { to: "/reports", label: "Reports", icon: LayoutDashboard },
    ]
  },
  {
    label: "System",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/profile", label: "Profile", icon: Users },
      { to: "/users", label: "User Management", icon: ShieldCheck, adminOnly: true },
    ]
  }
];

export function AdminShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { theme } = useTheme();
  const isActive = (to: string, exact?: boolean) => exact ? path === to : path === to || path.startsWith(to + "/");
  
  useEffect(() => {
    async function getProfile(userId: string) {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (data) {
        setUser(data);
        console.log("Current user role:", data.role); // Added logging to help debug
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/login" });
      } else {
        getProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate({ to: "/login" });
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        getProfile(session?.user?.id || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'dark bg-background text-foreground' : 'bg-background text-foreground'}`}>
      {/* Mobile Sidebar Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-14 px-5 flex items-center justify-between border-b border-border shrink-0">
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 group">
            <div className="size-8 rounded-xl bg-gradient-brand shadow-glow grid place-items-center group-hover:scale-105 transition-transform">
              <Logo className="size-4 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-base tracking-tighter uppercase leading-none">Wings</span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-muted-foreground/60 uppercase">Accounting</span>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden p-2 hover:bg-foreground/5 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
          {NAV_GROUPS.map((group) => {
            const filteredItems = group.items.filter(item => !item.adminOnly || isAdmin);
            if (filteredItems.length === 0) return null;

            return (
              <div key={group.label}>
                <div className="px-3 mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{group.label}</div>
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                        ${isActive(item.to, item.exact) 
                          ? "bg-gradient-brand text-brand-foreground shadow-glow" 
                          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}
                      `}
                    >
                      <item.icon size={18} className={`transition-transform duration-300 ${isActive(item.to, item.exact) ? "scale-110" : "group-hover:scale-110 opacity-70 group-hover:opacity-100"}`} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all group"
          >
            <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sticky top-0 z-30 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setOpen(true)} className="p-2.5 hover:bg-foreground/5 rounded-xl transition-colors lg:hidden">
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground/5 border border-border text-muted-foreground group focus-within:ring-2 focus-within:ring-brand focus-within:bg-background transition-all">
              <Search size={16} className="group-focus-within:text-brand" />
              <input type="text" placeholder="Quick search..." className="bg-transparent border-none text-sm outline-none w-48 lg:w-64" />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            <ThemeToggle />
            <div className="h-8 w-px bg-border mx-1 hidden sm:block" />
            <Link 
              to="/profile" 
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-foreground/5 transition-all group"
            >
              <div className="size-9 sm:size-8 rounded-xl bg-gradient-brand grid place-items-center text-brand-foreground font-bold text-xs shadow-glow group-hover:scale-105 transition-transform overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (user?.full_name?.[0] || user?.email?.[0] || "A").toUpperCase()
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1 mb-0.5">
                  {isSuperAdmin && <Crown size={10} className="text-yellow-500 fill-yellow-500" />}
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
                    {user?.role === 'super_admin' ? "Super Admin" : user?.role === 'admin' ? "Admin" : "Member"}
                  </div>
                </div>
                <div className="text-xs font-bold leading-none truncate max-w-[100px]">{user?.full_name || "Account"}</div>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background/40 overflow-x-hidden overflow-y-auto pb-28 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation - Premium App-like Feel */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 h-18 bg-surface/80 backdrop-blur-xl border border-border/50 shadow-2xl z-50 px-2 flex items-center justify-between rounded-3xl safe-area-pb">
        {[
          NAV_GROUPS[0].items[0], // Dashboard
          NAV_GROUPS[0].items[1], // Invoices
          NAV_GROUPS[3].items[2], // User Management (Moved to System)
          NAV_GROUPS[3].items[0]  // Settings
        ].map((item) => {
          if (!item) return null;
          if (item.adminOnly && !isAdmin) return null;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all relative ${active ? "text-brand" : "text-muted-foreground"}`}
            >
              {active && (
                <motion.div 
                  layoutId="bottomNav"
                  className="absolute -top-1 w-8 h-1 bg-brand rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className={`p-2 rounded-2xl transition-all duration-300 ${active ? "bg-brand/10 scale-110" : "hover:bg-foreground/5"}`}>
                <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter transition-all ${active ? "opacity-100 scale-105" : "opacity-60"}`}>
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
