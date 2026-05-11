import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, Shield, Mail, Calendar, Trash2, ExternalLink, ShieldCheck, Pencil, User, Phone, Check, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusPill } from "@/components/admin/StatusPill";
import { supabase } from "@/lib/supabase";
import { AdminCard } from "@/components/admin/AdminCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Cropper from "react-easy-crop";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

// Helper to create the cropped image (copied from profile for consistency)
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error("Canvas is empty");
      resolve(blob);
    }, "image/jpeg");
  });
};

function UsersPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  
  // Edit State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  // Crop State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    fetchProfiles();
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setProfiles(data);
    setLoading(false);
  }

  const isSuperAdmin = currentUser?.user_metadata?.full_name === "Sridhar Silver";

  const handleStartEdit = (user: any) => {
    setEditingUser(user);
    setEditName(user.full_name || "");
    setEditPhone(user.phone || "");
    setEditAvatar(user.avatar_url || "");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setImageToCrop(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleConfirmCrop = async () => {
    try {
      setSaving(true);
      if (!imageToCrop || !croppedAreaPixels) return;
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const filePath = `managed-${editingUser.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, croppedBlob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setEditAvatar(publicUrl);
      setImageToCrop(null);
      toast.success("Image cropped!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUser = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editName, phone: editPhone, avatar_url: editAvatar })
      .eq("id", editingUser.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("User updated successfully");
      fetchProfiles();
      setEditingUser(null);
    }
    setSaving(false);
  };

  const columns = ["User", "Email", "Role", "Joined Date", "Actions"];
  
  const rows = profiles.map((p) => [
    <div className="flex items-center gap-3" key={p.id}>
      <div className="size-8 rounded-full bg-gradient-brand flex items-center justify-center text-[10px] font-bold text-brand-foreground overflow-hidden border border-white/5 shadow-sm">
        {p.avatar_url ? (
          <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          (p.full_name?.[0] || p.email?.[0] || "?").toUpperCase()
        )}
      </div>
      <div className="font-medium text-sm">{p.full_name || "New Admin"}</div>
    </div>,
    <span className="text-muted-foreground" key={`e-${p.id}`}>{p.email}</span>,
    <StatusPill key={`r-${p.id}`} tone={p.full_name === "Sridhar Silver" ? "amber" : "blue"}>
      {p.full_name === "Sridhar Silver" ? "Super Admin" : "Admin"}
    </StatusPill>,
    new Date(p.created_at).toLocaleDateString(),
    <div className="flex gap-1" key={`a-${p.id}`}>
      {isSuperAdmin && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-brand hover:bg-brand/10" 
          onClick={() => handleStartEdit(p)}
          title="Edit User"
        >
          <Pencil size={14} />
        </Button>
      )}
      <a href="https://supabase.com/dashboard/project/_/auth/users" target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Open in Supabase">
          <ExternalLink size={14} />
        </Button>
      </a>
    </div>
  ]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        desc="Manage administrative access and permissions."
        action={
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10 mr-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-brand shadow-sm' : 'text-muted-foreground'}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-brand shadow-sm' : 'text-muted-foreground'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={16} />
              </Button>
            </div>
            <a href="https://supabase.com/dashboard/project/_/auth/users" target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-brand text-brand-foreground shadow-glow gap-2">
                <UserPlus size={16} /> Invite New Admin
              </Button>
            </a>
          </div>
        }
      />

      {loading ? (
        <div className="h-64 grid place-items-center">
          <div className="size-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "list" ? (
        <DataTable columns={columns} rows={rows} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {profiles.map((p) => (
            <AdminCard key={p.id} className="group overflow-hidden flex flex-col h-full border border-white/5 hover:border-brand/30 transition-all duration-300">
              <div className="p-6 flex-1 flex flex-col items-center text-center">
                <div className="size-20 rounded-full bg-gradient-brand flex items-center justify-center text-2xl font-bold text-brand-foreground overflow-hidden border-4 border-white/5 shadow-glow mb-4">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (p.full_name?.[0] || p.email?.[0] || "?").toUpperCase()
                  )}
                </div>
                <h3 className="font-bold text-lg leading-tight">{p.full_name || "New Admin"}</h3>
                <div className="text-xs text-muted-foreground mt-1 mb-4">{p.email}</div>
                <StatusPill tone={p.full_name === "Sridhar Silver" ? "amber" : "blue"}>
                  {p.full_name === "Sridhar Silver" ? "Super Admin" : "Admin"}
                </StatusPill>
                <div className="mt-auto pt-6 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isSuperAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-brand hover:bg-brand/10" 
                      onClick={() => handleStartEdit(p)}
                    >
                      <Pencil size={14} />
                    </Button>
                  )}
                  <a href="https://supabase.com/dashboard/project/_/auth/users" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <ExternalLink size={14} />
                    </Button>
                  </a>
                </div>
              </div>
            </AdminCard>
          ))}
          {profiles.length === 0 && (
            <div className="col-span-full h-64 glass rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground">
              <User size={48} className="mb-4 opacity-20" />
              <p>No users found.</p>
            </div>
          )}
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(v) => !v && !saving && setEditingUser(null)}>
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Updating profile for {editingUser?.email}</DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-6 pt-4">
              {/* Avatar Section */}
              <div className="flex justify-center">
                <div className="relative group w-fit">
                  <div className="size-24 rounded-full bg-gradient-brand flex items-center justify-center text-3xl font-bold text-brand-foreground shadow-glow overflow-hidden border-4 border-white/5">
                    {editAvatar ? (
                      <img src={editAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (editName?.[0] || editingUser.email?.[0] || "?").toUpperCase()
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer text-white text-[10px] font-bold uppercase tracking-wider">
                    Change
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setEditingUser(null)} disabled={saving}>Cancel</Button>
                <Button onClick={handleSaveUser} disabled={saving} className="bg-gradient-brand text-brand-foreground shadow-glow gap-2 px-8">
                  {saving ? "Saving..." : <><Check size={16} /> Save Changes</>}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cropper Modal (Nested for User Edit) */}
      <Dialog open={!!imageToCrop} onOpenChange={(v) => !v && setImageToCrop(null)}>
        <DialogContent className="glass border-white/10 max-w-lg z-[100]">
          <DialogHeader>
            <DialogTitle>Crop User Photo</DialogTitle>
          </DialogHeader>
          <div className="relative h-[300px] w-full bg-black rounded-xl overflow-hidden mt-4">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_: any, p: any) => setCroppedAreaPixels(p)}
              />
            )}
          </div>
          <DialogFooter className="mt-6 flex gap-2">
            <Button variant="ghost" onClick={() => setImageToCrop(null)}>Cancel</Button>
            <Button onClick={handleConfirmCrop} disabled={saving} className="bg-gradient-brand text-brand-foreground shadow-glow font-bold flex-1">
              {saving ? "..." : "Confirm Crop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminCard className="p-6 bg-amber-500/5 border-amber-500/20 mt-8">
        <div className="flex gap-4">
          <div className="size-10 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-amber-500">Super Admin Privileges</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              As a Super Admin, you have the authority to manage the visual identity of your team. Updates made here will sync across all administrative interfaces in real-time.
            </p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}

