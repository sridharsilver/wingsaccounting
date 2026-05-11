import { Plus } from "lucide-react";

export function AddButton({ label = "Add new" }: { label?: string }) {
  return (
    <button className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gradient-brand text-brand-foreground font-medium shadow-glow hover:opacity-90 transition">
      <Plus size={16} /> {label}
    </button>
  );
}
