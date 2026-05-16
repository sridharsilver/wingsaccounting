import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { QuotationForm } from "@/components/accounting/QuotationForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { FileText, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/quotations/$id/edit")({
  component: EditQuotationPage,
});

function EditQuotationPage() {
  const { id } = useParams({ from: "/_app/quotations/$id/edit" });
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotation = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("quotations")
        .select("*, quotation_items(*)")
        .eq("id", id)
        .single();
      
      if (!error && data) {
        // Map quotation_items to items for the form
        const mappedQuotation = {
          ...data,
          items: data.quotation_items || []
        };
        setQuotation(mappedQuotation);
      }
      setLoading(false);
    };

    fetchQuotation();
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
        title={`Revise Quotation #${quotation?.quotation_number}`} 
        subtitle="Updating business proposal"
        icon={FileText}
        actions={
          <Button 
            variant="ghost" 
            onClick={() => navigate({ to: "/quotations" })}
            className="rounded-2xl gap-2 font-bold uppercase tracking-widest text-[10px]"
          >
            <ChevronLeft size={16} /> Back to Registry
          </Button>
        }
      />

      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl bg-surface/30">
        <QuotationForm 
          initialData={quotation}
          onSuccess={() => navigate({ to: "/quotations" })}
          onCancel={() => navigate({ to: "/quotations" })}
        />
      </div>
    </div>
  );
}
