import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { AddButton } from "@/components/admin/AddButton";
import { DataTable } from "@/components/admin/DataTable";
import { useState, useEffect } from "react";
import { Users, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Drawer } from "vaul";
import { CustomerForm } from "@/components/accounting/CustomerForm";

export const Route = createFileRoute("/_app/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name");
    
    if (!error) setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.gstin?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (!error) fetchCustomers();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Customers" 
        subtitle="Manage your customer base and their GST details."
        action={<AddButton label="Add Customer" onClick={() => { setSelectedCustomer(null); setIsDrawerOpen(true); }} />}
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-brand"
            placeholder="Search customers by name or GSTIN..."
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
          { key: "name", label: "Customer Name" },
          { key: "gstin", label: "GSTIN" },
          { key: "phone", label: "Phone" },
          { key: "state", label: "State" },
          { key: "state_code", label: "Code" },
        ]}
        data={filteredCustomers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage={loading ? "Loading customers..." : "No customers found. Click 'Add Customer' to create one."}
        icon={Users}
      />

      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <Drawer.Content className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-surface z-50 border-l border-border flex flex-col focus:outline-none">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <Drawer.Title className="text-xl font-bold">
                  {selectedCustomer ? "Edit Customer" : "Add New Customer"}
                </Drawer.Title>
                <Drawer.Description className="text-sm text-muted-foreground mt-1">
                  Fill in the details below to save the customer profile.
                </Drawer.Description>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-lg hover:bg-foreground/5 text-muted-foreground">
                <Users size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <CustomerForm 
                initialData={selectedCustomer}
                onSuccess={() => {
                  setIsDrawerOpen(false);
                  fetchCustomers();
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

