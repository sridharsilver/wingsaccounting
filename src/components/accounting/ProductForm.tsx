import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  hsn_code: z.string().min(1, "HSN/SAC code is required"),
  gst_rate: z.coerce.number().min(0, "GST rate must be positive"),
  unit: z.string().min(1, "Unit is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      gst_rate: 18,
      unit: "Pcs",
      price: 0,
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
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
          .from("products")
          .update(payload)
          .eq("id", initialData.id));
      } else {
        ({ error } = await supabase
          .from("products")
          .insert([payload]));
      }

      if (error) throw error;

      toast.success(initialData ? "Product updated" : "Product added");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Product/Service Name *</label>
        <input 
          {...register("name")}
          className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
          placeholder="Graphic Design Service"
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">HSN/SAC Code *</label>
          <input 
            {...register("hsn_code")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
            placeholder="9983"
          />
          {errors.hsn_code && <p className="text-xs text-red-500">{errors.hsn_code.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">GST Rate (%) *</label>
          <select 
            {...register("gst_rate")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
          >
            <option value={0}>0% (Exempted)</option>
            <option value={5}>5%</option>
            <option value={12}>12%</option>
            <option value={18}>18%</option>
            <option value={28}>28%</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Price (per unit) *</label>
          <input 
            type="number"
            {...register("price")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Unit *</label>
          <input 
            {...register("unit")}
            className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand"
            placeholder="Pcs, Hrs, Days"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea 
          {...register("description")}
          className="w-full p-2 rounded-lg border border-border bg-surface outline-none focus:ring-2 focus:ring-brand h-20"
          placeholder="Describe the product or service..."
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
          {initialData ? "Update Product" : "Save Product"}
        </button>
      </div>
    </form>
  );
}
