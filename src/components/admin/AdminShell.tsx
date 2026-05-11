import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Image, Briefcase, FileText, MessageSquare, Star, Palette, Settings, Bell, Search, Menu, X, LogOut, Users, Shield } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";
import { Logo } from "../ui/Logo";
import { supabase } from "@/lib/supabase";
import { LocalNotifications } from '@capacitor/local-notifications';

const NAV_GROUPS = [
  {
    label: "Management",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/admin/portfolio", label: "Portfolio", icon: Image, permission: "portfolio" },
      { to: "/admin/services", label: "Services", icon: Briefcase, permission: "services" },
      { to: "/admin/blog", label: "Blog", icon: FileText, permission: "blog" },
      { to: "/admin/enquiries", label: "Enquiries", icon: MessageSquare, badge: "newEnquiriesCount", permission: "enquiries" },
      { to: "/admin/team", label: "Team", icon: Users, permission: "team" },
      { to: "/admin/testimonials", label: "Testimonials", icon: Star, permission: "testimonials" },
    ]
  },
  {
    label: "System",
    items: [
      { to: "/admin/users", label: "User Management", icon: Shield, permission: "users" },
      { to: "/admin/profile", label: "Profile Settings", icon: Settings },
      { to: "/admin/style-guide", label: "Style Guide", icon: Palette, permission: "style-guide" },
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
  
  const [newEnquiries, setNewEnquiries] = useState<any[]>([]);
  const [newEnquiriesCount, setNewEnquiriesCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const permissions = await LocalNotifications.checkPermissions();
        if (permissions.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
        await LocalNotifications.createChannel({
          id: 'enquiries',
          name: 'New Enquiries',
          importance: 5,
        });
      } catch (err) {
        console.error("Local notifications error", err);
      }
    };
    initNotifications();

    fetchNewEnquiries();

    const channel = supabase
      .channel('public:enquiries_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'enquiries' },
        (payload) => {
          console.log("Global new enquiry:", payload);
          LocalNotifications.schedule({
            notifications: [
              {
                title: "New Enquiry Received!",
                body: `${payload.new.name} is interested in ${payload.new.subject || 'your services'}`,
                id: Math.floor(Date.now() / 1000),
                channelId: 'enquiries',
              }
            ]
          }).catch(err => console.error("Error scheduling notification", err));
          fetchNewEnquiries();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enquiries' },
        () => fetchNewEnquiries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchNewEnquiries() {
    const { data, count, error } = await supabase
      .from('enquiries')
      .select('*', { count: 'exact' })
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (!error && data) {
      setNewEnquiries(data);
      setNewEnquiriesCount(count || 0);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-80 lg:w-64 border-r border-border bg-surface transform transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-border">
          <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <Logo className="h-10 lg:h-9" />
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden p-2 rounded-xl hover:bg-foreground/5 text-muted-foreground"><X size={24} /></button>
        </div>
        <nav className="p-3 space-y-6">
          {NAV_GROUPS.map((group) => {
            const isSuperAdmin = user?.full_name === "Sridhar Silver";
            const filteredItems = group.items.filter(item => {
              if (!item.permission || isSuperAdmin) return true;
              return Array.isArray(user?.permissions) && user.permissions.includes(item.permission);
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-1.5">
                <div className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {filteredItems.map((n) => {
                    const active = isActive(n.to, n.exact);
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition ${active ? "bg-gradient-brand text-brand-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"}`}
                      >
                        <n.icon size={16} /> <span className="flex-1">{n.label}</span>
                        {n.badge === "newEnquiriesCount" && newEnquiriesCount > 0 && (
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${active ? 'bg-white text-brand' : 'bg-brand text-white'}`}>
                            {newEnquiriesCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="absolute bottom-4 inset-x-3 space-y-2">
          <button 
            onClick={() => {
              handleSignOut();
              setOpen(false);
            }} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-semibold"
          >
            <LogOut size={16} /> Sign Out
          </button>
          <Link to="/" onClick={() => setOpen(false)} className="block text-center px-4 py-3 text-sm rounded-xl glass text-muted-foreground hover:text-foreground font-semibold">← Back to website</Link>
        </div>
      </aside>
      
      {/* Sidebar Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setOpen(false)}
        />
      )}


      <div className="lg:pl-64">
        <header className="h-16 sticky top-0 z-30 border-b border-border bg-surface/70 backdrop-blur-xl flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2.5 rounded-xl hover:bg-foreground/5 text-muted-foreground"><Menu size={24} /></button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg glass w-80">
              <Search size={16} className="text-muted-foreground" />
              <input className="bg-transparent outline-none text-sm w-full" placeholder="Search…" />
            </div>
          </div>
          <div className="flex items-center gap-3 relative">
            <ThemeToggle />
            
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="size-9 grid place-items-center rounded-full glass hover:bg-foreground/10 relative" 
                aria-label="Notifications"
              >
                <Bell size={16} />
                {newEnquiriesCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                    {newEnquiriesCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-surface border border-border shadow-xl rounded-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="p-3 border-b border-border bg-foreground/5 font-semibold text-sm flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      Notifications
                      {newEnquiriesCount > 0 && <span className="text-xs text-brand bg-brand/10 px-2 py-0.5 rounded-full">{newEnquiriesCount} New</span>}
                    </div>
                    <button 
                      onClick={() => setShowNotifications(false)} 
                      className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-foreground/10 transition-colors"
                      title="Close notifications"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {newEnquiries.length > 0 ? (
                      newEnquiries.map(enq => (
                        <Link 
                          key={enq.id} 
                          to="/admin/enquiries" 
                          onClick={() => setShowNotifications(false)}
                          className="block p-3 border-b border-border hover:bg-foreground/5 transition-colors"
                        >
                          <div className="text-sm font-medium">{enq.name}</div>
                          <div className="text-xs text-brand font-medium mt-0.5">{enq.subject || "New Enquiry"}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{enq.message}</div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No new notifications.
                      </div>
                    )}
                  </div>
                  <Link 
                    to="/admin/enquiries" 
                    onClick={() => setShowNotifications(false)}
                    className="block p-3 text-center text-xs font-medium text-brand hover:bg-foreground/5 bg-surface transition-colors"
                  >
                    View all enquiries
                  </Link>
                </div>
              )}
            </div>

            <Link 
              to="/admin/profile" 
              className="size-9 rounded-full bg-gradient-brand grid place-items-center text-brand-foreground text-xs font-semibold hover:brightness-110 transition-all shadow-glow overflow-hidden"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.full_name?.[0] || user?.email?.[0] || "W").toUpperCase()
              )}
            </Link>
          </div>
        </header>
        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
