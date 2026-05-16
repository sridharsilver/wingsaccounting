import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Calculator, ChevronDown } from "lucide-react";
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

const invoiceSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  date: z.string().min(1, "Date is required"),
  due_date: z.string().optional(),
  customer_id: z.string().min(1, "Customer is required"),
  place_of_supply: z.string().min(1, "Place of supply is required"),
  place_of_supply_code: z.string().optional(),
  gst_type: z.enum(["CGST_SGST", "IGST"]),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid().optional().nullable(),
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

  const [isAutoNumber, setIsAutoNumber] = useState(!initialData);

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
        supabase.from("settings").select("*").maybeSingle(),
      ]);

      if (custRes.data) setCustomers(custRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      if (setRes.data) {
        setSellerSettings(setRes.data);
        if (!initialData) {
          if (isAutoNumber) {
            const nextNum = setRes.data.next_invoice_number || 1;
            const prefix = setRes.data.invoice_prefix || "INV-";
            setValue("invoice_number", `${prefix}${nextNum.toString().padStart(4, "0")}`);
          }
          setValue("place_of_supply", setRes.data.state || "Tamil Nadu");
          setValue("place_of_supply_code", setRes.data.state_code || "33");
        }
      } else {
        // Default settings if none found
        if (!initialData && isAutoNumber) {
          setValue("invoice_number", `INV-${Math.floor(1000 + Math.random() * 9000)}`);
        }
      }
    }
    fetchData();
  }, [setValue, initialData, isAutoNumber]);

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

      const { items, ...invoiceData } = values;
      const invoicePayload = {
        ...invoiceData,
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Basic Info */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Secure Invoice Number</label>
              <button 
                type="button" 
                onClick={() => setIsAutoNumber(!isAutoNumber)}
                className={`text-[8px] font-bold px-2 py-0.5 rounded-full border transition-all ${isAutoNumber ? 'bg-brand/10 border-brand/20 text-brand' : 'bg-muted border-border text-muted-foreground'}`}
              >
                {isAutoNumber ? "Auto" : "Manual"}
              </button>
            </div>
            <div className="relative group">
              <input 
                {...register("invoice_number")} 
                readOnly={isAutoNumber}
                className={`w-full h-11 px-4 rounded-2xl border border-border/50 bg-foreground/[0.03] outline-none focus:ring-2 focus:ring-brand/50 font-mono font-bold text-sm tracking-tighter ${isAutoNumber ? 'text-brand cursor-not-allowed opacity-80' : 'text-foreground'}`} 
              />
              {isAutoNumber && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-brand animate-pulse" />
                  <span className="text-[8px] font-black text-brand/40 uppercase tracking-widest">Secured</span>
                </div>
              )}
            </div>
            {errors.invoice_number && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.invoice_number.message}</p>}
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
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    const state = INDIAN_STATES.find(s => s.name === val);
                    if (state) {
                      setValue("place_of_supply_code", state.code);
                    }
                  }}
                  value={field.value}
                >
                  <SelectTrigger className="w-full h-11 px-4 rounded-2xl border border-border/50 bg-foreground/[0.03] outline-none focus:ring-2 focus:ring-brand/50 font-bold text-sm">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(state => (
                      <SelectItem key={state.code} value={state.name}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        </div>

        {/* Secondary Info */}
        <div className="lg:col-span-4 bg-brand/[0.03] p-6 rounded-3xl border border-brand/10 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand ml-1">Maturity Date (Due)</label>
            <input type="date" {...register("due_date")} className="w-full h-11 px-4 rounded-2xl border border-brand/20 bg-background outline-none focus:ring-2 focus:ring-brand font-bold text-sm" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">GST Framework</span>
            <span className="px-3 py-1 rounded-full bg-brand text-brand-foreground text-[9px] font-black uppercase tracking-tighter">
              {watchedGstType === "IGST" ? "Inter-State (IGST)" : "Intra-State (CGST/SGST)"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Invoice Items</h3>
          <button type="button" onClick={() => append({ description: "", qty: 1, rate: 0, gst_rate: 18, amount: 0 })} className="text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-brand/20 text-brand hover:bg-brand/5 transition-all">
            + Add Entry
          </button>
        </div>

        <div className="rounded-3xl border border-border/50 overflow-hidden bg-background/20 backdrop-blur-sm">
          {/* Desktop Table Header */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead className="bg-foreground/[0.03] text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-border/30">
              <tr>
                <th className="p-4 w-[35%]">Line Item / Product</th>
                <th className="p-4 w-[12%]">HSN/SAC</th>
                <th className="p-4 w-[10%]">Qty</th>
                <th className="p-4 w-[15%]">Unit Rate</th>
                <th className="p-4 w-[8%] text-center">GST %</th>
                <th className="p-4 w-[15%] text-right">Net Value</th>
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
                          <Combobox
                            options={products.map(p => ({
                              label: p.name,
                              value: p.id,
                              description: `${formatCurrency(p.price)} | ${p.gst_rate}% GST`
                            }))}
                            value={field.value}
                            onChange={(val) => {
                              // If it's an ID (exists in products), auto-fill
                              const product = products.find(p => p.id === val);
                              if (product) {
                                field.onChange(val);
                                handleProductSelect(index, val);
                              } else {
                                // If it's a custom name
                                field.onChange(null); // Clear product_id for manual entry
                                setValue(`items.${index}.description`, val);
                                // Optional: You could also clear HSN/Rate if desired
                              }
                            }}
                            placeholder="Search or Type Product..."
                            searchPlaceholder="Type product name..."
                            className="h-9 rounded-lg"
                            allowCustom={true}
                          />
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
                          allowCustom={true}
                        />
                      )}
                    />
                  </td>
                  <td className="p-4 text-center">
                    <input type="number" step="any" {...register(`items.${index}.qty`)} className="w-full h-9 px-3 rounded-lg border border-border/30 bg-background text-xs font-bold outline-none text-center" />
                  </td>
                  <td className="p-4 text-center">
                    <input type="number" step="any" {...register(`items.${index}.rate`)} className="w-full h-9 px-3 rounded-lg border border-border/30 bg-background text-xs font-bold outline-none text-right" />
                  </td>
                  <td className="p-4 text-center">
                    <input type="number" {...register(`items.${index}.gst_rate`)} className="w-full h-9 px-3 rounded-lg border border-border/30 bg-background text-xs font-bold text-center outline-none" />
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

          {/* Mobile remains cards but with cleaned rounded corners */}
          <div className="md:hidden divide-y divide-border/20">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 space-y-4 bg-surface/20">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <select 
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-border/30 bg-surface text-sm outline-none"
                    >
                      <option value="">Select a Product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input {...register(`items.${index}.description`)} className="w-full p-2.5 rounded-lg border border-border/30 bg-surface text-sm outline-none" placeholder="Item description..." />
                  </div>
                  <button type="button" onClick={() => remove(index)} className="p-2.5 text-red-500 bg-red-500/10 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input {...register(`items.${index}.hsn_code`)} className="w-full p-2.5 rounded-lg border border-border/30 bg-surface text-xs" placeholder="HSN" />
                  <input type="number" {...register(`items.${index}.gst_rate`)} className="w-full p-2.5 rounded-lg border border-border/30 bg-surface text-xs" placeholder="GST %" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="number" step="any" {...register(`items.${index}.qty`)} className="w-full p-2.5 rounded-lg border border-border/30 bg-surface text-xs font-bold" placeholder="Qty" />
                  <input type="number" step="any" {...register(`items.${index}.rate`)} className="w-full p-2.5 rounded-lg border border-border/30 bg-surface text-xs font-bold" placeholder="Rate" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-border/30">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Special Notes / Memo</label>
            <textarea {...register("notes")} className="w-full p-4 rounded-2xl border border-border/50 bg-foreground/[0.02] outline-none focus:ring-2 focus:ring-brand/50 h-24 text-xs" placeholder="Additional instructions or greetings..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Terms & Conditions</label>
            <textarea {...register("terms")} className="w-full p-4 rounded-2xl border border-border/50 bg-foreground/[0.02] outline-none focus:ring-2 focus:ring-brand/50 h-24 text-xs" placeholder="Define payment terms and legal clauses..." />
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4 bg-surface/50">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Gross Subtotal</span>
              <span className="text-foreground">{formatCurrency(totals.subtotal)}</span>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-white/5">
              {watchedGstType === "CGST_SGST" ? (
                <>
                  <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                    <span>Central Tax (CGST)</span>
                    <span className="text-foreground">{formatCurrency(totals.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                    <span>State Tax (SGST)</span>
                    <span className="text-foreground">{formatCurrency(totals.sgst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                  <span>Integrated Tax (IGST)</span>
                  <span className="text-foreground">{formatCurrency(totals.igst)}</span>
                </div>
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-brand/20 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand">Grand Total</span>
                <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">Taxes Included</span>
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
