import { ReactNode, HTMLAttributes } from "react";

interface AdminCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function AdminCard({ children, className = "", ...props }: AdminCardProps) {
  return (
    <div className={`rounded-2xl glass shadow-elegant ${className}`} {...props}>
      {children}
    </div>
  );
}
