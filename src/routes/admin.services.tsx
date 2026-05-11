import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Edit2, List, LayoutGrid } from "lucide-react";
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

export const Route = createFileRoute("/admin/services")({ 
  component: ServicesPage 
});

function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setServices(data);
    setLoading(false);
  }

  const handleEdit = (service: any) => {
    setEditingService(service);
    setIsOpen(true);
    setSelectedService(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      category: formData.get("category"),
      description: formData.get("description"),
      price: formData.get("price"),
      status: "live",
    };

    let error;
    if (editingService) {
      const { error: err } = await supabase.from("services").update(payload).eq("id", editingService.id);
      error = err;
    } else {
      const { error: err } = await supabase.from("services").insert([payload]);
      error = err;
    }

    if (!error) {
      toast.success("Service saved");
      setIsOpen(false);
      fetchServices();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete service?")) return;
    await supabase.from("services").delete().eq("id", id);
    fetchServices();
  }

  const columns = ["Service", "Category", "Status", "Price", "Actions"];
  const rows = services.map(s => [
    <div className="font-medium" key={s.id}>{s.title}</div>,
    s.category,
    <StatusPill key={`s-${s.id}`} tone={s.status === "live" ? "green" : "amber"}>
      {s.status === "live" ? "Live" : "Draft"}
    </StatusPill>,
    s.price,
    <div className="flex gap-1" key={`a-${s.id}`} onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(s)}><Edit2 size={14} /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></Button>
    </div>
  ]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Services" 
        desc="Manage your service catalogue." 
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
                <Button onClick={() => setEditingService(null)} className="bg-gradient-brand text-brand-foreground shadow-glow"><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader><DialogTitle>{editingService ? "Edit" : "Add"} Service</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Title</Label><Input name="title" defaultValue={editingService?.title} required className="glass" /></div>
                  <div className="space-y-2"><Label>Category</Label><Input name="category" defaultValue={editingService?.category} required className="glass" /></div>
                  <div className="space-y-2"><Label>Price</Label><Input name="price" defaultValue={editingService?.price} className="glass" /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={editingService?.description} className="glass" /></div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-gradient-brand text-brand-foreground">Save Service</Button>
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
        <DataTable columns={columns} rows={rows} onRowClick={(idx) => setSelectedService(services[idx])} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((s) => (
            <AdminCard 
              key={s.id} 
              className="group overflow-hidden flex flex-col h-full border border-white/5 hover:border-brand/30 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedService(s)}
            >
              <div className="p-6 flex-1 flex flex-col bg-gradient-to-br from-white/[0.03] to-transparent">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-[10px] uppercase tracking-widest text-brand font-bold">{s.category}</div>
                  <StatusPill tone={s.status === "live" ? "green" : "amber"}>
                    {s.status === "live" ? "Live" : "Draft"}
                  </StatusPill>
                </div>
                <h3 className="font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-6">{s.description || "No description provided."}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="font-bold text-lg text-brand-purple">{s.price || "Contact for Price"}</div>
                </div>
              </div>
            </AdminCard>
          ))}
          {services.length === 0 && (
            <div className="col-span-full h-64 glass rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground">
              <LayoutGrid size={48} className="mb-4 opacity-20" />
              <p>No services found. Add your first service!</p>
            </div>
          )}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!selectedService} onOpenChange={(v) => !v && setSelectedService(null)}>
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader>
            <div className="size-12 rounded-xl bg-gradient-brand text-brand-foreground grid place-items-center mb-4 shadow-glow">
              <LayoutGrid size={24} />
            </div>
            <DialogTitle className="text-2xl font-bold">{selectedService?.title}</DialogTitle>
            <div className="text-brand font-bold uppercase tracking-widest text-[10px] mt-1">{selectedService?.category}</div>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Service Description</div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
                "{selectedService?.description || "No description provided."}"
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Pricing</div>
                <div className="text-lg font-bold text-brand-purple">{selectedService?.price || "Contact"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status</div>
                <StatusPill tone={selectedService?.status === "live" ? "green" : "amber"}>
                  {selectedService?.status === "live" ? "Live" : "Draft"}
                </StatusPill>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2 pt-4">
            <Button className="w-full bg-gradient-brand text-brand-foreground shadow-glow gap-2" onClick={() => handleEdit(selectedService)}>
              <Edit2 size={16} /> Edit Service
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5" onClick={() => setSelectedService(null)}>Close</Button>
              <Button variant="ghost" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => {
                handleDelete(selectedService.id);
                setSelectedService(null);
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
