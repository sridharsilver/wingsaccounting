export function StatusPill({ tone, children }: { tone: "green" | "amber" | "red" | "blue"; children: ReactNode }) {
  const map = {
    green: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
    amber: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
    red: "bg-red-500/20 text-red-400 ring-red-500/30",
    blue: "bg-brand/20 text-brand ring-brand/30",
  } as const;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ring-1 shadow-sm backdrop-blur-sm ${map[tone]}`}>
      {children}
    </span>
  );
}
