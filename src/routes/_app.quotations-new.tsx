import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QuotationForm } from "@/components/accounting/QuotationForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { FileText, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/quotations-new")({
  component: CreateQuotationPage,
});

function CreateQuotationPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      <PageHeader 
        title="New Business Quotation" 
        subtitle="Drafting Service Estimate & Proposal"
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

      <div className="bg-transparent overflow-hidden">
        <QuotationForm 
          onSuccess={() => navigate({ to: "/quotations" })}
          onCancel={() => navigate({ to: "/quotations" })}
        />
      </div>
    </div>
  );
}
