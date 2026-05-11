import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Edit2, Star, List, LayoutGrid, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusPill } from "@/components/admin/StatusPill";
import { AdminCard } from "@/components/admin/AdminCard";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/blog")({ 
  component: BlogPage 
});

function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setImageUrl(post.image_url);
    setIsOpen(true);
    setSelectedPost(null);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 2MB.");
      return;
    }

    setUploading(true);
    const filePath = `blog/${Math.random()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from("images").upload(filePath, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);
      setImageUrl(publicUrl);
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      excerpt: formData.get("excerpt"),
      content: formData.get("content"),
      category: formData.get("category"),
      author: "Admin",
      image_url: imageUrl,
       status: "published",
      is_featured: formData.get("is_featured") === "on",
    };

    let error;
    if (editingPost) {
      const { error: err } = await supabase.from("blog").update(payload).eq("id", editingPost.id);
      error = err;
    } else {
      const { error: err } = await supabase.from("blog").insert([payload]);
      error = err;
    }

    if (!error) {
      toast.success("Post saved");
      setIsOpen(false);
      fetchPosts();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete post?")) return;
    await supabase.from("blog").delete().eq("id", id);
    fetchPosts();
  }

  const columns = ["Title", "Category", "Status", "Home", "Date", "Actions"];
  const rows = posts.map(p => [
    <div className="font-medium" key={p.id}>{p.title}</div>,
    p.category,
    <StatusPill key={`s-${p.id}`} tone={p.status === "published" ? "green" : "amber"}>
      {p.status === "published" ? "Published" : "Draft"}
    </StatusPill>,
    <div key={`f-${p.id}`} className="flex justify-center">
      {p.is_featured ? <Star size={16} className="text-yellow-500 fill-yellow-500" /> : <Star size={16} className="text-muted-foreground/30" />}
    </div>,
    new Date(p.created_at).toLocaleDateString(),
    <div className="flex gap-1" key={`a-${p.id}`} onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}><Edit2 size={14} /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></Button>
    </div>
  ]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Blog Posts" 
        desc="Write and manage studio updates." 
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
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingPost(null); setImageUrl(""); }} className="bg-gradient-brand text-brand-foreground shadow-glow"><Plus className="mr-2 h-4 w-4" /> New Post</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] glass">
                <DialogHeader><DialogTitle>{editingPost ? "Edit" : "New"} Post</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Title</Label><Input name="title" defaultValue={editingPost?.title} required className="glass" /></div>
                  <div className="space-y-2"><Label>Category</Label><Input name="category" defaultValue={editingPost?.category} required className="glass" /></div>
                  <div className="space-y-2">
                    <Label>Image</Label>
                    <Input type="file" onChange={handleFileUpload} className="glass" />
                    {imageUrl && <img src={imageUrl} className="h-20 w-32 object-cover rounded border border-white/10" />}
                  </div>
                  <div className="space-y-2"><Label>Excerpt</Label><Input name="excerpt" defaultValue={editingPost?.excerpt} className="glass" /></div>
                  <div className="space-y-2"><Label>Content</Label><Textarea name="content" defaultValue={editingPost?.content} className="h-32 glass" /></div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      name="is_featured" 
                      id="is_featured"
                      defaultChecked={editingPost?.is_featured}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand focus:ring-brand"
                    />
                    <Label htmlFor="is_featured" className="cursor-pointer">Featured on Home Page</Label>
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={uploading} className="bg-gradient-brand text-brand-foreground">Save Post</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {loading ? (
        <div className="h-64 grid place-items-center">
          <div className="size-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "list" ? (
        <DataTable columns={columns} rows={rows} onRowClick={(idx) => setSelectedPost(posts[idx])} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((p) => (
            <AdminCard 
              key={p.id} 
              className="group overflow-hidden flex flex-col h-full border border-white/5 hover:border-brand/30 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedPost(p)}
            >
              <div className="aspect-[21/9] sm:aspect-video relative overflow-hidden">
                <img src={p.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-3 right-3 shadow-[0_8px_30px_rgb(0,0,0,0.5)] bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                  <StatusPill tone={p.status === "published" ? "green" : "amber"}>
                    {p.status === "published" ? "Published" : "Draft"}
                  </StatusPill>
                </div>
                {p.is_featured && (
                  <div className="absolute top-3 left-3 bg-yellow-500 text-white p-1.5 rounded-full shadow-lg border border-yellow-400">
                    <Star size={14} className="fill-current" />
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-[10px] uppercase tracking-widest text-brand font-bold mb-1">{p.category}</div>
                <h3 className="font-bold text-lg line-clamp-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.excerpt || "No excerpt provided."}</p>
                <div className="mt-auto pt-4 text-[10px] text-muted-foreground uppercase tracking-tighter">
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
            </AdminCard>
          ))}
          {posts.length === 0 && (
            <div className="col-span-full h-64 glass rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground">
              <LayoutGrid size={48} className="mb-4 opacity-20" />
              <p>No posts found. Write your first post!</p>
            </div>
          )}
        </div>
      )}
      {/* View Details Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(v) => !v && setSelectedPost(null)}>
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader>
            <div className="aspect-video rounded-xl overflow-hidden border border-white/10 mb-4 shadow-glow bg-surface-elevated">
              <img src={selectedPost?.image_url} alt="" className="w-full h-full object-cover" />
            </div>
            <DialogTitle className="text-2xl font-bold">{selectedPost?.title}</DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-brand font-bold uppercase tracking-widest text-[10px]">{selectedPost?.category}</div>
              {selectedPost?.is_featured && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
            </div>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Excerpt</div>
              <p className="text-sm text-muted-foreground leading-relaxed italic bg-white/5 p-3 rounded-lg border border-white/5">
                "{selectedPost?.excerpt || "No excerpt provided."}"
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status</div>
                <StatusPill tone={selectedPost?.status === "published" ? "green" : "amber"}>
                  {selectedPost?.status === "published" ? "Published" : "Draft"}
                </StatusPill>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Published On</div>
                <div className="text-xs font-medium">{selectedPost && new Date(selectedPost.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2 pt-4">
            <Button className="w-full bg-gradient-brand text-brand-foreground shadow-glow gap-2" onClick={() => handleEdit(selectedPost)}>
              <Edit2 size={16} /> Edit Post
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5" onClick={() => setSelectedPost(null)}>Close</Button>
              <Button variant="ghost" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => {
                handleDelete(selectedPost.id);
                setSelectedPost(null);
              }}>
                <Trash2 size={16} /> Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
