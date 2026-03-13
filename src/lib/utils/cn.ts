import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina classes Tailwind com suporte a condicionais e merge seguro */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
