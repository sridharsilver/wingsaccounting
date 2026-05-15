import { format } from "date-fns";
import { formatCurrency } from "@/lib/accounting-utils";

interface InvoicePrintProps {
  invoice: any;
  settings: any;
}

export function InvoicePrint({ invoice, settings }: InvoicePrintProps) {
  if (!invoice || !settings) return null;

  return (
    <div className="bg-white text-black p-8 max-w-[800px] mx-auto shadow-lg print:shadow-none print:p-0" id="invoice-print">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-brand">TAX INVOICE</h1>
          <div className="mt-4 space-y-1 text-sm">
            <p className="font-bold text-lg">{settings.company_name}</p>
            <p className="whitespace-pre-wrap max-w-xs">{settings.address}</p>
            <p className="font-bold">GSTIN: {settings.gstin}</p>
            <p>State: {settings.state} ({settings.state_code})</p>
          </div>
        </div>
        <div className="text-right space-y-2">
          <div className="bg-black text-white px-4 py-2 rounded-lg">
            <p className="text-xs uppercase font-bold tracking-widest opacity-70">Invoice Number</p>
            <p className="text-xl font-mono font-bold">{invoice.invoice_number}</p>
          </div>
          <div className="text-sm">
            <p><span className="font-bold uppercase text-[10px] opacity-60">Date:</span> {format(new Date(invoice.date), "dd-MM-yyyy")}</p>
            {invoice.due_date && <p><span className="font-bold uppercase text-[10px] opacity-60">Due Date:</span> {format(new Date(invoice.due_date), "dd-MM-yyyy")}</p>}
            <p><span className="font-bold uppercase text-[10px] opacity-60">Place of Supply:</span> {invoice.place_of_supply}</p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="space-y-2 border-l-4 border-brand pl-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bill To:</p>
          <p className="font-bold text-lg">{invoice.customers?.name}</p>
          <p className="text-sm whitespace-pre-wrap">{invoice.customers?.billing_address}</p>
          <p className="text-sm font-bold">GSTIN: {invoice.customers?.gstin || "N/A"}</p>
          <p className="text-sm">State: {invoice.customers?.state} ({invoice.customers?.state_code})</p>
        </div>
        <div className="space-y-2 border-l-4 border-gray-200 pl-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ship To:</p>
          <p className="text-sm whitespace-pre-wrap">{invoice.customers?.shipping_address || invoice.customers?.billing_address}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mt-10 border-collapse">
        <thead>
          <tr className="bg-black text-white text-xs uppercase tracking-widest">
            <th className="p-3 text-left border border-black">#</th>
            <th className="p-3 text-left border border-black w-1/2">Description</th>
            <th className="p-3 text-center border border-black">HSN</th>
            <th className="p-3 text-center border border-black">Qty</th>
            <th className="p-3 text-right border border-black">Rate</th>
            <th className="p-3 text-right border border-black">Amount</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {invoice.invoice_items?.map((item: any, idx: number) => (
            <tr key={item.id} className="border-b border-gray-300">
              <td className="p-3 border-x border-gray-300">{idx + 1}</td>
              <td className="p-3 border-x border-gray-300">
                <p className="font-bold">{item.description}</p>
              </td>
              <td className="p-3 text-center border-x border-gray-300">{item.hsn_code || "-"}</td>
              <td className="p-3 text-center border-x border-gray-300">{item.qty}</td>
              <td className="p-3 text-right border-x border-gray-300">{formatCurrency(Number(item.rate))}</td>
              <td className="p-3 text-right border-x border-gray-300 font-bold">{formatCurrency(Number(item.qty) * Number(item.rate))}</td>
            </tr>
          ))}
          {/* Fill empty rows to maintain height */}
          {[...Array(Math.max(0, 5 - (invoice.invoice_items?.length || 0)))].map((_, i) => (
            <tr key={`empty-${i}`} className="h-10 border-b border-gray-300">
              <td className="p-3 border-x border-gray-300"></td>
              <td className="p-3 border-x border-gray-300"></td>
              <td className="p-3 border-x border-gray-300"></td>
              <td className="p-3 border-x border-gray-300"></td>
              <td className="p-3 border-x border-gray-300"></td>
              <td className="p-3 border-x border-gray-300"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & GST Breakdown */}
      <div className="mt-6 flex justify-between">
        <div className="w-1/2 space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Bank Details</p>
            <p className="text-sm font-bold">{settings.bank_details?.bank_name}</p>
            <p className="text-xs">A/c No: {settings.bank_details?.account_no}</p>
            <p className="text-xs">IFSC: {settings.bank_details?.ifsc}</p>
          </div>
          <div className="text-xs italic text-gray-500">
            <p className="font-bold not-italic text-black">Terms & Conditions:</p>
            <p className="whitespace-pre-wrap">{invoice.terms || settings.terms || "Goods once sold will not be taken back."}</p>
          </div>
        </div>
        <div className="w-1/3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span className="font-bold">{formatCurrency(Number(invoice.subtotal))}</span>
          </div>
          {invoice.gst_type === "CGST_SGST" ? (
            <>
              <div className="flex justify-between text-xs text-gray-600">
                <span>CGST (9%):</span>
                <span>{formatCurrency(Number(invoice.total_tax) / 2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>SGST (9%):</span>
                <span>{formatCurrency(Number(invoice.total_tax) / 2)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-xs text-gray-600">
              <span>IGST (18%):</span>
              <span>{formatCurrency(Number(invoice.total_tax))}</span>
            </div>
          )}
          <div className="pt-2 border-t-2 border-black flex justify-between items-center text-lg font-black">
            <span>TOTAL:</span>
            <span className="text-brand">{formatCurrency(Number(invoice.total_amount))}</span>
          </div>
          <p className="text-[10px] text-right text-gray-500 italic mt-2">Amount in words: Rupees {Number(invoice.total_amount).toLocaleString("en-IN")} Only</p>
        </div>
      </div>

      {/* Signature */}
      <div className="mt-16 flex justify-between items-end">
        <div className="text-center">
          <div className="w-48 border-b border-black mb-2"></div>
          <p className="text-xs uppercase font-bold">Customer Signature</p>
        </div>
        <div className="text-center">
          <p className="text-xs mb-10">For {settings.company_name}</p>
          <div className="w-48 border-b border-black mb-2"></div>
          <p className="text-xs uppercase font-bold">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
