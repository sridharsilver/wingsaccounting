import { ReactNode } from "react";
import { Trash2, Edit2, LucideIcon, FileText } from "lucide-react";
import { AdminCard } from "./AdminCard";

interface Column {
  key: string;
  label: string;
  format?: (value: any, row: any) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  actions?: (row: any) => ReactNode;
  onEdit?: (row: any) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
  icon?: LucideIcon;
}

export function DataTable({ 
  columns, 
  data, 
  actions,
  onEdit,
  onDelete,
  emptyMessage = "No data found",
  icon: Icon
}: DataTableProps) {
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  return (
    <AdminCard className="bg-transparent lg:bg-surface border-0 lg:border border-border w-full p-0 lg:p-6 overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm block lg:table border-collapse min-w-full lg:min-w-0">
          <thead className="hidden lg:table-header-group">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              {columns.map((c) => (
                <th key={c.key} className="px-3 xl:px-5 py-3 font-medium whitespace-nowrap">
                  {c.label}
                </th>
              ))}
              {(actions || onEdit || onDelete) && (
                <th className="px-3 xl:px-5 py-3 font-medium text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="block lg:table-row-group space-y-4 lg:space-y-0">
            {data && data.length > 0 ? (
              data.map((row, i) => (
                <tr 
                  key={row.id || i} 
                  className="block lg:table-row bg-surface border border-border lg:border-0 lg:border-b lg:border-border/60 rounded-3xl lg:rounded-none p-4 lg:p-0 hover:bg-white/[0.02] transition-all relative shadow-sm lg:shadow-none"
                >
                  {columns.map((col, j) => (
                    <td key={col.key} className="flex justify-between items-center lg:table-cell px-0 py-2.5 lg:px-3 xl:px-5 lg:py-3.5 border-b border-border/40 last:border-0 lg:border-0">
                      <span className="lg:hidden text-[10px] uppercase tracking-widest font-bold text-muted-foreground mr-4 shrink-0 opacity-60">
                        {col.label}
                      </span>
                      <div className="text-right lg:text-left flex-1 lg:w-full flex justify-end lg:block font-medium lg:font-normal break-all sm:break-normal">
                        {col.format ? col.format(getNestedValue(row, col.key), row) : getNestedValue(row, col.key)}
                      </div>
                    </td>
                  ))}
                  {(actions || onEdit || onDelete) && (
                    <td className="flex justify-between items-center lg:table-cell px-0 py-3 lg:px-3 xl:px-5 lg:py-3.5 border-0">
                      <span className="lg:hidden text-[10px] uppercase tracking-widest font-bold text-muted-foreground mr-4 shrink-0 opacity-60">
                        Actions
                      </span>
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        {actions && actions(row)}
                        {onEdit && (
                          <button 
                            onClick={() => onEdit(row)}
                            className="size-9 sm:size-8 grid place-items-center hover:bg-brand/10 text-brand rounded-xl transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={() => onDelete(row.id)}
                            className="size-9 sm:size-8 grid place-items-center hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr className="block lg:table-row">
                <td colSpan={columns.length + 1} className="block lg:table-cell py-24 text-center w-full">
                  <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                    <div className="size-20 rounded-full bg-foreground/5 grid place-items-center mb-2">
                      {Icon ? <Icon size={40} /> : <FileText size={40} />}
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}
