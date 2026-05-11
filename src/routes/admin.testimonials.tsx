import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Edit2, Star, List, LayoutGrid, Quote } from "lucide-react";
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

export const Route = createFileRoute("/admin/testimonials")({ 
  component: TestimonialsPage 
});

function Stars({ n }: { n: number }) {
  return <span className="inline-flex gap-0.5">{Array.from({ length: n }).map((_, i) => <Star key={i} size={12} className="fill-brand text-brand" />)}</span>;
}

function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [selectedTestimonial, setSelectedTestimonial] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  useEffect(() => {
    fetchTestimonials();
  }, []);

  async function fetchTestimonials() {
    setLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTestimonials(data);
    setLoading(false);
  }

  const handleEdit = (testimonial: any) => {
    setEditingTestimonial(testimonial);
    setIsOpen(true);
    setSelectedTestimonial(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      company: formData.get("company"),
      content: formData.get("content"),
      rating: parseInt(formData.get("rating") as string),
      status: "approved",
    };

    let error;
    if (editingTestimonial) {
      const { error: err } = await supabase.from("testimonials").update(payload).eq("id", editingTestimonial.id);
      error = err;
    } else {
      const { error: err } = await supabase.from("testimonials").insert([payload]);
      error = err;
    }

    if (!error) {
      toast.success("Testimonial saved");
      setIsOpen(false);
      fetchTestimonials();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete testimonial?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    fetchTestimonials();
  }

  const columns = ["Client", "Company", "Rating", "Status", "Actions"];
  const rows = testimonials.map(t => [
    <div className="font-medium" key={t.id}>{t.name}</div>,
    t.company,
    <Stars key={`r-${t.id}`} n={t.rating} />,
    <StatusPill key={`s-${t.id}`} tone={t.status === "approved" ? "green" : "amber"}>
      {t.status === "approved" ? "Approved" : "Pending"}
    </StatusPill>,
    <div className="flex gap-1" key={`a-${t.id}`} onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t)}><Edit2 size={14} /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></Button>
    </div>
  ]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Testimonials" 
        desc="Manage client reviews." 
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
                <Button onClick={() => setEditingTestimonial(null)} className="bg-gradient-brand text-brand-foreground shadow-glow"><Plus className="mr-2 h-4 w-4" /> Add Testimonial</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader><DialogTitle>{editingTestimonial ? "Edit" : "Add"} Testimonial</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Client Name</Label><Input name="name" defaultValue={editingTestimonial?.name} required className="glass" /></div>
                  <div className="space-y-2"><Label>Company</Label><Input name="company" defaultValue={editingTestimonial?.company} required className="glass" /></div>
                  <div className="space-y-2"><Label>Rating (1-5)</Label><Input type="number" name="rating" min="1" max="5" defaultValue={editingTestimonial?.rating || 5} className="glass" /></div>
                  <div className="space-y-2"><Label>Content</Label><Textarea name="content" defaultValue={editingTestimonial?.content} className="glass" /></div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-gradient-brand text-brand-foreground">Save</Button>
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
        <DataTable columns={columns} rows={rows} onRowClick={(idx) => setSelectedTestimonial(testimonials[idx])} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {testimonials.map((t) => (
            <AdminCard 
              key={t.id} 
              className="group overflow-hidden flex flex-col h-full border border-white/5 hover:border-brand/30 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedTestimonial(t)}
            >
              <div className="p-6 flex-1 flex flex-col bg-gradient-to-br from-white/[0.03] to-transparent relative">
                <Quote className="absolute top-4 right-4 size-12 text-white/[0.03] pointer-events-none" />
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col">
                    <h3 className="font-bold text-lg leading-tight">{t.name}</h3>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{t.company}</div>
                  </div>
                  <StatusPill tone={t.status === "approved" ? "green" : "amber"}>
                    {t.status === "approved" ? "Approved" : "Pending"}
                  </StatusPill>
                </div>
                <div className="mb-4"><Stars n={t.rating} /></div>
                <p className="text-sm text-muted-foreground italic line-clamp-4 leading-relaxed">"{t.content}"</p>
              </div>
            </AdminCard>
          ))}
          {testimonials.length === 0 && (
            <div className="col-span-full h-64 glass rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground">
              <Quote size={48} className="mb-4 opacity-20" />
              <p>No testimonials found. Add your first review!</p>
            </div>
          )}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!selectedTestimonial} onOpenChange={(v) => !v && setSelectedTestimonial(null)}>
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader>
            <div className="size-12 rounded-xl bg-gradient-brand text-brand-foreground grid place-items-center mb-4 shadow-glow">
              <Quote size={24} />
            </div>
            <DialogTitle className="text-2xl font-bold">{selectedTestimonial?.name}</DialogTitle>
            <div className="text-brand font-bold uppercase tracking-widest text-[10px] mt-1">{selectedTestimonial?.company}</div>
          </DialogHeader>
          
          <div className="py-4 space-y-4 text-center">
            <div className="flex justify-center mb-2">
              <Stars n={selectedTestimonial?.rating || 5} />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Testimonial Content</div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap italic bg-white/5 p-4 rounded-xl border border-white/5">
                "{selectedTestimonial?.content}"
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2 pt-4">
            <Button className="w-full bg-gradient-brand text-brand-foreground shadow-glow gap-2" onClick={() => handleEdit(selectedTestimonial)}>
              <Edit2 size={16} /> Edit Review
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5" onClick={() => setSelectedTestimonial(null)}>Close</Button>
              <Button variant="ghost" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => {
                handleDelete(selectedTestimonial.id);
                setSelectedTestimonial(null);
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
