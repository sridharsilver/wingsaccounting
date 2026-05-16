import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Search, Building2 } from "lucide-react";
import { useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { INDIAN_STATES } from "@/lib/constants";

const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  gstin: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  billing_address: z.string().optional(),
  shipping_address: z.string().optional(),
  state: z.string().min(1, "State is required"),
  state_code: z.string().length(2, "State code must be 2 digits"),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomerForm({ initialData, onSuccess, onCancel }: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingGst, setFetchingGst] = useState(false);

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      state: "Tamil Nadu",
      state_code: "33",
    },
  });

  const gstinValue = watch("gstin");

  const fetchGstDetails = async () => {
    if (!gstinValue || gstinValue.length < 15) {
      toast.error("Please enter a valid 15-digit GSTIN");
      return;
    }

    const apiKey = import.meta.env.VITE_GST_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      setFetchingGst(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.info("Simulation Mode: Add VITE_GST_API_KEY to your .env file to enable real lookup.", {
        description: "Visit gstincheck.co.in or appyflow.in to get an API key."
      });
      setFetchingGst(false);
      return;
    }

    setFetchingGst(true);
    try {
      // Using local proxy with correct gstincheck.co.in URL format
      const response = await fetch(`/api-gst/check/${apiKey}/${gstinValue}`);
      
      const resData = await response.json();
      
      if (resData.flag || resData.valid || resData.success) {
        const data = resData.data || resData;
        
        // Map legal name
        setValue("name", data.lgnm || data.legal_name || data.trade_name || data.lgnm || "");
        
        // Map Address
        if (data.pradr?.addr) {
          const addr = data.pradr.addr;
          const fullAddr = `${addr.bnm || ""} ${addr.st || ""} ${addr.loc || ""} ${addr.dst || ""} ${addr.stcd || ""} ${addr.pncd || ""}`.trim();
          setValue("billing_address", fullAddr);
        } else if (data.address) {
          if (typeof data.address === 'object') {
            const { building_name, city, pincode, state } = data.address;
            setValue("billing_address", `${building_name || ""} ${city || ""} ${pincode || ""}`.trim());
          } else {
            setValue("billing_address", data.address);
          }
        }

        // Map State
        const stateName = data.pradr?.addr?.stcd || data.state_name || data.state || "";
        if (stateName) setValue("state", stateName);
        
        setValue("state_code", gstinValue.substring(0, 2));
        
        toast.success("Customer details synchronized!");
      } else {
        throw new Error(resData.message || "Invalid GSTIN or API error");
      }
    } catch (error: any) {
      toast.error("GST Lookup Error: " + error.message);
    } finally {
      setFetchingGst(false);
    }
  };

  const onSubmit = async (values: CustomerFormValues) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const payload = {
        ...values,
        user_id: session.user.id,
      };

      let error;
      if (initialData?.id) {
        ({ error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", initialData.id));
      } else {
        ({ error } = await supabase
          .from("customers")
          .insert([payload]));
      }

      if (error) throw error;

      toast.success(initialData ? "Customer updated" : "Customer added");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium flex items-center gap-2">
            GSTIN 
            <span className="text-[10px] text-muted-foreground">(Enter first to auto-fill)</span>
          </label>
          <div className="flex gap-2">
            <input 
              {...register("gstin")}
              className="flex-1 p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand uppercase font-mono"
              placeholder="33XXXXX0000X1Z1"
              maxLength={15}
            />
            <button
              type="button"
              onClick={fetchGstDetails}
              disabled={fetchingGst}
              className="px-3 py-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
            >
              {fetchingGst ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Fetch
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Customer Name *</label>
          <input 
            {...register("name")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
            placeholder="Legal Business Name"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Phone</label>
          <input 
            {...register("phone")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
            placeholder="+91 9876543210"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input 
            {...register("email")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">State *</label>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Combobox
                options={INDIAN_STATES.map(s => ({
                  label: s.name,
                  value: s.name
                }))}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  const selectedState = INDIAN_STATES.find(s => s.name === val);
                  if (selectedState) {
                    setValue("state_code", selectedState.code);
                  }
                }}
                placeholder="Select State..."
                searchPlaceholder="Search state..."
              />
            )}
          />
          {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">State Code (2 Digits) *</label>
          <input 
            {...register("state_code")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
            placeholder="33"
            maxLength={2}
          />
          {errors.state_code && <p className="text-xs text-red-500">{errors.state_code.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Billing Address</label>
        <textarea 
          {...register("billing_address")}
          className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand h-20"
          placeholder="Enter full address"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 rounded-lg hover:bg-foreground/5 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-brand text-white font-bold shadow-glow hover:brightness-110 transition flex items-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {initialData ? "Update Customer" : "Save Customer"}
        </button>
      </div>
    </form>
  );
}
