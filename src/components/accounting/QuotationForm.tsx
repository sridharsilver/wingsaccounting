import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/accounting-utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { STATE_NAMES, INDIAN_STATES, COMMON_HSN_CODES } from "@/lib/constants";

const quotationSchema = z.object({
  quotation_number: z.string().min(1, "Quotation number is required"),
  date: z.string().min(1, "Date is required"),
  customer_id: z.string().min(1, "Customer is required"),
  place_of_supply: z.string().min(1, "Place of supply is required"),
  place_of_supply_code: z.string().optional(),
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

  const { register, control, handleSubmit, setValue, reset, formState: { errors } } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: initialData || {
      quotation_number: `QTN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split("T")[0],
      items: [{ description: "", qty: 1, rate: 0, gst_rate: 18, amount: 0 }],
    },
  });

  // Reset form when initialData is loaded (for editing)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

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

      let quotation;
      if (initialData?.id) {
        const { data, error: qtnError } = await supabase
          .from("quotations")
          .update(qtnPayload)
          .eq("id", initialData.id)
          .select()
          .single();
        if (qtnError) throw qtnError;
        quotation = data;

        // Delete existing items to replace them
        const { error: delError } = await supabase
          .from("quotation_items")
          .delete()
          .eq("quotation_id", initialData.id);
        if (delError) throw delError;
      } else {
        const { data, error: qtnError } = await supabase
          .from("quotations")
          .insert([qtnPayload])
          .select()
          .single();
        if (qtnError) throw qtnError;
        quotation = data;
      }

      const itemsPayload = values.items.map(item => {
        const { product_id, ...itemData } = item;
        return {
          ...itemData,
          quotation_id: quotation.id,
        };
      });

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Basic Info */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Quotation Number</label>
            <input {...register("quotation_number")} className="w-full h-11 px-4 rounded-2xl border border-border/50 bg-foreground/[0.03] outline-none focus:ring-2 focus:ring-brand/50 font-mono font-bold text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Customer Selection</label>
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={customers.map(c => ({
                    label: c.name,
                    value: c.id,
                    description: c.gstin || "No GSTIN"
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Find or Select Customer..."
                  searchPlaceholder="Search customers by name..."
                />
              )}
            />
            {errors.customer_id && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.customer_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Document Date</label>
            <input type="date" {...register("date")} className="w-full h-11 px-4 rounded-2xl border border-border/50 bg-foreground/[0.03] outline-none focus:ring-2 focus:ring-brand/50 font-bold text-sm" />
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Supply Destination</label>
            <Controller
              name="place_of_supply"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={STATE_NAMES.map(state => ({
                    label: state,
                    value: state
                  }))}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    const state = INDIAN_STATES.find(s => s.name === val);
                    if (state) {
                      setValue("place_of_supply_code", state.code);
                    }
                  }}
                  placeholder="Select State..."
                  searchPlaceholder="Search state..."
                />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">State Code</label>
            <input 
              {...register("place_of_supply_code")} 
              className="w-full h-11 px-4 rounded-2xl border border-border/50 bg-foreground/[0.03] outline-none focus:ring-2 focus:ring-brand/50 font-bold text-sm" 
              placeholder="Code"
              maxLength={2}
              readOnly
            />
          </div>
        </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Reference (Optional)</label>
            <input className="w-full h-11 px-4 rounded-2xl border border-border/50 bg-foreground/[0.03] outline-none focus:ring-2 focus:ring-brand/50 font-bold text-sm" placeholder="e.g. Inquiry #123" />
          </div>
        </div>

        {/* Status Info */}
        <div className="lg:col-span-4 bg-brand/[0.03] p-6 rounded-3xl border border-brand/10 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand ml-1">Estimation Validity</label>
            <select className="w-full h-11 px-4 rounded-2xl border border-brand/20 bg-background outline-none focus:ring-2 focus:ring-brand font-bold text-sm">
              <option>Valid for 7 Days</option>
              <option>Valid for 15 Days</option>
              <option>Valid for 30 Days</option>
              <option>Custom Date</option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Document Status</span>
            <span className="px-3 py-1 rounded-full bg-brand/10 text-brand text-[9px] font-black uppercase tracking-tighter border border-brand/20">
              Draft Mode
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Quotation Items</h3>
          <button type="button" onClick={() => append({ description: "", qty: 1, rate: 0, gst_rate: 18, amount: 0 })} className="text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-brand/20 text-brand hover:bg-brand/5 transition-all">
            + Add Entry
          </button>
        </div>

        <div className="rounded-3xl border border-border/50 overflow-hidden bg-background/20 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-foreground/[0.03] text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-border/30">
              <tr>
                <th className="p-4 w-[35%]">Line Item / Service Description</th>
                <th className="p-4 w-[15%]">HSN/SAC</th>
                <th className="p-4 w-[10%]">Qty</th>
                <th className="p-4 w-[15%]">Unit Rate</th>
                <th className="p-4 w-[20%] text-right">Net Value</th>
                <th className="p-4 w-[5%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {fields.map((field, index) => (
                <tr key={field.id} className="group hover:bg-brand/[0.01] transition-colors">
                  <td className="p-4">
                    <div className="space-y-2">
                      <Controller
                        name={`items.${index}.product_id`}
                        control={control}
                        render={({ field }) => (
                          <Select 
                            onValueChange={(val) => {
                              field.onChange(val);
                              handleProductSelect(index, val);
                            }} 
                            value={field.value}
                          >
                            <SelectTrigger className="w-full h-9 px-3 rounded-lg border border-border/30 bg-background text-xs font-bold outline-none focus:ring-1 focus:ring-brand/50">
                              <SelectValue placeholder="Quick Select Product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <input {...register(`items.${index}.description`)} className="w-full h-9 px-3 rounded-lg border border-border/30 bg-background text-xs font-medium outline-none focus:ring-1 focus:ring-brand/50" placeholder="Describe the service or good..." />
                    </div>
                  </td>
                  <td className="p-4">
                    <Controller
                      name={`items.${index}.hsn_code`}
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={COMMON_HSN_CODES.map(h => ({
                            label: `${h.code} - ${h.label}`,
                            value: h.code
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="HSN"
                          searchPlaceholder="Search HSN/SAC..."
                          className="w-full"
                        />
                      )}
                    />
                  </td>
                  <td className="p-4">
                    <input type="text" inputMode="decimal" {...register(`items.${index}.qty`)} className="w-full h-9 px-3 rounded-lg border border-border/30 bg-background text-xs font-bold outline-none text-center" />
                  </td>
                  <td className="p-4">
                    <input type="text" inputMode="decimal" {...register(`items.${index}.rate`)} className="w-full h-9 px-3 rounded-lg border border-border/30 bg-background text-xs font-bold outline-none text-right" />
                  </td>
                  <td className="p-4 text-right font-black text-sm italic">
                    {formatCurrency(Number(watchedItems?.[index]?.qty || 0) * Number(watchedItems?.[index]?.rate || 0))}
                  </td>
                  <td className="p-4 text-center">
                    <button type="button" onClick={() => remove(index)} className="size-8 grid place-items-center text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all mx-auto">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-border/30">
        <div className="lg:col-span-7">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Additional Terms / Validity Notes</label>
            <textarea {...register("notes")} className="w-full p-4 rounded-2xl border border-border/50 bg-foreground/[0.02] outline-none focus:ring-2 focus:ring-brand/50 h-32 text-xs" placeholder="e.g. Delivery within 7 days, payment 50% advance..." />
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4 bg-surface/50">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand">Total Estimate</span>
                <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest italic">Includes GST if applicable</span>
              </div>
              <span className="text-4xl font-black text-foreground tracking-tighter italic">
                {formatCurrency(totals.total_amount)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 h-12 rounded-2xl border border-border/50 hover:bg-foreground/5 transition-all font-black uppercase tracking-[0.2em] text-[10px]"
            >
              Discard
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-[2] h-12 rounded-2xl bg-brand text-brand-foreground font-black uppercase tracking-[0.2em] text-[10px] shadow-glow hover:brightness-110 transition flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Authorize & Generate"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
