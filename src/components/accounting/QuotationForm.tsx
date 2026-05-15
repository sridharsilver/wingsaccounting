import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/accounting-utils";

const quotationSchema = z.object({
  quotation_number: z.string().min(1, "Quotation number is required"),
  date: z.string().min(1, "Date is required"),
  customer_id: z.string().min(1, "Customer is required"),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    qty: z.coerce.number().min(0.01, "Qty must be > 0"),
    rate: z.coerce.number().min(0, "Rate must be >= 0"),
    gst_rate: z.coerce.number().min(0),
    amount: z.coerce.number(),
  })).min(1, "At least one item is required"),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

interface QuotationFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function QuotationForm({ initialData, onSuccess, onCancel }: QuotationFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: initialData || {
      quotation_number: `QTN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split("T")[0],
      items: [{ description: "", qty: 1, rate: 0, gst_rate: 18, amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });

  useEffect(() => {
    async function fetchData() {
      const [custRes, prodRes] = await Promise.all([
        supabase.from("customers").select("*").order("name"),
        supabase.from("products").select("*").order("name"),
      ]);
      if (custRes.data) setCustomers(custRes.data);
      if (prodRes.data) setProducts(prodRes.data);
    }
    fetchData();
  }, []);

  const totals = calculateInvoiceTotals(watchedItems, false); // Just for subtotal/total

  const onSubmit = async (values: QuotationFormValues) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const qtnPayload = {
        ...values,
        user_id: session.user.id,
        total_amount: totals.total_amount,
        status: "draft",
      };

      const { data: quotation, error: qtnError } = await supabase
        .from("quotations")
        .insert([qtnPayload])
        .select()
        .single();

      if (qtnError) throw qtnError;

      const itemsPayload = values.items.map(item => ({
        ...item,
        quotation_id: quotation.id,
      }));

      const { error: itemsError } = await supabase
        .from("quotation_items")
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      toast.success("Quotation created successfully");
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
      setValue(`items.${index}.rate`, product.price);
      setValue(`items.${index}.gst_rate`, product.gst_rate);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-foreground/5 p-6 rounded-2xl border border-border">
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quotation Number</label>
          <input {...register("quotation_number")} className="w-full p-3 rounded-xl border border-border bg-surface outline-none font-mono" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Date</label>
          <input type="date" {...register("date")} className="w-full p-3 rounded-xl border border-border bg-surface outline-none" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Customer</label>
        <select {...register("customer_id")} className="w-full p-3 rounded-xl border border-border bg-surface outline-none">
          <option value="">Select Customer</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.customer_id && <p className="text-xs text-red-500">{errors.customer_id.message}</p>}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Quotation Items</h3>
          <button type="button" onClick={() => append({ description: "", qty: 1, rate: 0, gst_rate: 18, amount: 0 })} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand/10 text-brand hover:bg-brand/20 transition-colors text-sm font-bold">
            <Plus size={16} /> Add Item
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left border-collapse">
            <thead className="bg-foreground/5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4 w-1/3">Item Details</th>
                <th className="p-4 w-24">Qty</th>
                <th className="p-4 w-32">Rate</th>
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
                    <input {...register(`items.${index}.description`)} className="w-full p-2 rounded-lg border border-border bg-surface text-sm outline-none" placeholder="Item description..." />
                  </td>
                  <td className="p-4">
                    <input type="number" step="any" {...register(`items.${index}.qty`)} className="w-full p-2 rounded-lg border border-border bg-surface text-sm outline-none" />
                  </td>
                  <td className="p-4">
                    <input type="number" step="any" {...register(`items.${index}.rate`)} className="w-full p-2 rounded-lg border border-border bg-surface text-sm outline-none" />
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
        </div>
      </div>

      <div className="flex justify-between items-end gap-8 pt-6 border-t border-border">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notes</label>
          <textarea {...register("notes")} className="w-full p-3 rounded-xl border border-border bg-surface outline-none h-24" placeholder="Quotation valid for 30 days..." />
        </div>
        <div className="w-80 bg-foreground/5 p-6 rounded-2xl border border-border">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Total Estimate</span>
            <span className="text-2xl font-black text-brand">{formatCurrency(totals.total_amount)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl hover:bg-foreground/5 transition-colors font-bold uppercase tracking-widest text-xs">Cancel</button>
        <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl bg-gradient-brand text-brand-foreground font-bold uppercase tracking-widest text-xs shadow-glow hover:brightness-110 transition flex items-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Generate Quotation
        </button>
      </div>
    </form>
  );
}
