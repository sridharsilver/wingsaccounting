import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/accounting/InvoiceForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { FileText, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/invoices/$id/edit")({
  component: EditInvoicePage,
});

function EditInvoicePage() {
  const { id } = useParams({ from: "/_app/invoices/$id/edit" });
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .eq("id", id)
        .single();
      
      if (!error && data) {
        // Map invoice_items to items for the form
        const mappedInvoice = {
          ...data,
          items: data.invoice_items || []
        };
        setInvoice(mappedInvoice);
      }
      setLoading(false);
    };

    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <PageHeader 
        title={`Revise Invoice #${invoice?.invoice_number}`} 
        subtitle="Updating existing financial record"
        icon={FileText}
        actions={
          <Button 
            variant="ghost" 
            onClick={() => navigate({ to: "/invoices" })}
            className="rounded-2xl gap-2 font-bold uppercase tracking-widest text-[10px]"
          >
            <ChevronLeft size={16} /> Back to Archives
          </Button>
        }
      />

      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl bg-surface/30">
        <InvoiceForm 
          initialData={invoice}
          onSuccess={() => navigate({ to: "/invoices" })}
          onCancel={() => navigate({ to: "/invoices" })}
        />
      </div>
    </div>
  );
}
