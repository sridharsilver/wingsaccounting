import { Plus } from "lucide-react";

interface AddButtonProps {
  label?: string;
  onClick?: () => void;
}

export function AddButton({ label = "Add new", onClick }: AddButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm rounded-lg md:rounded-xl bg-gradient-brand text-brand-foreground font-bold shadow-glow hover:brightness-110 active:scale-95 transition-all"
    >
      <Plus size={16} className="md:hidden" />
      <Plus size={18} className="hidden md:block" /> {label}
    </button>
  );
}
