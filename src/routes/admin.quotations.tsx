import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { AddButton } from "@/components/admin/AddButton";
import { DataTable } from "@/components/admin/DataTable";
import { useState, useEffect } from "react";
import { FileText, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Drawer } from "vaul";
import { QuotationForm } from "@/components/accounting/QuotationForm";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/accounting-utils";

export const Route = createFileRoute("/admin/quotations")({
  component: QuotationsPage,
});

function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);

  const fetchQuotations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quotations")
      .select("*, customers(name)")
      .order("created_at", { ascending: false });
    
    if (!error) setQuotations(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const filteredQuotations = quotations.filter(q => 
    q.quotation_number.toLowerCase().includes(search.toLowerCase()) || 
    q.customers?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Quotations" 
        subtitle="Create and manage your business estimates and quotes."
        action={<AddButton label="New Quotation" onClick={() => { setSelectedQuotation(null); setIsDrawerOpen(true); }} />}
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-brand"
            placeholder="Search quotes by number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={[
          { key: "quotation_number", label: "Quotation #" },
          { key: "date", label: "Date", format: (v) => format(new Date(v), "dd MMM yyyy") },
          { key: "customers.name", label: "Customer" },
          { key: "total_amount", label: "Estimated Amount", format: (v) => formatCurrency(Number(v)) },
          { key: "status", label: "Status" },
        ]}
        data={filteredQuotations}
        onEdit={(q) => { setSelectedQuotation(q); setIsDrawerOpen(true); }}
        onDelete={async (id) => {
          if (confirm("Delete this quotation?")) {
            await supabase.from("quotations").delete().eq("id", id);
            fetchQuotations();
          }
        }}
        emptyMessage={loading ? "Loading quotations..." : "No quotations found."}
        icon={FileText}
      />

      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 top-10 bg-surface z-50 rounded-t-[32px] border-t border-border flex flex-col focus:outline-none overflow-hidden">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border mt-4 mb-2" />
            <div className="p-6 border-b border-border">
              <Drawer.Title className="text-2xl font-black uppercase tracking-tighter">
                {selectedQuotation ? "Edit Quotation" : "New Quotation"}
              </Drawer.Title>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <div className="max-w-5xl mx-auto">
                <QuotationForm 
                  initialData={selectedQuotation}
                  onSuccess={() => {
                    setIsDrawerOpen(false);
                    fetchQuotations();
                  }}
                  onCancel={() => setIsDrawerOpen(false)}
                />
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
