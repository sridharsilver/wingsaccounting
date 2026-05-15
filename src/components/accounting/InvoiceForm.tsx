import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Calculator } from "lucide-react";
import { useState, useEffect } from "react";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/accounting-utils";

const invoiceSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  date: z.string().min(1, "Date is required"),
  due_date: z.string().optional(),
  customer_id: z.string().min(1, "Customer is required"),
  place_of_supply: z.string().min(1, "Place of supply is required"),
  gst_type: z.enum(["CGST_SGST", "IGST"]),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    hsn_code: z.string().optional(),
    qty: z.coerce.number().min(0.01, "Qty must be > 0"),
    rate: z.coerce.number().min(0, "Rate must be >= 0"),
    gst_rate: z.coerce.number().min(0),
    amount: z.coerce.number(),
  })).min(1, "At least one item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InvoiceForm({ initialData, onSuccess, onCancel }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sellerSettings, setSellerSettings] = useState<any>(null);

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData || {
      invoice_number: "",
      date: new Date().toISOString().split("T")[0],
      gst_type: "CGST_SGST",
      items: [{ description: "", qty: 1, rate: 0, gst_rate: 18, amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({ control, name: "items" });
  const watchedGstType = watch("gst_type");
  const watchedCustomerId = watch("customer_id");

  useEffect(() => {
    async function fetchData() {
      const [custRes, prodRes, setRes] = await Promise.all([
        supabase.from("customers").select("*").order("name"),
        supabase.from("products").select("*").order("name"),
        supabase.from("settings").select("*").single(),
      ]);

      if (custRes.data) setCustomers(custRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      if (setRes.data) {
        setSellerSettings(setRes.data);
        if (!initialData) {
          const nextNum = setRes.data.next_invoice_number || 1;
          const prefix = setRes.data.invoice_prefix || "INV-";
          setValue("invoice_number", `${prefix}${nextNum.toString().padStart(4, "0")}`);
        }
      }
    }
    fetchData();
  }, [setValue, initialData]);

  // Auto-set GST type based on customer state
  useEffect(() => {
    if (watchedCustomerId && sellerSettings) {
      const customer = customers.find(c => c.id === watchedCustomerId);
      if (customer) {
        const isInterState = customer.state_code !== sellerSettings.state_code;
        setValue("gst_type", isInterState ? "IGST" : "CGST_SGST");
        setValue("place_of_supply", customer.state || "");
      }
    }
  }, [watchedCustomerId, sellerSettings, customers, setValue]);

  const totals = calculateInvoiceTotals(watchedItems, watchedGstType === "IGST");

  const onSubmit = async (values: InvoiceFormValues) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const invoicePayload = {
        ...values,
        user_id: session.user.id,
        subtotal: totals.subtotal,
        total_tax: totals.total_tax,
        total_amount: totals.total_amount,
        status: "sent", // default to sent for now
      };

      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .insert([invoicePayload])
        .select()
        .single();

      if (invError) throw invError;

      const itemsPayload = values.items.map(item => ({
        ...item,
        invoice_id: invoice.id,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      // Increment next invoice number in settings
      if (!initialData && sellerSettings) {
        await supabase
          .from("settings")
          .update({ next_invoice_number: (sellerSettings.next_invoice_number || 1) + 1 })
          .eq("id", sellerSettings.id);
      }

      toast.success("Invoice created successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.description`, product.name);
      setValue(`items.${index}.hsn_code`, product.hsn_code);
      setValue(`items.${index}.rate`, product.price);
      setValue(`items.${index}.gst_rate`, product.gst_rate);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-foreground/5 p-6 rounded-2xl border border-border">
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Invoice Number</label>
          <input {...register("invoice_number")} className="w-full p-3 rounded-xl border border-border bg-surface outline-none focus:ring-2 focus:ring-brand font-mono" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Invoice Date</label>
          <input type="date" {...register("date")} className="w-full p-3 rounded-xl border border-border bg-surface outline-none focus:ring-2 focus:ring-brand" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Due Date</label>
          <input type="date" {...register("due_date")} className="w-full p-3 rounded-xl border border-border bg-surface outline-none focus:ring-2 focus:ring-brand" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Customer</label>
          <select {...register("customer_id")} className="w-full p-3 rounded-xl border border-border bg-surface outline-none focus:ring-2 focus:ring-brand">
            <option value="">Select Customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.gstin || "No GSTIN"})</option>)}
          </select>
          {errors.customer_id && <p className="text-xs text-red-500">{errors.customer_id.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Place of Supply</label>
          <input {...register("place_of_supply")} className="w-full p-3 rounded-xl border border-border bg-surface outline-none focus:ring-2 focus:ring-brand" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2"><Calculator size={20} className="text-brand" /> Invoice Items</h3>
          <button type="button" onClick={() => append({ description: "", qty: 1, rate: 0, gst_rate: 18, amount: 0 })} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand/10 text-brand hover:bg-brand/20 transition-colors text-sm font-bold">
            <Plus size={16} /> Add Item
          </button>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden">
          {/* Desktop Table Header */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead className="bg-foreground/5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4 w-1/3">Product / Description</th>
                <th className="p-4">HSN</th>
                <th className="p-4 w-24">Qty</th>
                <th className="p-4 w-32">Rate</th>
                <th className="p-4 w-24">GST %</th>
                <th className="p-4 w-32 text-right">Amount</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fields.map((field, index) => (
                <tr key={field.id} className="group">
                  <td className="p-4">
                    <select 
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="w-full mb-2 p-2 rounded-lg border border-border bg-surface text-xs outline-none"
                    >
                      <option value="">Select a Product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input {...register(`items.${index}.description`)} className="w-full p-2 rounded-lg border border-border bg-surface text-sm outline-none focus:ring-1 focus:ring-brand" placeholder="Item description..." />
                  </td>
                  <td className="p-4">
                    <input {...register(`items.${index}.hsn_code`)} className="w-full p-2 rounded-lg border border-border bg-surface text-sm outline-none" />
                  </td>
                  <td className="p-4">
                    <input type="number" step="any" {...register(`items.${index}.qty`)} className="w-full p-2 rounded-lg border border-border bg-surface text-sm outline-none" />
                  </td>
                  <td className="p-4">
                    <input type="number" step="any" {...register(`items.${index}.rate`)} className="w-full p-2 rounded-lg border border-border bg-surface text-sm outline-none" />
                  </td>
                  <td className="p-4">
                    <input type="number" {...register(`items.${index}.gst_rate`)} className="w-full p-2 rounded-lg border border-border bg-surface text-sm outline-none" />
                  </td>
                  <td className="p-4 text-right font-bold text-sm">
                    {formatCurrency(Number(watchedItems?.[index]?.qty || 0) * Number(watchedItems?.[index]?.rate || 0))}
                  </td>
                  <td className="p-4">
                    <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-border">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 space-y-4 bg-surface/30">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <select 
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="w-full p-3 rounded-xl border border-border bg-surface text-sm outline-none"
                    >
                      <option value="">Select a Product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input {...register(`items.${index}.description`)} className="w-full p-3 rounded-xl border border-border bg-surface text-sm outline-none" placeholder="Item description..." />
                  </div>
                  <button type="button" onClick={() => remove(index)} className="p-3 text-red-500 bg-red-500/10 rounded-xl">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">HSN Code</label>
                    <input {...register(`items.${index}.hsn_code`)} className="w-full p-3 rounded-xl border border-border bg-surface text-sm outline-none" placeholder="HSN" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">GST %</label>
                    <input type="number" {...register(`items.${index}.gst_rate`)} className="w-full p-3 rounded-xl border border-border bg-surface text-sm outline-none" placeholder="18" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Quantity</label>
                    <input type="number" step="any" {...register(`items.${index}.qty`)} className="w-full p-3 rounded-xl border border-border bg-surface text-sm outline-none" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Rate</label>
                    <input type="number" step="any" {...register(`items.${index}.rate`)} className="w-full p-3 rounded-xl border border-border bg-surface text-sm outline-none" placeholder="0.00" />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Item Total</span>
                  <span className="text-lg font-black text-brand">
                    {formatCurrency(Number(watchedItems?.[index]?.qty || 0) * Number(watchedItems?.[index]?.rate || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notes</label>
            <textarea {...register("notes")} className="w-full p-3 rounded-xl border border-border bg-surface outline-none focus:ring-2 focus:ring-brand h-24" placeholder="Thanks for your business!" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Terms & Conditions</label>
            <textarea {...register("terms")} className="w-full p-3 rounded-xl border border-border bg-surface outline-none focus:ring-2 focus:ring-brand h-24" placeholder="Standard terms apply..." />
          </div>
        </div>

        <div className="bg-foreground/5 p-6 rounded-2xl border border-border space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-bold text-foreground">{formatCurrency(totals.subtotal)}</span>
          </div>
          {watchedGstType === "CGST_SGST" ? (
            <>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>CGST</span>
                <span className="font-bold text-foreground">{formatCurrency(totals.cgst)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>SGST</span>
                <span className="font-bold text-foreground">{formatCurrency(totals.sgst)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>IGST</span>
              <span className="font-bold text-foreground">{formatCurrency(totals.igst)}</span>
            </div>
          )}
          <div className="pt-4 border-t border-border flex justify-between items-center">
            <span className="font-bold text-lg">Total Amount</span>
            <span className="text-2xl font-black text-brand">{formatCurrency(totals.total_amount)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-border">
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl hover:bg-foreground/5 transition-colors font-bold uppercase tracking-widest text-xs">Cancel</button>
        <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl bg-gradient-brand text-brand-foreground font-bold uppercase tracking-widest text-xs shadow-glow hover:brightness-110 transition flex items-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Generate Invoice
        </button>
      </div>
    </form>
  );
}
