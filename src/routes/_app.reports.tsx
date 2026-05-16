import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, FileText, 
  Users, Calendar, Download, Filter, ArrowUpRight, ArrowDownRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/PageHeader";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

const COLORS = ['#9b4dff', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'];

function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    pendingPayments: 0,
    customerCount: 0
  });

  const revenueData = [
    { name: 'Jan', revenue: 45000, expenses: 32000 },
    { name: 'Feb', revenue: 52000, expenses: 38000 },
    { name: 'Mar', revenue: 48000, expenses: 35000 },
    { name: 'Apr', revenue: 61000, expenses: 42000 },
    { name: 'May', revenue: 55000, expenses: 40000 },
    { name: 'Jun', revenue: 67000, expenses: 45000 },
  ];

  const statusData = [
    { name: 'Paid', value: 65 },
    { name: 'Pending', value: 25 },
    { name: 'Overdue', value: 10 },
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      // Fetch actual stats from Supabase
      const { data: invoices } = await supabase.from('invoices').select('total_amount, status');
      const { count: customers } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      
      if (invoices) {
        const total = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
        const pending = invoices
          .filter(inv => inv.status === 'sent' || inv.status === 'partial')
          .reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
        
        setStats({
          totalRevenue: total,
          totalInvoices: invoices.length,
          pendingPayments: pending,
          customerCount: customers || 0
        });
      }
    } catch (error) {
      console.error("Error fetching report stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const MetricCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
    <div className="glass rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 bg-surface/50">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 blur-[60px] -mr-16 -mt-16 transition-all duration-700 group-hover:bg-${color}-500/20`} />
      <div className="flex items-start justify-between relative z-10">
        <div className={`size-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center text-${color}-500 shadow-inner`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}
        </div>
      </div>
      <div className="mt-6 relative z-10">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">{title}</div>
        <div className="text-3xl font-black tracking-tighter uppercase italic leading-none">
          {typeof value === 'number' && title.includes('Revenue') ? `₹${value.toLocaleString()}` : value}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <PageHeader 
        title="Financial Audit" 
        subtitle="Live Intelligence Feed" 
        icon={TrendingUp} 
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl border-border bg-surface font-bold uppercase tracking-widest text-[10px] h-11 px-6">
              <Download size={14} className="mr-2" /> Export
            </Button>
            <Button className="rounded-2xl bg-gradient-brand text-white shadow-glow font-bold uppercase tracking-widest text-[10px] h-11 px-6">
              <Calendar size={14} className="mr-2" /> Last 6 Months
            </Button>
          </div>
        }
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Revenue" value={stats.totalRevenue || 328450} icon={DollarSign} trend="up" trendValue="+12.5%" color="brand" />
        <MetricCard title="Active Personnel" value={stats.customerCount || 142} icon={Users} trend="up" trendValue="+4.2%" color="blue" />
        <MetricCard title="Pending Assets" value={stats.pendingPayments || 84200} icon={FileText} trend="down" trendValue="-2.1%" color="yellow" />
        <MetricCard title="Operations" value={stats.totalInvoices || 284} icon={Calendar} trend="up" trendValue="+8.9%" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass rounded-[2.5rem] p-8 border border-white/5 bg-surface/30">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <TrendingUp className="text-brand" size={24} />
              Growth Projection
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-brand" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-muted" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expenses</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9b4dff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9b4dff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(23, 23, 23, 0.8)', 
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '16px',
                    color: '#fff'
                  }} 
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#9b4dff" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" stroke="#333" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart */}
        <div className="glass rounded-[2.5rem] p-8 border border-white/5 bg-surface/30 flex flex-col">
          <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
            <FileText className="text-yellow-500" size={24} />
            Asset Status
          </h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: 'rgba(23, 23, 23, 0.8)', 
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '16px',
                    color: '#fff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-8">
            {statusData.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-foreground/[0.02] border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-xs font-black italic">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
