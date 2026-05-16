"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
  options: { label: string; value: string; description?: string }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  allowCustom?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  allowCustom = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11 px-4 rounded-2xl border border-border/50 bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-all font-bold text-sm",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-brand opacity-80" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border border-white/10 bg-surface/90 shadow-2xl backdrop-blur-xl">
        <Command className="bg-transparent">
          <div className="flex items-center border-b border-border/20 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-brand opacity-50" />
            <CommandInput 
              placeholder={searchPlaceholder} 
              className="h-11 border-none focus:ring-0 bg-transparent"
              value={searchValue}
              onValueChange={setSearchValue}
            />
          </div>
          <CommandList className="scrollbar-hide">
            {allowCustom && searchValue && !options.find(o => o.value.toLowerCase() === searchValue.toLowerCase()) && (
              <div
                onClick={() => {
                  onChange(searchValue);
                  setOpen(false);
                  setSearchValue("");
                }}
                className="rounded-xl mx-1 my-1 py-3 pl-3 pr-8 font-bold text-sm bg-brand/10 text-brand cursor-pointer flex items-center hover:bg-brand/20 transition-colors"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Use "{searchValue}"</span>
              </div>
            )}
            <CommandEmpty className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="rounded-xl mx-1 my-0.5 py-3 pl-3 pr-8 font-bold text-sm aria-selected:bg-brand/10 aria-selected:text-brand transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col gap-0.5">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-[10px] font-medium opacity-50 uppercase tracking-tighter">
                        {option.description}
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "absolute right-3 h-4 w-4 text-brand",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
