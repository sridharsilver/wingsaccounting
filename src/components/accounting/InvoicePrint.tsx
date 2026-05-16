import { format } from "date-fns";
import { formatCurrency, numberToIndianWords } from "@/lib/accounting-utils";

interface InvoicePrintProps {
  invoice: any;
  settings: any;
}

export function InvoicePrint({ invoice, settings }: InvoicePrintProps) {
  if (!invoice || !settings) return null;

  const calculateGstSummary = () => {
    const summary: Record<string, { taxable: number, cgst: number, sgst: number, igst: number, rate: number }> = {};
    
    invoice.invoice_items?.forEach((item: any) => {
      const hsn = item.hsn_code || "N/A";
      const amount = Number(item.qty) * Number(item.rate);
      const rate = Number(item.gst_rate);
      
      if (!summary[hsn]) {
        summary[hsn] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, rate };
      }
      
      summary[hsn].taxable += amount;
      if (invoice.gst_type === "CGST_SGST") {
        summary[hsn].cgst += (amount * rate) / 200;
        summary[hsn].sgst += (amount * rate) / 200;
      } else {
        summary[hsn].igst += (amount * rate) / 100;
      }
    });
    
    return summary;
  };

  const gstSummary = calculateGstSummary();

  return (
    <div className="bg-white text-[#1a1a1a] p-12 max-w-[850px] mx-auto shadow-2xl print:shadow-none print:p-0 font-sans" id="invoice-print">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-12">
        <div className="space-y-6">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-16 w-auto object-contain" />
          ) : (
            <div className="h-16 w-16 bg-brand/10 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-black text-brand italic">W</span>
            </div>
          )}
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{settings.company_name}</h2>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{settings.gstin ? `GSTIN: ${settings.gstin}` : 'UNREGISTERED'}</p>
          </div>
        </div>
        
        <div className="text-right space-y-2">
          <h1 className="text-7xl font-black uppercase tracking-tighter opacity-[0.03] absolute right-12 top-12 pointer-events-none select-none">Invoice</h1>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-1">Tax Invoice</p>
            <p className="text-3xl font-black tracking-tighter italic">#{invoice.invoice_number}</p>
            <div className="mt-4 space-y-1 text-xs font-medium text-muted-foreground">
              <p>Date: <span className="text-foreground font-bold">{format(new Date(invoice.date), "dd MMMM, yyyy")}</span></p>
              {invoice.due_date && <p>Due: <span className="text-foreground font-bold">{format(new Date(invoice.due_date), "dd MMMM, yyyy")}</span></p>}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-brand/50 via-transparent to-transparent mb-10" />

      {/* Address Grid */}
      <div className="grid grid-cols-2 gap-16 mb-12">
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-3">Sender Details</p>
            <div className="text-xs space-y-1.5 leading-relaxed">
              <p className="font-bold text-sm">{settings.company_name}</p>
              <p className="opacity-70 whitespace-pre-wrap max-w-[280px]">{settings.address}</p>
              <p className="opacity-70">{settings.state} ({settings.state_code})</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand mb-3">Recipient Details</p>
            <div className="text-xs space-y-1.5 leading-relaxed">
              <p className="font-black text-sm uppercase italic">{invoice.customers?.name}</p>
              <p className="opacity-70 whitespace-pre-wrap max-w-[280px]">{invoice.customers?.billing_address}</p>
              <div className="pt-1 space-y-1">
                <p className="text-[10px] font-bold"><span className="opacity-50 uppercase tracking-widest mr-2">GSTIN</span> {invoice.customers?.gstin || "URD"}</p>
                <p className="text-[10px] font-bold"><span className="opacity-50 uppercase tracking-widest mr-2">State</span> {invoice.customers?.state} ({invoice.customers?.state_code})</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-10 rounded-3xl overflow-hidden border border-gray-100">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <th className="py-4 px-6 text-left w-12">#</th>
              <th className="py-4 px-2 text-left">Description of Goods/Services</th>
              <th className="py-4 px-4 text-center w-24">HSN</th>
              <th className="py-4 px-4 text-center w-20">Qty</th>
              <th className="py-4 px-4 text-right w-32">Rate</th>
              <th className="py-4 px-6 text-right w-36 text-foreground">Net Amount</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {invoice.invoice_items?.map((item: any, idx: number) => (
              <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/30 transition-colors">
                <td className="py-5 px-6 text-muted-foreground font-mono text-[10px]">{String(idx + 1).padStart(2, '0')}</td>
                <td className="py-5 px-2">
                  <p className="font-bold text-[13px] tracking-tight">{item.description}</p>
                </td>
                <td className="py-5 px-4 text-center font-mono text-[10px] text-muted-foreground">{item.hsn_code || "—"}</td>
                <td className="py-5 px-4 text-center font-bold">{item.qty}</td>
                <td className="py-5 px-4 text-right font-medium text-muted-foreground">{formatCurrency(Number(item.rate))}</td>
                <td className="py-5 px-6 text-right font-black text-sm">{formatCurrency(Number(item.qty) * Number(item.rate))}</td>
              </tr>
            ))}
            {/* Pad with empty rows to maintain height */}
            {[...Array(Math.max(0, 4 - (invoice.invoice_items?.length || 0)))].map((_, i) => (
              <tr key={`empty-${i}`} className="h-12 border-t border-gray-50/50"><td colSpan={6}></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Area */}
      <div className="grid grid-cols-12 gap-10 items-start">
        <div className="col-span-7 space-y-8">
          {/* Tax Analysis */}
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">GST Tax Summary</p>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-[10px] border-collapse">
                <thead className="bg-gray-50/80 text-muted-foreground font-bold uppercase tracking-tighter">
                  <tr>
                    <th className="p-3 text-left">HSN/SAC</th>
                    <th className="p-3 text-right">Taxable</th>
                    {invoice.gst_type === "CGST_SGST" ? (
                      <>
                        <th className="p-3 text-right">CGST</th>
                        <th className="p-3 text-right">SGST</th>
                      </>
                    ) : (
                      <th className="p-3 text-right">IGST</th>
                    )}
                    <th className="p-3 text-right text-foreground font-black">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {Object.entries(gstSummary).map(([hsn, data]) => (
                    <tr key={hsn}>
                      <td className="p-3 font-mono text-muted-foreground">{hsn}</td>
                      <td className="p-3 text-right">{formatCurrency(data.taxable)}</td>
                      {invoice.gst_type === "CGST_SGST" ? (
                        <>
                          <td className="p-3 text-right">{formatCurrency(data.cgst)} <span className="text-[8px] opacity-40 ml-0.5">{data.rate/2}%</span></td>
                          <td className="p-3 text-right">{formatCurrency(data.sgst)} <span className="text-[8px] opacity-40 ml-0.5">{data.rate/2}%</span></td>
                        </>
                      ) : (
                        <td className="p-3 text-right">{formatCurrency(data.igst)} <span className="text-[8px] opacity-40 ml-0.5">{data.rate}%</span></td>
                      )}
                      <td className="p-3 text-right font-black text-brand">{formatCurrency(data.cgst + data.sgst + data.igst)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Logistics / Bank */}
          <div className="grid grid-cols-2 gap-6 p-6 rounded-3xl bg-gray-50/50 border border-gray-100">
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Bank Information</p>
              <div className="text-[10px] space-y-1 font-bold">
                <p className="text-xs font-black uppercase tracking-tight">{settings.bank_details?.bank_name}</p>
                <p className="opacity-60">A/C: <span className="font-mono text-foreground">{settings.bank_details?.account_no}</span></p>
                <p className="opacity-60">IFSC: <span className="font-mono text-foreground">{settings.bank_details?.ifsc}</span></p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Terms & Conditions</p>
              <p className="text-[9px] leading-relaxed italic text-muted-foreground font-medium">
                {invoice.notes || "1. Goods once sold will not be taken back. 2. Interest @ 18% p.a. will be charged for delayed payments."}
              </p>
            </div>
          </div>
        </div>

        {/* Totals Column */}
        <div className="col-span-5 space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-[#1a1a1a] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest opacity-40">
                <span>Untaxed Amount</span>
                <span>{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-brand">
                <span>Applied GST</span>
                <span>{formatCurrency(Number(invoice.total_tax))}</span>
              </div>
              <div className="h-px bg-white/10 my-4" />
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black tracking-[0.4em] opacity-40 text-center">Grand Total</p>
                <p className="text-4xl font-black text-center tracking-tighter italic">{formatCurrency(Number(invoice.total_amount))}</p>
              </div>
            </div>
          </div>
          
          <div className="px-4 text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Total in Words</p>
            <p className="text-[10px] font-bold italic leading-tight">{numberToIndianWords(Number(invoice.total_amount))}</p>
          </div>
        </div>
      </div>

      {/* Footer / Auth Section */}
      <div className="mt-20 flex justify-between items-end">
        <div className="text-center space-y-3">
          <div className="w-40 h-0.5 bg-gray-100" />
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Receiver Signature</p>
        </div>
        
        <div className="text-center space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">For {settings.company_name}</p>
            <div className="h-16 flex items-center justify-center">
              {/* Space for stamp/digital signature */}
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-64 h-1 bg-brand shadow-glow shadow-brand/20" />
            <p className="text-[11px] font-black uppercase tracking-[0.4em] italic">Authorized Signatory</p>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.8em] text-gray-200">Electronic Document • Computer Generated</p>
      </div>
    </div>
  );
}

