import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ── Tailwind class merging ────────────────────────────────────────────────────

/** Merge Tailwind classes, resolving conflicts via tailwind-merge. */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}

// ── Energy formatting ─────────────────────────────────────────────────────────

/**
 * Convert watt-hours to kilowatt-hours and format with 2 decimal places.
 * @example formatKwh(1500) // "1,50 kWh"
 */
export function formatKwh(wh: number): string {
  return `${(wh / 1000).toFixed(2).replace('.', ',')} kWh`;
}

// ── Currency formatting ───────────────────────────────────────────────────────

/**
 * Format a number as Brazilian Real.
 * @example formatBRL(9.9) // "R$ 9,90"
 */
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style:                 'currency',
    currency:              'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Address formatting ────────────────────────────────────────────────────────

/**
 * Shorten an Ethereum address to the form 0x1234...abcd.
 * @example shortenAddress('0x1234567890abcdef1234567890abcdef12345678')
 *          // "0x1234...5678"
 */
export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ── Timestamp formatting ──────────────────────────────────────────────────────

/**
 * Format a Unix timestamp (seconds) to a human-readable string in pt-BR locale.
 * @example formatTimestamp(1711900800) // "31/03/2024 12:00"
 */
export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString('pt-BR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

// ── Source type helpers ───────────────────────────────────────────────────────

/** Map a numeric source-type code to its Portuguese label. */
export function getSourceLabel(type: number): string {
  switch (type) {
    case 0:  return 'Solar';
    case 1:  return 'Eólico';
    case 2:  return 'Bateria';
    case 3:  return 'Rede';
    default: return 'Desconhecido';
  }
}

// ── Trade/device status helpers ───────────────────────────────────────────────

/**
 * Return a Tailwind text-color class for a given status string.
 * Intended for use with `cn()` or directly in `className`.
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':   return 'text-yellow-500';
    case 'locked':    return 'text-blue-500';
    case 'delivered': return 'text-indigo-500';
    case 'settled':   return 'text-green-500';
    case 'expired':   return 'text-gray-400';
    case 'disputed':  return 'text-red-500';
    case 'active':    return 'text-green-500';
    case 'inactive':  return 'text-gray-400';
    default:          return 'text-gray-500';
  }
}

/**
 * Return the Portuguese label for a given status string.
 */
export function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':   return 'Pendente';
    case 'locked':    return 'Bloqueado';
    case 'delivered': return 'Entregue';
    case 'settled':   return 'Liquidado';
    case 'expired':   return 'Expirado';
    case 'disputed':  return 'Disputado';
    case 'active':    return 'Ativo';
    case 'inactive':  return 'Inativo';
    default:          return status;
  }
}
