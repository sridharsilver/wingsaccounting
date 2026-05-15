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
    <div className="bg-white text-black p-10 max-w-[850px] mx-auto shadow-2xl print:shadow-none print:p-0" id="invoice-print">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-8">
        <div className="flex gap-6">
          {settings.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="h-20 w-auto object-contain" />
          )}
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-black leading-none mb-4">Invoice</h1>
            <div className="space-y-1 text-xs">
              <p className="font-black text-xl uppercase tracking-tight">{settings.company_name}</p>
              <p className="whitespace-pre-wrap max-w-xs opacity-80">{settings.address}</p>
              <p className="font-bold">GSTIN: <span className="font-mono">{settings.gstin}</span></p>
              <p className="font-bold">State: {settings.state} (Code: {settings.state_code})</p>
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-4">
          <div className="bg-black text-white p-4 rounded-2xl min-w-[200px]">
            <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60 mb-1">Invoice Number</p>
            <p className="text-2xl font-mono font-black">{invoice.invoice_number}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-right">
            <span className="font-bold opacity-60 uppercase tracking-widest text-[9px]">Date</span>
            <span className="font-bold">{format(new Date(invoice.date), "dd-MMM-yyyy")}</span>
            {invoice.due_date && (
              <>
                <span className="font-bold opacity-60 uppercase tracking-widest text-[9px]">Due Date</span>
                <span className="font-bold">{format(new Date(invoice.due_date), "dd-MMM-yyyy")}</span>
              </>
            )}
            <span className="font-bold opacity-60 uppercase tracking-widest text-[9px]">Place of Supply</span>
            <span className="font-bold">{invoice.place_of_supply}</span>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="mt-10 grid grid-cols-2 gap-12">
        <div className="space-y-3 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-black rounded-full" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Bill To</p>
          <div>
            <p className="font-black text-lg uppercase tracking-tight">{invoice.customers?.name}</p>
            <p className="text-xs mt-1 whitespace-pre-wrap opacity-80 leading-relaxed">{invoice.customers?.billing_address}</p>
            <div className="mt-3 space-y-0.5 text-xs">
              <p><span className="font-bold">GSTIN:</span> <span className="font-mono">{invoice.customers?.gstin || "URD"}</span></p>
              <p><span className="font-bold">State:</span> {invoice.customers?.state} ({invoice.customers?.state_code})</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 relative opacity-80">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gray-200 rounded-full" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Ship To</p>
          <p className="text-xs whitespace-pre-wrap leading-relaxed">{invoice.customers?.shipping_address || invoice.customers?.billing_address}</p>
        </div>
      </div>

      {/* Main Items Table */}
      <table className="w-full mt-12 border-collapse overflow-hidden rounded-t-xl">
        <thead>
          <tr className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
            <th className="p-4 text-left w-12">#</th>
            <th className="p-4 text-left">Description</th>
            <th className="p-4 text-center">HSN/SAC</th>
            <th className="p-4 text-center w-20">Qty</th>
            <th className="p-4 text-right w-32">Rate</th>
            <th className="p-4 text-right w-32">Amount</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {invoice.invoice_items?.map((item: any, idx: number) => (
            <tr key={item.id} className="border-b border-gray-100 group">
              <td className="p-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
              <td className="p-4">
                <p className="font-black uppercase tracking-tight">{item.description}</p>
              </td>
              <td className="p-4 text-center font-mono text-xs">{item.hsn_code || "-"}</td>
              <td className="p-4 text-center font-bold">{item.qty}</td>
              <td className="p-4 text-right font-mono text-xs">{formatCurrency(Number(item.rate))}</td>
              <td className="p-4 text-right font-black">{formatCurrency(Number(item.qty) * Number(item.rate))}</td>
            </tr>
          ))}
          {/* Minimum rows for aesthetic height */}
          {[...Array(Math.max(0, 4 - (invoice.invoice_items?.length || 0)))].map((_, i) => (
            <tr key={`empty-${i}`} className="h-12 border-b border-gray-50">
              <td colSpan={6}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Section */}
      <div className="mt-8 flex justify-between gap-12">
        <div className="flex-1 space-y-6">
          {/* GST Breakdown Table */}
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">GST Tax Breakdown</p>
            <table className="w-full text-[10px] border-collapse">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="p-2 text-left">HSN/SAC</th>
                  <th className="p-2 text-right">Taxable</th>
                  {invoice.gst_type === "CGST_SGST" ? (
                    <>
                      <th className="p-2 text-right">CGST</th>
                      <th className="p-2 text-right">SGST</th>
                    </>
                  ) : (
                    <th className="p-2 text-right">IGST</th>
                  )}
                  <th className="p-2 text-right">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(gstSummary).map(([hsn, data]) => (
                  <tr key={hsn}>
                    <td className="p-2 font-mono">{hsn}</td>
                    <td className="p-2 text-right font-bold">{formatCurrency(data.taxable)}</td>
                    {invoice.gst_type === "CGST_SGST" ? (
                      <>
                        <td className="p-2 text-right">{formatCurrency(data.cgst)} <span className="opacity-40 ml-1">({data.rate/2}%)</span></td>
                        <td className="p-2 text-right">{formatCurrency(data.sgst)} <span className="opacity-40 ml-1">({data.rate/2}%)</span></td>
                      </>
                    ) : (
                      <td className="p-2 text-right">{formatCurrency(data.igst)} <span className="opacity-40 ml-1">({data.rate}%)</span></td>
                    )}
                    <td className="p-2 text-right font-black">{formatCurrency(data.cgst + data.sgst + data.igst)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex gap-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Bank Details</p>
              <p className="text-xs font-black">{settings.bank_details?.bank_name}</p>
              <p className="text-[10px] opacity-70">A/c: <span className="font-mono font-bold">{settings.bank_details?.account_no}</span></p>
              <p className="text-[10px] opacity-70">IFSC: <span className="font-mono font-bold">{settings.bank_details?.ifsc}</span></p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="flex-1 space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Notes & Terms</p>
              <p className="text-[10px] leading-relaxed italic opacity-70">{invoice.terms || settings.terms || "1. Goods once sold will not be taken back. 2. Interest @ 18% will be charged if not paid within due date."}</p>
            </div>
          </div>
        </div>

        <div className="w-[300px] space-y-3">
          <div className="space-y-2 border-b border-gray-100 pb-3">
            <div className="flex justify-between text-xs">
              <span className="font-bold opacity-60">Subtotal</span>
              <span className="font-bold">{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            <div className="flex justify-between text-xs text-brand">
              <span className="font-bold opacity-60">Total Tax (GST)</span>
              <span className="font-bold">{formatCurrency(Number(invoice.total_tax))}</span>
            </div>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-black uppercase tracking-tighter">Grand Total</span>
            <span className="text-2xl font-black">{formatCurrency(Number(invoice.total_amount))}</span>
          </div>
          <div className="bg-black text-white p-3 rounded-xl">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-1 text-center">Amount in Words</p>
            <p className="text-[10px] font-bold text-center italic">{numberToIndianWords(Number(invoice.total_amount))}</p>
          </div>
        </div>
      </div>

      {/* Footer / Signatures */}
      <div className="mt-16 pt-16 flex justify-between items-end border-t border-gray-100">
        <div className="text-center space-y-2">
          <div className="w-48 h-px bg-gray-200" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em]">Receiver's Signature</p>
        </div>
        <div className="text-center space-y-4">
          <p className="text-[10px] font-bold italic opacity-60">For {settings.company_name}</p>
          <div className="h-12" /> {/* Space for seal/sign */}
          <div className="space-y-1">
            <div className="w-56 h-0.5 bg-black" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Authorized Signatory</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[8px] font-bold uppercase tracking-[0.5em] text-gray-300">This is a computer generated invoice</p>
      </div>
    </div>
  );
}
