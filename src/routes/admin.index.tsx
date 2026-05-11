import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TrendingUp, Image, MessageSquare, FileText, ArrowUpRight } from "lucide-react";
import { AdminCard as Card } from "@/components/admin/AdminCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { supabase } from "@/lib/supabase";
import { subDays, format, eachDayOfInterval, startOfDay } from "date-fns";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [counts, setCounts] = useState({ enquiries: 0, portfolio: 0, blog: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  const [graphData, setGraphData] = useState<number[]>([]);

  useEffect(() => {
    async function load() {
      const thirtyDaysAgo = subDays(new Date(), 29);
      
      const [enq, port, blg, rec, graphRes] = await Promise.all([
        supabase.from("enquiries").select("id", { count: "exact", head: true }),
        supabase.from("portfolio").select("id", { count: "exact", head: true }),
        supabase.from("blog").select("id", { count: "exact", head: true }),
        supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("enquiries")
          .select("created_at")
          .gte("created_at", startOfDay(thirtyDaysAgo).toISOString())
      ]);

      setCounts({
        enquiries: enq.count || 0,
        portfolio: port.count || 0,
        blog: blg.count || 0
      });
      setRecent(rec.data || []);

      // Process graph data
      if (graphRes.data) {
        const days = eachDayOfInterval({
          start: thirtyDaysAgo,
          end: new Date()
        });

        const countsByDay = graphRes.data.reduce((acc: any, curr: any) => {
          const day = format(new Date(curr.created_at), "yyyy-MM-dd");
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {});

        const dataPoints = days.map(day => countsByDay[format(day, "yyyy-MM-dd")] || 0);
        
        // Normalize to percentages (min height 10% if 0, scaled to 100% max)
        const max = Math.max(...dataPoints, 1);
        const normalized = dataPoints.map(v => Math.max((v / max) * 100, 5));
        setGraphData(normalized);
      }
    }
    load();
  }, []);

  const stats = [
    { t: "Total Enquiries", v: counts.enquiries, c: "Live", icon: MessageSquare, hue: 30 },
    { t: "Portfolio Items", v: counts.portfolio, c: "Dynamic", icon: Image, hue: 280 },
    { t: "Blog Posts", v: counts.blog, c: "Active", icon: FileText, hue: 200 },
    { t: "Conversion Rate", v: "6.8%", c: "+1.2%", icon: TrendingUp, hue: 140 },
  ];

  return (
    <>
      <PageHeader title="Dashboard" desc="Overview of activity across your studio." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.t} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-30" style={{ background: `oklch(0.6 0.2 ${s.hue})` }} />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.t}</div>
                  <div className="mt-2 text-3xl font-bold">{s.v}</div>
                  <div className="mt-1 text-xs text-emerald-400 inline-flex items-center gap-1"><ArrowUpRight size={12} />{s.c}</div>
                </div>
                <div className="size-10 grid place-items-center rounded-xl bg-gradient-brand text-brand-foreground">
                  <s.icon size={18} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Enquiries this month</h3>
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </div>
          <div className="mt-6 h-56 flex items-end gap-1.5 sm:gap-2">
            {graphData.length > 0 ? (
              graphData.map((h, i) => (
                <motion.div 
                  key={i} 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.02, duration: 0.5 }}
                  className="flex-1 rounded-t-sm sm:rounded-t-md bg-gradient-brand opacity-80 hover:opacity-100 transition cursor-help"
                  title={`Day ${i + 1}`}
                />
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground italic">
                Loading activity data...
              </div>
            )}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold">Recent enquiries</h3>
          <ul className="mt-4 space-y-3">
            {recent.map((r: any) => (
              <li key={r.id} className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-gradient-brand grid place-items-center text-brand-foreground text-xs font-semibold">
                  {(r.name || "U").split(" ").map((x: string) => x[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name || "Unknown Client"}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.subject || "No Subject"}</div>
                </div>
                <div className="text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "N/A"}</div>
              </li>
            ))}
            {recent.length === 0 && <li className="text-center py-10 text-xs text-muted-foreground">No enquiries yet</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
