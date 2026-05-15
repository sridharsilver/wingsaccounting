import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { AddButton } from "@/components/admin/AddButton";
import { DataTable } from "@/components/admin/DataTable";
import { useState, useEffect } from "react";
import { Briefcase, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Drawer } from "vaul";
import { ProductForm } from "@/components/accounting/ProductForm";

export const Route = createFileRoute("/admin/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    
    if (!error) setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.hsn_code?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (!error) fetchProducts();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Products & Services" 
        subtitle="Manage your inventory items, HSN codes, and GST rates."
        action={<AddButton label="Add Product" onClick={() => { setSelectedProduct(null); setIsDrawerOpen(true); }} />}
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-brand"
            placeholder="Search products by name or HSN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-foreground/5 transition-colors text-sm font-medium">
          <Filter size={16} /> Filter
        </button>
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Product Name" },
          { key: "hsn_code", label: "HSN/SAC" },
          { key: "gst_rate", label: "GST %" },
          { key: "price", label: "Price", format: (v) => `₹${v.toLocaleString("en-IN")}` },
          { key: "unit", label: "Unit" },
        ]}
        data={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage={loading ? "Loading products..." : "No products found. Add your first product or service."}
        icon={Briefcase}
      />

      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <Drawer.Content className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-surface z-50 border-l border-border flex flex-col focus:outline-none">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <Drawer.Title className="text-xl font-bold">
                  {selectedProduct ? "Edit Product" : "Add New Product"}
                </Drawer.Title>
                <Drawer.Description className="text-sm text-muted-foreground mt-1">
                  Manage your product details and GST configuration.
                </Drawer.Description>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-lg hover:bg-foreground/5 text-muted-foreground">
                <Briefcase size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ProductForm 
                initialData={selectedProduct}
                onSuccess={() => {
                  setIsDrawerOpen(false);
                  fetchProducts();
                }}
                onCancel={() => setIsDrawerOpen(false)}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

