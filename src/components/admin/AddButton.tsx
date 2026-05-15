import { Plus } from "lucide-react";

interface AddButtonProps {
  label?: string;
  onClick?: () => void;
}

export function AddButton({ label = "Add new", onClick }: AddButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-gradient-brand text-brand-foreground font-bold shadow-glow hover:brightness-110 active:scale-95 transition-all"
    >
      <Plus size={18} /> {label}
    </button>
  );
}
