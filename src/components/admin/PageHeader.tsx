import { ReactNode } from "react";
import { LucideIcon, LayoutDashboard } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  action?: ReactNode; // Alias for backward compatibility
}

export function PageHeader({ title, subtitle, icon: Icon = LayoutDashboard, actions, action }: PageHeaderProps) {
  const displayActions = actions || action;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase leading-none whitespace-nowrap">{title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60 truncate max-w-[200px] sm:max-w-none">{subtitle}</span>
        </div>
      </div>
      {displayActions && <div className="flex items-center gap-3">{displayActions}</div>}
    </div>
  );
}
