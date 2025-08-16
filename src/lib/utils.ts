import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format CELO balance for display
 */
export function formatCELOBalance(balance: bigint | string): string {
  const balanceBigInt = typeof balance === 'string' ? BigInt(balance) : balance;
  const balanceInCELO = Number(balanceBigInt) / Math.pow(10, 18);
  return balanceInCELO.toFixed(4);
}

/**
 * Check if user has sufficient CELO for gas fees
 * Celo gas fees are typically around 0.001-0.01 CELO per transaction
 */
export function hasSufficientCELOForGas(balance: bigint | string): boolean {
  const balanceBigInt = typeof balance === 'string' ? BigInt(balance) : balance;
  // Minimum 0.01 CELO for gas fees (with some buffer)
  const minimumRequired = BigInt(10_000_000_000_000_000); // 0.01 CELO in wei
  return balanceBigInt >= minimumRequired;
}

// Utility function to ensure poster URLs are full URLs
export function ensureFullPosterUrl(posterUrl: string | undefined | null): string | undefined {
  if (!posterUrl) return undefined;
  
  // If it's already a full URL, return as-is
  if (posterUrl.startsWith('http://') || posterUrl.startsWith('https://')) {
    return posterUrl;
  }
  
  // If it's a relative TMDB path (starts with /), convert to full URL
  if (posterUrl.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w500${posterUrl}`;
  }
  
  // If it's a relative path without leading slash, add it
  if (!posterUrl.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w500/${posterUrl}`;
  }
  
  return posterUrl;
}

// Function to check if a URL is a TMDB relative path
export function isTmdbRelativePath(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('/') && !url.startsWith('http');
}

// Function to convert TMDB relative path to full URL
export function convertTmdbPathToUrl(path: string, size: string = 'w500'): string {
  if (!path) return '';
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // For SVG files, use original size
  if (cleanPath.endsWith('.svg')) {
    return `https://image.tmdb.org/t/p/original/${cleanPath}`;
  }
  
  // For other files, use specified size
  return `https://image.tmdb.org/t/p/${size}/${cleanPath}`;
}
