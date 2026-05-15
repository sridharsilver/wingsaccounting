import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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

  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      state: "Tamil Nadu",
      state_code: "33",
    },
  });

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
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer Name *</label>
          <input 
            {...register("name")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
            placeholder="John Doe"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">GSTIN</label>
          <input 
            {...register("gstin")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
            placeholder="33XXXXX0000X1Z1"
          />
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
          <input 
            {...register("state")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
            placeholder="Tamil Nadu"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">State Code (2 Digits) *</label>
          <input 
            {...register("state_code")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
            placeholder="33"
          />
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

      <div className="flex justify-end gap-3 pt-4">
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
          className="px-4 py-2 rounded-lg bg-brand text-white font-medium hover:brightness-110 transition flex items-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {initialData ? "Update Customer" : "Save Customer"}
        </button>
      </div>
    </form>
  );
}
