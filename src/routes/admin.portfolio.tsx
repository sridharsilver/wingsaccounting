import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Edit2, Upload, LayoutGrid, List } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusPill } from "@/components/admin/StatusPill";
import { AdminCard } from "@/components/admin/AdminCard";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/portfolio")({ 
  component: PortfolioPage 
});

function PortfolioPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // ... rest of the fetch functions ...

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setImageUrl(project.image_url);
    setIsOpen(true);
    setSelectedProject(null);
  };

  const rows = projects.map((p) => [
    <div className="flex items-center gap-3" key={p.id}>
      <div className="size-8 rounded bg-surface overflow-hidden shrink-0">
        <img src={p.image_url} alt="" className="w-full h-full object-cover" />
      </div>
      <span className="font-medium">{p.title}</span>
    </div>,
    p.category,
    <StatusPill key={`s-${p.id}`} tone={p.featured ? "green" : "amber"}>
      {p.featured ? "Featured" : "Regular"}
    </StatusPill>,
    new Date(p.created_at).toLocaleDateString(),
    <div className="flex gap-1" key={`a-${p.id}`} onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
        <Edit2 size={14} />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
        <Trash2 size={14} />
      </Button>
    </div>
  ]);

  return (
    <div className="space-y-6">
      {/* ... PageHeader ... */}
      
      {loading ? (
        <div className="h-64 grid place-items-center">
          <div className="size-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "list" ? (
        <DataTable 
          columns={columns} 
          rows={rows} 
          onRowClick={(idx) => setSelectedProject(projects[idx])}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((p) => (
            <AdminCard 
              key={p.id} 
              className="group overflow-hidden flex flex-col h-full border border-white/5 hover:border-brand/30 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedProject(p)}
            >
              <div className="aspect-[21/9] sm:aspect-[4/3] relative overflow-hidden">
                <img src={p.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-3 right-3 shadow-[0_8px_30px_rgb(0,0,0,0.5)] bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                  <StatusPill tone={p.featured ? "green" : "amber"}>
                    {p.featured ? "Featured" : "Regular"}
                  </StatusPill>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-[10px] uppercase tracking-widest text-brand font-bold mb-1">{p.category}</div>
                <h3 className="font-bold text-lg line-clamp-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description || "No description provided."}</p>
                <div className="mt-auto pt-4 text-[10px] text-muted-foreground uppercase tracking-tighter">
                  Added on {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
            </AdminCard>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full h-64 glass rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground">
              <LayoutGrid size={48} className="mb-4 opacity-20" />
              <p>No projects found. Add your first project!</p>
            </div>
          )}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={(v) => !v && setSelectedProject(null)}>
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader>
            <div className="aspect-video rounded-xl overflow-hidden border border-white/10 mb-4 shadow-glow bg-surface-elevated">
              <img src={selectedProject?.image_url} alt="" className="w-full h-full object-cover" />
            </div>
            <DialogTitle className="text-2xl font-bold">{selectedProject?.title}</DialogTitle>
            <div className="text-brand font-bold uppercase tracking-[0.2em] text-[10px] mt-1">{selectedProject?.category}</div>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Description</div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
                "{selectedProject?.description || "No description provided."}"
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Featured</div>
                <StatusPill tone={selectedProject?.featured ? "green" : "amber"}>
                  {selectedProject?.featured ? "Yes" : "No"}
                </StatusPill>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Added On</div>
                <div className="text-xs font-medium">{selectedProject && new Date(selectedProject.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2 pt-4">
            <Button className="w-full bg-gradient-brand text-brand-foreground shadow-glow gap-2" onClick={() => handleEdit(selectedProject)}>
              <Edit2 size={16} /> Edit Project
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5" onClick={() => setSelectedProject(null)}>Close</Button>
              <Button variant="ghost" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => {
                handleDelete(selectedProject.id);
                setSelectedProject(null);
              }}>
                <Trash2 size={16} /> Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Modal */}
