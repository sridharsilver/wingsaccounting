import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TrendingUp, FileText, ArrowUpRight, DollarSign, Clock, CheckCircle, Calculator } from "lucide-react";
import { AdminCard as Card } from "@/components/admin/AdminCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { supabase } from "@/lib/supabase";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    paidInvoicesCount: 0,
    totalGST: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*, customers(name)");

      if (invoices && !error) {
        const revenue = invoices
          .filter(i => i.status === "paid")
          .reduce((sum, i) => sum + Number(i.total_amount), 0);
        
        const pending = invoices
          .filter(i => i.status === "sent" || i.status === "partial")
          .reduce((sum, i) => sum + Number(i.total_amount), 0);
        
        const paidCount = invoices.filter(i => i.status === "paid").length;
        const gst = invoices.reduce((sum, i) => sum + Number(i.total_tax), 0);

        setStats({
          totalRevenue: revenue,
          pendingPayments: pending,
          paidInvoicesCount: paidCount,
          totalGST: gst,
        });

        setRecentInvoices(invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));

        // Generate chart data for last 6 months
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const monthName = format(date, "MMM");
          const monthStart = startOfMonth(date);
          const monthEnd = endOfMonth(date);

          const monthRevenue = invoices
            .filter(inv => {
              const invDate = new Date(inv.date);
              return inv.status === "paid" && invDate >= monthStart && invDate <= monthEnd;
            })
            .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

          months.push({ name: monthName, revenue: monthRevenue });
        }
        setChartData(months);
      }
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { t: "Total Revenue", v: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, c: "All time paid", icon: DollarSign, hue: 140 },
    { t: "Pending Payments", v: `₹${stats.pendingPayments.toLocaleString("en-IN")}`, c: "Sent & Partial", icon: Clock, hue: 30 },
    { t: "Paid Invoices", v: stats.paidInvoicesCount, icon: CheckCircle, hue: 200 },
    { t: "GST Summary", v: `₹${stats.totalGST.toLocaleString("en-IN")}`, icon: Calculator, hue: 280 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard Overview" 
        subtitle="Track your business growth and GST compliance." 
      />
      
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.t} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-30" style={{ background: `oklch(0.6 0.2 ${s.hue})` }} />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.t}</div>
                  <div className="mt-2 text-3xl font-bold">{s.v}</div>
                  {s.c && <div className="mt-1 text-xs text-emerald-400 inline-flex items-center gap-1"><TrendingUp size={12} /> {s.c}</div>}
                </div>
                <div className="size-10 grid place-items-center rounded-xl bg-gradient-brand text-brand-foreground shadow-glow">
                  <s.icon size={18} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-lg">Revenue Growth</h3>
              <p className="text-xs text-muted-foreground">Monthly paid revenue overview</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'gray' }} 
                  dy={10}
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface border border-border p-3 rounded-xl shadow-2xl">
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{payload[0].payload.name}</p>
                          <p className="text-lg font-black text-brand">₹{payload[0].value?.toLocaleString("en-IN")}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'var(--brand)' : 'var(--brand-muted, #9b4dff44)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Recent Sales</h3>
            <button className="text-xs text-brand font-medium hover:underline">View All</button>
          </div>
          <ul className="space-y-4">
            {recentInvoices.map((inv: any) => (
              <li key={inv.id} className="flex items-center gap-3 group cursor-pointer hover:bg-foreground/5 p-2 rounded-xl transition-all">
                <div className="size-10 rounded-xl bg-foreground/5 grid place-items-center text-brand font-bold">
                  #{inv.invoice_number.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{inv.customers?.name || "Walk-in"}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{format(new Date(inv.date), "dd MMM yyyy")}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">₹{Number(inv.total_amount).toLocaleString("en-IN")}</div>
                  <div className={`text-[10px] font-bold uppercase ${inv.status === "paid" ? "text-emerald-500" : "text-amber-500"}`}>
                    {inv.status}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}


