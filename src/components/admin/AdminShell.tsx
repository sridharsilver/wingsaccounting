import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Briefcase, FileText, Settings, Search, Menu, X, LogOut, Users } from "lucide-react";
import { useState, useEffect } from "react";
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
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (data) setUser(data);
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
        getProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

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
        <div className="p-6 flex items-center justify-between border-b border-border">
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 group">
            <div className="size-10 rounded-xl bg-gradient-brand shadow-glow grid place-items-center group-hover:scale-105 transition-transform">
              <Logo className="size-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter uppercase leading-none">Wings</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground/60 uppercase">Accounting</span>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden p-3 hover:bg-foreground/5 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => (
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
          ))}
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
        {/* Top Header */}
        <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sticky top-0 z-30 lg:px-8">
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
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Admin</div>
                <div className="text-xs font-bold leading-none truncate max-w-[100px]">{user?.full_name || "Account"}</div>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 bg-background/50 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
