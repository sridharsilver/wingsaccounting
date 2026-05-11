import { ReactNode } from "react";

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {desc && <p className="text-sm text-muted-foreground line-clamp-1 sm:line-clamp-none">{desc}</p>}
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {action}
      </div>
    </div>
  );
}
