import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, UserPlus, Mail, Shield, Trash2, Edit2, Search, Crown, AlertTriangle, RefreshCcw, Users } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    full_name: "",
    role: "user"
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
        setCurrentUser(profile);
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) throw error;
      console.log("Users fetched for management table:", data);
      setUsers(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;
      toast.success(`Clearance updated to ${newRole}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("ARE YOU SURE? This action will revoke all system access for this user.")) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      toast.success("Personnel record expunged");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      // In a real production app, you would use a Supabase Edge Function with Service Role 
      // or inviteUserByEmail via the Admin API. 
      // For now, we'll try to use the invite method if available, or warn the user.
      
      const { error } = await supabase.auth.admin.inviteUserByEmail(newUserData.email, {
        data: {
          full_name: newUserData.full_name,
          role: newUserData.role
        }
      });

      if (error) {
        if (error.message.includes("service_role")) {
          toast.error("Admin API requires Service Role. Please use the Supabase Dashboard to invite users for now, or set up an Edge Function.");
        } else {
          throw error;
        }
      } else {
        toast.success(`Invitation sent to ${newUserData.email}`);
        setIsAddDialogOpen(false);
        setNewUserData({ email: "", full_name: "", role: "user" });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setInviting(false);
    }
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const filteredUsers = users.filter(u => {
    const s = search.toLowerCase();
    const name = (u.full_name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const role = (u.role || "").toLowerCase();
    return name.includes(s) || email.includes(s) || role.includes(s);
  });

  console.log("Filtered users count:", filteredUsers.length);

  const columns = [
    { 
      key: "full_name", 
      label: "User Profile",
      format: (val: string, item: any) => (
        <div className="flex items-center gap-3 text-left">
          <div className="size-10 rounded-2xl bg-brand/10 grid place-items-center text-brand font-bold text-sm relative overflow-hidden shrink-0 border border-brand/5 shadow-inner">
            {item.avatar_url ? (
              <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (val?.[0] || item.email?.[0] || "U").toUpperCase()
            )}
            {item.role === 'super_admin' && (
              <div className="absolute top-0 right-0 p-0.5 bg-yellow-500">
                <Crown size={8} className="text-white fill-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold flex items-center gap-2 truncate text-sm">
              {val || item.email || "Unnamed User"}
              {item.id === currentUser?.id && <span className="text-[8px] px-1.5 py-0.5 rounded bg-brand/10 text-brand font-black uppercase tracking-tighter">You</span>}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground/60">
              <Mail size={10} />
              <span className="text-[10px] font-medium truncate">{item.email || "No email linked"}</span>
            </div>
          </div>
        </div>
      )
    },
    { 
      key: "role", 
      label: "Clearance",
      format: (val: string) => {
        const isSA = val === 'super_admin';
        const isAdmin = val === 'admin';
        return (
          <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 w-fit border ${
            isSA ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 
            isAdmin ? 'bg-brand/10 text-brand border-brand/20' : 
            'bg-foreground/5 text-muted-foreground border-border'
          }`}>
            {isSA && <Crown size={10} />}
            {val || 'Member'}
          </span>
        );
      }
    },
    { 
      key: "updated_at", 
      label: "Last Active",
      format: (val: string) => (
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {val ? new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="relative">
          <div className="size-20 border-4 border-brand/10 border-t-brand rounded-full animate-spin" />
          <div className="size-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-background rounded-full">
            <Logo className="size-6 text-brand" />
          </div>
        </div>
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Authorizing Connection...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader 
        title="Command Center" 
        subtitle="Personnel Status: Secure" 
        icon={Shield} 
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={fetchData}
              variant="outline"
              className="rounded-2xl border-border bg-surface hover:bg-foreground/5 font-bold uppercase tracking-widest text-[10px] gap-2 h-11 px-6"
            >
              <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
              Sync Data
            </Button>

            {isSuperAdmin && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-2xl bg-gradient-brand text-white shadow-glow font-bold uppercase tracking-widest text-[10px] gap-2 h-11 px-6">
                    <UserPlus size={16} />
                    Add Personnel
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-white/10 rounded-[2rem] sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Invite Personnel</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-widest opacity-60">Full Identity Name</Label>
                      <Input 
                        id="full_name" 
                        value={newUserData.full_name}
                        onChange={(e) => setNewUserData({...newUserData, full_name: e.target.value})}
                        placeholder="e.g. John Wick" 
                        className="rounded-xl bg-foreground/5 border-border font-bold h-12"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-60">Secure Email Address</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                        placeholder="john@example.com" 
                        className="rounded-xl bg-foreground/5 border-border font-bold h-12"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Clearance Level</Label>
                      <Select 
                        value={newUserData.role} 
                        onValueChange={(v) => setNewUserData({...newUserData, role: v})}
                      >
                        <SelectTrigger className="rounded-xl bg-foreground/5 border-border font-bold h-12">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10 rounded-xl">
                          <SelectItem value="user" className="font-bold">Member (Basic)</SelectItem>
                          <SelectItem value="admin" className="font-bold">Administrator</SelectItem>
                          <SelectItem value="super_admin" className="font-bold text-yellow-500">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button 
                        type="submit" 
                        disabled={inviting}
                        className="w-full rounded-xl bg-gradient-brand text-white shadow-glow font-black uppercase tracking-[0.2em] h-12"
                      >
                        {inviting ? <Loader2 className="animate-spin" /> : "Dispatch Invitation"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-[2rem] p-2 flex items-center border border-white/5 shadow-elegant group focus-within:ring-2 focus-within:ring-brand/30 transition-all bg-surface/50">
            <div className="pl-5 pr-3 text-muted-foreground group-focus-within:text-brand transition-colors">
              <Search size={22} />
            </div>
            <input 
              type="text" 
              placeholder="Search by name, email or clearance level..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none py-4 outline-none font-bold text-sm"
            />
          </div>

          <DataTable 
            data={filteredUsers} 
            columns={columns}
            emptyMessage="No personnel records matching your query"
            icon={Users}
            actions={(item) => (
              <div className="flex items-center gap-2">
                {isSuperAdmin && currentUser && item.id !== currentUser.id && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-2xl hover:bg-brand/10 hover:text-brand transition-all border border-transparent hover:border-brand/20"
                      onClick={() => {
                        const roles = ['user', 'admin', 'super_admin'];
                        const currentIdx = roles.indexOf(item.role || 'user');
                        const nextRole = roles[(currentIdx + 1) % roles.length];
                        handleUpdateRole(item.id, nextRole);
                      }}
                      title="Rotate Clearance"
                    >
                      <Shield size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                      onClick={() => handleDeleteUser(item.id)}
                      title="Expunge Record"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </>
                )}
              </div>
            )}
          />
        </div>

        <div className="space-y-6">
          <div className="glass rounded-[2rem] p-8 border border-white/10 relative overflow-hidden shadow-elegant bg-surface/50">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
              <Crown className="text-yellow-500" size={24} />
              Admin Profile
            </h3>
            <div className="space-y-6 relative z-10">
              <div className="p-6 rounded-3xl bg-surface border border-white/5 shadow-inner">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Personnel Identity</div>
                <div className="font-black text-2xl tracking-tighter mb-1 truncate">{currentUser?.full_name || "Accessing..."}</div>
                <div className="text-xs text-muted-foreground font-medium mb-4 flex items-center gap-2 truncate">
                  <Mail size={12} /> {currentUser?.email}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-yellow-500/10 text-yellow-600 text-[10px] font-black uppercase tracking-[0.2em] border border-yellow-500/20">
                  <Crown size={12} /> {currentUser?.role?.replace('_', ' ')}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 opacity-70">
                  <Shield size={14} /> Core Permissions
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Personnel Rotation Authority",
                    "Security Protocol Override",
                    "Global Audit Access"
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-foreground/[0.02] border border-border/50 text-[10px] font-black uppercase tracking-widest">
                      <div className="size-1.5 rounded-full bg-brand shadow-glow" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-red-500/5 border border-red-500/10 flex gap-4 items-start shadow-sm">
            <div className="size-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-black text-xs text-red-500 uppercase tracking-widest mb-1">Clearance Warning</h4>
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                Changes to clearance levels take effect immediately across all system nodes. This action is audited.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
