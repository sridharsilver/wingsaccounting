import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/accounting/InvoiceForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { FileText, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/invoices-new")({
  component: CreateInvoicePage,
});

function CreateInvoicePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      <PageHeader 
        title="New Sales Invoice" 
        subtitle="Generating Financial Document"
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

      <InvoiceForm 
        onSuccess={() => navigate({ to: "/invoices" })}
        onCancel={() => navigate({ to: "/invoices" })}
      />
    </div>
  );
}
