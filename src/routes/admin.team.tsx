import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Check, X, Image as ImageIcon, User, Briefcase, GripVertical, Eye, EyeOff, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { supabase } from "@/lib/supabase";
import { AdminCard } from "@/components/admin/AdminCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Cropper from "react-easy-crop";

export const Route = createFileRoute("/admin/team")({
  component: TeamManagementPage,
});

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

function TeamManagementPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    image_url: "",
    order_index: 0,
    is_active: true
  });

  // Crop State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    setLoading(true);
    const { data, error } = await supabase
      .from("team")
      .select("*")
      .order("order_index", { ascending: true });
    
    if (data) setTeam(data);
    setLoading(false);
  }

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({ name: member.name, role: member.role, image_url: member.image_url || "", order_index: member.order_index, is_active: member.is_active });
    setSelectedMember(null);
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
      const filePath = `team-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, croppedBlob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData({ ...formData, image_url: publicUrl });
      setImageToCrop(null);
      toast.success("Image cropped!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.role) return toast.error("Name and Role are required");
    
    setSaving(true);
    try {
      if (editingMember) {
        const { error } = await supabase
          .from("team")
          .update({
            name: formData.name,
            role: formData.role,
            image_url: formData.image_url,
            order_index: formData.order_index,
            is_active: formData.is_active
          })
          .eq("id", editingMember.id);
        
        if (error) throw error;
        toast.success("Member updated");
      } else {
        const { error } = await supabase
          .from("team")
          .insert([{
            name: formData.name,
            role: formData.role,
            image_url: formData.image_url,
            order_index: formData.order_index,
            is_active: formData.is_active
          }]);
        
        if (error) throw error;
        toast.success("Member added");
      }
      
      await fetchTeam();
      setEditingMember(null);
      setIsAddModalOpen(false);
    } catch (error: any) {
      console.error("Team Management Error:", error);
      toast.error(error.message || "Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    
    const { error } = await supabase.from("team").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Member removed");
      fetchTeam();
    }
  };

  const columns = ["Member", "Status", "Role", "Order", "Actions"];
  
  const rows = team.map((m) => [
    <div className="flex items-center gap-3" key={m.id}>
      <div className="size-10 rounded-xl bg-surface-elevated overflow-hidden border border-white/5">
        {m.image_url ? (
          <img src={m.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><User size={16} /></div>
        )}
      </div>
      <div className="font-medium">{m.name}</div>
    </div>,
    <div key={`s-${m.id}`} className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${m.is_active ? 'text-emerald-500' : 'text-muted-foreground'}`}>
      {m.is_active ? <><Eye size={10} /> Visible</> : <><EyeOff size={10} /> Hidden</>}
    </div>,
    <span className="text-muted-foreground" key={`r-${m.id}`}>{m.role}</span>,
    <span className="font-mono text-xs text-muted-foreground" key={`o-${m.id}`}>#{m.order_index}</span>,
    <div className="flex gap-1" key={`a-${m.id}`} onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-brand" onClick={() => handleEdit(m)}>
        <Pencil size={14} />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(m.id)}>
        <Trash2 size={14} />
      </Button>
    </div>
  ]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Team Management" 
        desc="Manage the 'Our Team' section on the About page."
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
            <Button onClick={() => {
              setFormData({ name: "", role: "", image_url: "", order_index: team.length + 1, is_active: true });
              setIsAddModalOpen(true);
            }} className="bg-gradient-brand text-brand-foreground shadow-glow gap-2">
              <Plus size={16} /> Add Member
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="h-64 grid place-items-center">
          <div className="size-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "list" ? (
        <DataTable columns={columns} rows={rows} onRowClick={(idx) => setSelectedMember(team[idx])} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {team.map((m) => (
            <AdminCard 
              key={m.id} 
              className="group overflow-hidden flex flex-col h-full border border-white/5 hover:border-brand/30 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedMember(m)}
            >
              <div className="aspect-[16/9] sm:aspect-square relative overflow-hidden bg-surface-elevated">
                {m.image_url ? (
                  <img src={m.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><User size={48} /></div>
                )}
                <div className="absolute top-3 right-3 shadow-[0_8px_30px_rgb(0,0,0,0.5)] bg-black/40 backdrop-blur-md rounded-full border border-white/10 px-2 py-0.5">
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${m.is_active ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    {m.is_active ? <><Eye size={10} /> Visible</> : <><EyeOff size={10} /> Hidden</>}
                  </div>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col text-center">
                <h3 className="font-bold text-lg">{m.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-medium">{m.role}</p>
              </div>
            </AdminCard>
          ))}
          {team.length === 0 && (
            <div className="col-span-full h-64 glass rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground">
              <User size={48} className="mb-4 opacity-20" />
              <p>No team members found. Add your first member!</p>
            </div>
          )}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={(v) => !v && setSelectedMember(null)}>
        <DialogContent className="glass border-white/10 max-w-sm">
          <DialogHeader className="items-center text-center">
            <div className="size-24 rounded-2xl bg-surface-elevated overflow-hidden border border-white/10 mb-4 shadow-glow">
              {selectedMember?.image_url ? (
                <img src={selectedMember.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><User size={32} /></div>
              )}
            </div>
            <DialogTitle className="text-xl">{selectedMember?.name}</DialogTitle>
            <div className="text-brand font-medium uppercase tracking-widest text-[10px] mt-1">{selectedMember?.role}</div>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5 my-4 text-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status</div>
              <div className={`text-xs font-bold ${selectedMember?.is_active ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {selectedMember?.is_active ? "Visible on site" : "Hidden"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Display Order</div>
              <div className="text-xs font-mono font-bold">#{selectedMember?.order_index}</div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button className="w-full bg-gradient-brand text-brand-foreground shadow-glow gap-2" onClick={() => handleEdit(selectedMember)}>
              <Pencil size={16} /> Edit Profile
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5" onClick={() => setSelectedMember(null)}>Close</Button>
              <Button variant="ghost" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => {
                handleDelete(selectedMember.id);
                setSelectedMember(null);
              }}>
                <Trash2 size={16} /> Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen || !!editingMember} onOpenChange={(v) => !v && (setIsAddModalOpen(false), setEditingMember(null))}>
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Avatar Upload */}
            <div className="flex justify-center mb-6">
              <div className="relative group w-fit">
                <div className="size-24 rounded-2xl bg-surface-elevated flex items-center justify-center text-3xl font-bold text-muted-foreground shadow-glow overflow-hidden border border-white/10">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer text-white text-[10px] font-bold uppercase tracking-wider">
                  Upload
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role / Position</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="pl-10" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <Label>Show on Website</Label>
                <p className="text-[10px] text-muted-foreground">Toggle to hide this member from public view.</p>
              </div>
              <Switch 
                checked={formData.is_active} 
                onCheckedChange={(v) => setFormData({...formData, is_active: v})} 
              />
            </div>

            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" value={formData.order_index} onChange={e => setFormData({...formData, order_index: parseInt(e.target.value)})} />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-6">
            <Button variant="ghost" onClick={() => (setIsAddModalOpen(false), setEditingMember(null))}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-brand text-brand-foreground shadow-glow gap-2 px-8">
              {saving ? "Saving..." : <><Check size={16} /> {editingMember ? "Update Member" : "Save Member"}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cropper Modal */}
      <Dialog open={!!imageToCrop} onOpenChange={(v) => !v && setImageToCrop(null)}>
        <DialogContent className="glass border-white/10 max-w-lg z-[100]">
          <DialogHeader>
            <DialogTitle>Crop Member Photo</DialogTitle>
          </DialogHeader>
          <div className="relative h-[300px] w-full bg-black rounded-xl overflow-hidden mt-4">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_: any, p: any) => setCroppedAreaPixels(p)}
              />
            )}
          </div>

          <div className="space-y-2 mt-4">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Zoom Level</Label>
            <input 
              type="range" 
              min={1} 
              max={3} 
              step={0.1} 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))} 
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand"
            />
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button variant="ghost" onClick={() => setImageToCrop(null)} className="flex-1 border-white/5 hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleConfirmCrop} disabled={saving} className="bg-gradient-brand text-brand-foreground shadow-glow font-bold flex-1">
              {saving ? "Applying..." : "Confirm Crop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AdminCard className="p-6 bg-blue-500/5 border-blue-500/20 mt-8">
        <div className="flex gap-4">
          <div className="size-10 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <GripVertical size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-blue-500">Member Sorting</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use the 'Order' field to decide the sequence in which members appear on the About page. Lower numbers appear first.
            </p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
