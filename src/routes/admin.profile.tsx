import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Shield, Calendar, LogOut, Camera, Phone } from "lucide-react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/profile")({
  component: ProfilePage,
});

// Helper to create the cropped image
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error("Canvas is empty");
      resolve(blob);
    }, "image/jpeg");
  });
};

function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Crop State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      
      // Fetch from profiles as source of truth
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      
      setUser(user); // Keep auth user for ID
      setDisplayName(profile?.full_name || user?.user_metadata?.full_name || "");
      setPhone(profile?.phone || user?.user_metadata?.phone || "");
      setAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url || "");
    });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Update Profile Table (Truth)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: displayName, phone, avatar_url: avatarUrl })
      .eq("id", user.id);

    // 2. Update Auth Metadata (Session)
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: displayName, phone, avatar_url: avatarUrl }
    });
    
    if (profileError || authError) {
      toast.error(profileError?.message || authError?.message);
    } else {
      toast.success("Profile updated successfully");
    }
    setLoading(false);
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
      setUploading(true);
      if (!imageToCrop || !croppedAreaPixels) return;

      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const filePath = `${user.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 1. Update Profile Table
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, full_name: displayName, phone })
        .eq("id", user.id);

      // 2. Update Auth Metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl, full_name: displayName, phone }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setImageToCrop(null);
      toast.success("Profile image cropped and updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update avatar.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Profile" desc="Manage your account security and preferences." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6 text-center">
            <div className="relative group mx-auto mb-4 w-fit">
              <div className="size-24 rounded-full bg-gradient-brand flex items-center justify-center text-3xl font-bold text-brand-foreground shadow-glow overflow-hidden border-4 border-white/5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.email?.[0].toUpperCase()
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer text-white text-[10px] font-bold uppercase tracking-wider">
                {uploading ? "..." : "Change"}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
              </label>
            </div>
            
            <h2 className="text-xl font-bold">{displayName || user.email?.split('@')[0]}</h2>
            <p className="text-sm text-muted-foreground mb-6">{user.email}</p>
            
            <div className="space-y-4 pt-4 border-t border-white/5 text-left">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield size={16} className={displayName === "Sridhar Silver" ? "text-amber-400" : "text-brand"} />
                <span>Role: 
                  <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    displayName === "Sridhar Silver" 
                    ? "bg-amber-400/20 text-amber-400 border border-amber-400/20" 
                    : "bg-brand/20 text-brand border border-brand/20"
                  }`}>
                    {displayName === "Sridhar Silver" ? "Super Admin" : "Admin"}
                  </span>
                </span>
              </div>
              {phone && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone size={16} className="text-brand" />
                  <span>Phone: <span className="text-foreground font-medium">{phone}</span></span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar size={16} className="text-brand" />
                <span>Joined: <span className="text-foreground font-medium">{new Date(user.created_at).toLocaleDateString()}</span></span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-8 border-red-500/20 text-red-500 hover:bg-red-500/10 gap-2"
              onClick={handleSignOut}
            >
              <LogOut size={16} /> Sign Out
            </Button>
          </AdminCard>
        </div>

        {/* Security / Password Update */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-bold">Identity Settings</h3>
                <p className="text-xs text-muted-foreground">Update your public presence in the dashboard</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="displayName" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      placeholder="e.g. Sridhar Silver"
                      className="pl-10" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="e.g. +91 98765 43210"
                      className="pl-10" 
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="bg-gradient-brand text-brand-foreground shadow-glow font-semibold px-8">
                {loading ? "Saving..." : "Save Profile Changes"}
              </Button>
            </form>
          </AdminCard>

          <AdminCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-bold">Security Settings</h3>
                <p className="text-xs text-muted-foreground">Update your administrative credentials</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Primary Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" value={user.email} disabled className="pl-10 bg-surface/30 opacity-70" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id">User ID</Label>
                  <Input id="id" value={user.id} disabled className="bg-surface/30 opacity-70 text-xs font-mono" />
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <h4 className="text-sm font-semibold">Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      placeholder="Min 6 characters" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      placeholder="Repeat new password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="bg-gradient-brand text-brand-foreground shadow-glow font-semibold px-8 h-11">
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </AdminCard>

          <AdminCard className="p-6 bg-amber-500/5 border-amber-500/20">
            <div className="flex gap-4">
              <div className="size-10 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Shield size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-amber-500">Security Recommendation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You are currently using email/password authentication. For maximum security, ensure your password is at least 12 characters long and contains symbols. Multi-factor authentication can be enabled in your Supabase project settings.
                </p>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Cropper Modal */}
      <Dialog open={!!imageToCrop} onOpenChange={(v) => !v && setImageToCrop(null)}>
        <DialogContent className="glass border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop Identity Photo</DialogTitle>
          </DialogHeader>
          
          <div className="relative h-[300px] w-full bg-black rounded-xl overflow-hidden mt-4">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
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
            <Button 
              onClick={handleConfirmCrop} 
              disabled={uploading}
              className="flex-1 bg-gradient-brand text-brand-foreground shadow-glow font-bold"
            >
              {uploading ? "Applying..." : "Set as Profile Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
