
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { UserRegion } from "@/data/users";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currencyCodeForFormatting: 'USD' | 'INR',
  displayShortForm: boolean = true
): string {
  const actualAmount = amount || 0;
  const symbol = currencyCodeForFormatting === 'INR' ? '₹' : '$';

  if (displayShortForm) {
    if (Math.abs(actualAmount) >= 1_000_000) {
      const val = actualAmount / 1_000_000;
      const formattedVal = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
      return symbol + formattedVal + 'M';
    }
    if (Math.abs(actualAmount) >= 1_000) {
      const val = actualAmount / 1_000;
      const formattedVal = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
      return symbol + formattedVal + 'K';
    }
  }

  // For amounts less than 1000, or if displayShortForm is false
  try {
    const numberFormatter = new Intl.NumberFormat(currencyCodeForFormatting === 'INR' ? 'en-IN' : 'en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return symbol + numberFormatter.format(actualAmount);
  } catch (error) {
    console.warn(`Error formatting number for code ${currencyCodeForFormatting}, amount ${actualAmount}. Defaulting.`, error);
    return symbol + actualAmount.toFixed(2);
  }
}
