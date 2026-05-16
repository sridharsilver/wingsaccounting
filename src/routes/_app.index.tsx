import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  FileText, 
  ArrowUpRight, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Calculator, 
  Users, 
  Package, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  LayoutDashboard
} from "lucide-react";
import { AdminCard as Card } from "@/components/admin/AdminCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { supabase } from "@/lib/supabase";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    paidInvoicesCount: 0,
    totalGST: 0,
    totalSales: 0,
    averageInvoiceValue: 0,
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
          .filter(i => i.status === "sent" || i.status === "partial" || i.status === "unpaid")
          .reduce((sum, i) => sum + Number(i.total_amount), 0);
        
        const totalSales = invoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
        const paidCount = invoices.filter(i => i.status === "paid").length;
        const gst = invoices.reduce((sum, i) => sum + Number(i.total_tax), 0);
        const avg = invoices.length > 0 ? totalSales / invoices.length : 0;

        setStats({
          totalRevenue: revenue,
          pendingPayments: pending,
          paidInvoicesCount: paidCount,
          totalGST: gst,
          totalSales: totalSales,
          averageInvoiceValue: avg,
        });

        setRecentInvoices(invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6));

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
              return invDate >= monthStart && invDate <= monthEnd;
            })
            .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

          const monthPaid = invoices
            .filter(inv => {
              const invDate = new Date(inv.date);
              return inv.status === "paid" && invDate >= monthStart && invDate <= monthEnd;
            })
            .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

          months.push({ name: monthName, total: monthRevenue, paid: monthPaid });
        }
        setChartData(months);
      }
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { t: "Total Revenue", v: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, c: "Received Payments", icon: CheckCircle, hue: 140, sub: `From ${stats.paidInvoicesCount} invoices` },
    { t: "Outstanding", v: `₹${stats.pendingPayments.toLocaleString("en-IN")}`, c: "Pending Collection", icon: Clock, hue: 30, sub: "Action required" },
    { t: "Total GST", v: `₹${stats.totalGST.toLocaleString("en-IN")}`, icon: Calculator, hue: 280, sub: "Tax liability estimate" },
    { t: "Avg. Invoice", v: `₹${Math.round(stats.averageInvoiceValue).toLocaleString("en-IN")}`, icon: TrendingUp, hue: 200, sub: "Per sale value" },
  ];

  const quickActions = [
    { label: "New Invoice", icon: Plus, to: "/invoices-new", color: "bg-brand text-brand-foreground shadow-glow hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.5)] hover:brightness-110" },
    { label: "New Quotation", icon: FileText, to: "/quotations-new", color: "bg-surface border border-border hover:border-brand hover:bg-brand/10 hover:text-brand hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(59,130,246,0.2)]" },
    { label: "Add Customer", icon: Users, to: "/customers", color: "bg-surface border border-border hover:border-brand hover:bg-brand/10 hover:text-brand hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(59,130,246,0.2)]" },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Dashboard" 
        subtitle="Here's a summary of your business performance today." 
        icon={LayoutDashboard}
      />

      {/* Quick Actions - Mobile Scrollable */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {quickActions.map((action, i) => (
          <Link 
            key={action.label} 
            to={action.to}
            className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2.5 md:px-6 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 active:scale-[0.98] group ${action.color}`}
          >
            <div className="size-7 md:size-8 rounded-lg bg-white/10 group-hover:bg-brand/20 grid place-items-center transition-all duration-300">
              <action.icon size={16} className="md:hidden group-hover:scale-110 group-hover:rotate-3 transition-transform" />
              <action.icon size={18} className="hidden md:block group-hover:scale-110 group-hover:rotate-3 transition-transform" />
            </div>
            <span className="font-bold whitespace-nowrap text-sm md:text-base tracking-tight">{action.label}</span>
          </Link>
        ))}
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((s, i) => (
          <motion.div key={s.t} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="p-4 md:p-6 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 size-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: `oklch(0.6 0.2 ${s.hue})` }} />
              <div className="flex flex-col gap-3 md:gap-4">
                <div className="flex items-center justify-between">
                  <div className="size-10 md:size-12 grid place-items-center rounded-2xl bg-foreground/5 text-muted-foreground group-hover:text-brand transition-colors">
                    <s.icon size={20} className="md:hidden" />
                    <s.icon size={24} className="hidden md:block" />
                  </div>
                  {s.c && (
                    <div className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                      {s.c}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{s.t}</p>
                  <h4 className="text-2xl md:text-3xl font-black tracking-tight">{s.v}</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    {s.sub}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="font-black text-xl uppercase tracking-tighter">Financial Growth</h3>
              <p className="text-xs text-muted-foreground">Comparison of Total Sales vs Paid Revenue</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-brand" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Total Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Paid</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'gray', fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">{payload[0].payload.name}</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-xs font-bold text-muted-foreground">Total Sales</span>
                              <span className="text-sm font-black text-brand">₹{payload[0].value?.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-xs font-bold text-muted-foreground">Received</span>
                              <span className="text-sm font-black text-emerald-500">₹{payload[1]?.value?.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="var(--brand)" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorPaid)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Invoices */}
        <Card className="p-4 md:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h3 className="font-black text-xl uppercase tracking-tighter">Recent Sales</h3>
            <Link to="/invoices" className="text-[10px] font-black uppercase tracking-widest text-brand hover:opacity-70 transition-opacity flex items-center gap-1">
              All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex-1 space-y-6">
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40 py-10">
                <div className="size-16 rounded-full bg-foreground/5 grid place-items-center">
                  <FileText size={32} />
                </div>
                <p className="text-sm font-medium">No sales recorded yet.</p>
              </div>
            ) : (
              recentInvoices.map((inv: any, i) => (
                <motion.div 
                  key={inv.id} 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 md:gap-4 group cursor-pointer"
                >
                  <div className="size-10 md:size-12 rounded-2xl bg-foreground/5 grid place-items-center font-mono text-[10px] md:text-xs font-black text-brand group-hover:bg-brand group-hover:text-brand-foreground transition-all">
                    #{inv.invoice_number.slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black uppercase tracking-tight truncate leading-none mb-1">{inv.customers?.name || "Walk-in Customer"}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{format(new Date(inv.date), "dd MMM, yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black leading-none mb-1">₹{Number(inv.total_amount).toLocaleString("en-IN")}</p>
                    <div className={`flex items-center justify-end gap-1 text-[9px] font-black uppercase tracking-widest ${inv.status === "paid" ? "text-emerald-500" : "text-amber-500"}`}>
                      {inv.status === "paid" ? <ShieldCheck size={10} /> : <AlertCircle size={10} />}
                      {inv.status}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 bg-gradient-brand text-brand-foreground">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="size-12 rounded-2xl bg-white/20 grid place-items-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Business Health</p>
              <h4 className="text-xl font-black uppercase tracking-tighter">Strong Performance</h4>
            </div>
          </div>
          <p className="mt-4 text-xs font-medium opacity-80 leading-relaxed">
            Your average invoice value is up this month. Focus on collecting the ₹{stats.pendingPayments.toLocaleString("en-IN")} outstanding balance to maximize cash flow.
          </p>
        </Card>

        <Card className="p-4 md:p-6 border-dashed border-2 border-border bg-transparent flex items-center justify-center text-center group cursor-pointer hover:border-brand transition-colors">
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-foreground/5 grid place-items-center mx-auto text-muted-foreground group-hover:text-brand group-hover:bg-brand/10 transition-all">
              <Plus size={24} />
            </div>
            <p className="text-sm font-black uppercase tracking-tighter">Add Custom Widget</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Personalize your dashboard</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
