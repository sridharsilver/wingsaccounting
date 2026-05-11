import { ReactNode } from "react";

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl glass shadow-elegant ${className}`}>{children}</div>;
}
