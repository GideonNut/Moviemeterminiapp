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
