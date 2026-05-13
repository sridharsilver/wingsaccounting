import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a phone number for the WhatsApp wa.me API.
 * Ensures the number contains only digits and prefixes with 91 if it's a 10-digit number.
 */
export function formatWhatsAppNumber(number: string): string {
  // Remove all non-numeric characters
  const cleaned = number.replace(/\D/g, '');
  
  // If it's empty, return it
  if (!cleaned) return '';

  // If it's 10 digits, assume it's an Indian number and prefix with 91
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  
  // Otherwise return the numeric string as is
  return cleaned;
}
