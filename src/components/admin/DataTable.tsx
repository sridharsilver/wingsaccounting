import { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AdminCard } from "./AdminCard";

export function DataTable({ 
  columns, 
  rows, 
  onRowClick 
}: { 
  columns: string[]; 
  rows: (string | ReactNode)[][];
  onRowClick?: (index: number) => void;
}) {
  return (
    <AdminCard className="bg-transparent lg:bg-surface border-0 lg:border border-border w-full p-0 lg:p-6">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm block lg:table border-collapse min-w-full lg:min-w-0">
          <thead className="hidden lg:table-header-group">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              {columns.map((c) => <th key={c} className="px-3 xl:px-5 py-3 font-medium whitespace-nowrap">{c}</th>)}
            </tr>
          </thead>
          <tbody className="block lg:table-row-group space-y-4 lg:space-y-0">
            {rows.map((r, i) => (
              <tr 
                key={i} 
                onClick={() => onRowClick?.(i)}
                className={`block lg:table-row bg-surface/50 lg:bg-transparent border border-white/5 lg:border-b lg:border-x-0 lg:border-t-0 lg:border-border/60 rounded-xl lg:rounded-none p-1 lg:p-0 hover:bg-white/[0.02] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {r.map((cell, j) => (
                  <td key={j} className="flex justify-between items-center lg:table-cell px-3 py-3 lg:px-3 xl:px-5 lg:py-3.5 border-b border-white/5 last:border-0 lg:border-0">
                    <span className="lg:hidden text-[10px] uppercase tracking-tighter font-bold text-muted-foreground mr-4 shrink-0 opacity-70">
                      {columns[j]}
                    </span>
                    <div className="text-right lg:text-left flex-1 lg:w-full flex justify-end lg:block break-all sm:break-normal">
                      {cell}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}
