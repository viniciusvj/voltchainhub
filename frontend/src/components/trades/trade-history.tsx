'use client';

import { useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type TradeStatus = 'settled' | 'expired' | 'disputed';
type TradeType = 'buy' | 'sell';

interface HistoryEntry {
  id: string;
  date: string;
  type: TradeType;
  counterparty: string;
  amountKwh: number;
  pricePerKwh: number;
  totalBRL: number;
  status: TradeStatus;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: 'TR-001',
    date: '31/03/2026 14:22',
    type: 'sell',
    counterparty: '0xAb12...cD34',
    amountKwh: 5,
    pricePerKwh: 0.1,
    totalBRL: 0.5,
    status: 'settled',
  },
  {
    id: 'TR-002',
    date: '31/03/2026 11:05',
    type: 'buy',
    counterparty: '0xEf56...gH78',
    amountKwh: 12,
    pricePerKwh: 0.08,
    totalBRL: 0.96,
    status: 'settled',
  },
  {
    id: 'TR-003',
    date: '30/03/2026 22:48',
    type: 'sell',
    counterparty: '0x9Bc1...3aEf',
    amountKwh: 3,
    pricePerKwh: 0.12,
    totalBRL: 0.36,
    status: 'expired',
  },
  {
    id: 'TR-004',
    date: '30/03/2026 18:30',
    type: 'buy',
    counterparty: '0x7De2...11Fc',
    amountKwh: 20,
    pricePerKwh: 0.09,
    totalBRL: 1.8,
    status: 'settled',
  },
  {
    id: 'TR-005',
    date: '29/03/2026 09:15',
    type: 'sell',
    counterparty: '0x3Fa4...55Bd',
    amountKwh: 8,
    pricePerKwh: 0.11,
    totalBRL: 0.88,
    status: 'disputed',
  },
  {
    id: 'TR-006',
    date: '28/03/2026 16:00',
    type: 'buy',
    counterparty: '0xC5b7...88Aa',
    amountKwh: 15,
    pricePerKwh: 0.095,
    totalBRL: 1.425,
    status: 'settled',
  },
  {
    id: 'TR-007',
    date: '27/03/2026 12:40',
    type: 'sell',
    counterparty: '0x1Da9...22Ee',
    amountKwh: 6,
    pricePerKwh: 0.1,
    totalBRL: 0.6,
    status: 'expired',
  },
  {
    id: 'TR-008',
    date: '26/03/2026 20:55',
    type: 'buy',
    counterparty: '0x4Gc0...44Dd',
    amountKwh: 25,
    pricePerKwh: 0.085,
    totalBRL: 2.125,
    status: 'settled',
  },
  {
    id: 'TR-009',
    date: '25/03/2026 07:30',
    type: 'sell',
    counterparty: '0xB2h3...77Ff',
    amountKwh: 10,
    pricePerKwh: 0.105,
    totalBRL: 1.05,
    status: 'settled',
  },
  {
    id: 'TR-010',
    date: '24/03/2026 15:10',
    type: 'buy',
    counterparty: '0x6Ie5...99Gg',
    amountKwh: 4,
    pricePerKwh: 0.09,
    totalBRL: 0.36,
    status: 'disputed',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  TradeStatus,
  { label: string; classes: string }
> = {
  settled: {
    label: 'Liquidada',
    classes: 'bg-green-500/10 text-green-400 border-green-500/30',
  },
  expired: {
    label: 'Expirada',
    classes: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  },
  disputed: {
    label: 'Disputada',
    classes: 'bg-red-500/10 text-red-400 border-red-500/30',
  },
};

const PAGE_SIZE = 5;

// ── Component ─────────────────────────────────────────────────────────────────

export function TradeHistory() {
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = sortAsc ? [...MOCK_HISTORY].reverse() : MOCK_HISTORY;
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      {/* Table wrapper */}
      <div className="w-full overflow-x-auto rounded-xl border border-volt-dark-600">
        <table className="w-full min-w-[640px] text-sm">
          {/* Head */}
          <thead className="bg-volt-dark-700 border-b border-volt-dark-600">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => setSortAsc((p) => !p)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  Data
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Contraparte
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Quantidade
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Preço
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-volt-dark-600">
            {paginated.map((entry) => {
              const { label, classes } = STATUS_MAP[entry.status];
              return (
                <tr
                  key={entry.id}
                  className="bg-volt-dark-800 hover:bg-volt-dark-700 transition-colors"
                >
                  {/* Date */}
                  <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">
                    {entry.date}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md',
                        entry.type === 'buy'
                          ? 'bg-[#FFB800]/10 text-[#FFB800]'
                          : 'bg-[#0066FF]/10 text-[#0066FF]'
                      )}
                    >
                      {entry.type === 'buy' ? 'Compra' : 'Venda'}
                    </span>
                  </td>

                  {/* Counterparty */}
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {entry.counterparty}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 text-right text-gray-200 font-medium">
                    {entry.amountKwh} kWh
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-right text-gray-300 text-xs">
                    R${' '}
                    {entry.pricePerKwh.toLocaleString('pt-BR', {
                      minimumFractionDigits: 3,
                    })}
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 text-right font-semibold text-white">
                    R${' '}
                    {entry.totalBRL.toLocaleString('pt-BR', {
                      minimumFractionDigits: 3,
                    })}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border',
                        classes
                      )}
                    >
                      {label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-500">
          Mostrando {(page - 1) * PAGE_SIZE + 1}–
          {Math.min(page * PAGE_SIZE, sorted.length)} de {sorted.length} trades
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={cn(
              'p-1.5 rounded-lg border border-volt-dark-600 transition-colors',
              page === 1
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-white hover:border-gray-500'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'w-8 h-8 text-xs font-semibold rounded-lg border transition-colors',
                p === page
                  ? 'bg-[#0066FF] border-[#0066FF] text-white'
                  : 'border-volt-dark-600 text-gray-400 hover:text-white hover:border-gray-500'
              )}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={cn(
              'p-1.5 rounded-lg border border-volt-dark-600 transition-colors',
              page === totalPages
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-white hover:border-gray-500'
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
