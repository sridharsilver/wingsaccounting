import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { AddButton } from "@/components/admin/AddButton";
import { DataTable } from "@/components/admin/DataTable";
import { useState, useEffect } from "react";
import { FileText, Search, Filter, Printer, Download, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Drawer } from "vaul";
import { InvoiceForm } from "@/components/accounting/InvoiceForm";
import { InvoicePrint } from "@/components/accounting/InvoicePrint";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/accounting-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/invoices")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const [invRes, setRes] = await Promise.all([
      supabase.from("invoices").select("*, customers(*), invoice_items(*)").order("created_at", { ascending: false }),
      supabase.from("settings").select("*").single()
    ]);
    
    if (!invRes.error) setInvoices(invRes.data || []);
    if (!setRes.error) setSettings(setRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) || 
    inv.customers?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print');
    if (!printContent) return;
    
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Invoice - ${selectedInvoice.invoice_number}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              body { padding: 0; margin: 0; }
              #invoice-print { width: 100% !important; max-width: none !important; box-shadow: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = () => {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Invoices" 
        subtitle="Manage your sales invoices and track payments."
        action={<AddButton label="Create Invoice" onClick={() => { setSelectedInvoice(null); setIsFormOpen(true); }} />}
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-brand"
            placeholder="Search by invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={[
          { key: "invoice_number", label: "Invoice #" },
          { key: "date", label: "Date", format: (v) => format(new Date(v), "dd MMM yyyy") },
          { key: "customers.name", label: "Customer" },
          { key: "total_amount", label: "Total Amount", format: (v) => formatCurrency(Number(v)) },
          { key: "status", label: "Status" },
        ]}
        data={filteredInvoices}
        actions={(inv) => (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => { setSelectedInvoice(inv); setIsPreviewOpen(true); }}
              className="p-2 hover:bg-brand/10 text-brand rounded-lg transition-colors"
              title="Preview & Print"
            >
              <Eye size={16} />
            </button>
            <button 
              onClick={() => { setSelectedInvoice(inv); setIsFormOpen(true); }}
              className="p-2 hover:bg-foreground/5 text-muted-foreground rounded-lg transition-colors"
            >
              <FileText size={16} />
            </button>
          </div>
        )}
        onEdit={(inv) => { setSelectedInvoice(inv); setIsFormOpen(true); }}
        onDelete={async (id) => {
          if (confirm("Delete this invoice?")) {
            await supabase.from("invoices").delete().eq("id", id);
            fetchData();
          }
        }}
        emptyMessage={loading ? "Loading invoices..." : "No invoices found."}
        icon={FileText}
      />

      {/* Invoice Form Drawer */}
      <Drawer.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 top-10 bg-surface z-50 rounded-t-[32px] border-t border-border flex flex-col focus:outline-none overflow-hidden">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border mt-4 mb-2" />
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <Drawer.Title className="text-2xl font-black uppercase tracking-tighter">
                  {selectedInvoice ? "Edit Invoice" : "Create New Invoice"}
                </Drawer.Title>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-3 rounded-xl hover:bg-foreground/5 text-muted-foreground transition-colors">
                <FileText size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background/50">
              <div className="max-w-5xl mx-auto">
                <InvoiceForm 
                  initialData={selectedInvoice}
                  onSuccess={() => {
                    setIsFormOpen(false);
                    fetchData();
                  }}
                  onCancel={() => setIsFormOpen(false)}
                />
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Preview Drawer */}
      <Drawer.Root open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 top-10 bg-surface z-50 rounded-t-[32px] border-t border-border flex flex-col focus:outline-none overflow-hidden">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border mt-4 mb-2" />
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <Drawer.Title className="text-2xl font-black uppercase tracking-tighter">Invoice Preview</Drawer.Title>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl font-bold text-sm shadow-glow hover:brightness-110"
                >
                  <Printer size={16} /> Print Invoice
                </button>
                <button onClick={() => setIsPreviewOpen(false)} className="p-3 rounded-xl hover:bg-foreground/5 text-muted-foreground transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-foreground/5">
              <div className="max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden">
                <InvoicePrint invoice={selectedInvoice} settings={settings} />
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

const X = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;


