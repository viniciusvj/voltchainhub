'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DisputeModal } from './dispute-modal';

// ── Types ─────────────────────────────────────────────────────────────────────

type EscrowDirection = 'selling' | 'buying';
type EscrowStatus = 'em-escrow' | 'entrega-pendente';

interface EscrowTrade {
  id: string;
  direction: EscrowDirection;
  counterparty: string;
  amountKwh: number;
  pricePerKwh: number;
  statusLabel: string;
  status: EscrowStatus;
  deadlineMinutes: number;
  deadlineSeconds: number;
  elapsedPercent: number; // 0-100
  maticEquivalent: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ESCROWS: EscrowTrade[] = [
  {
    id: 'ESC-0x0a1b',
    direction: 'selling',
    counterparty: '0xAb12...cD34',
    amountKwh: 5,
    pricePerKwh: 0.1,
    statusLabel: 'Em Escrow',
    status: 'em-escrow',
    deadlineMinutes: 4,
    deadlineSeconds: 32,
    elapsedPercent: 62,
    maticEquivalent: 0.42,
  },
  {
    id: 'ESC-0x2c3d',
    direction: 'buying',
    counterparty: '0xEf56...gH78',
    amountKwh: 10,
    pricePerKwh: 0.08,
    statusLabel: 'Entrega Pendente',
    status: 'entrega-pendente',
    deadlineMinutes: 2,
    deadlineSeconds: 15,
    elapsedPercent: 85,
    maticEquivalent: 0.67,
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: EscrowStatus; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border',
        status === 'em-escrow'
          ? 'bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]/30'
          : 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30'
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          status === 'em-escrow' ? 'bg-[#0066FF]' : 'bg-[#FFB800]'
        )}
      />
      {label}
    </span>
  );
}

function Countdown({
  minutes,
  seconds,
  urgent,
}: {
  minutes: number;
  seconds: number;
  urgent: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-sm font-mono font-semibold',
        urgent ? 'text-red-400' : 'text-gray-300'
      )}
    >
      <Clock className={cn('w-3.5 h-3.5', urgent ? 'text-red-400' : 'text-gray-500')} />
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}

function ProgressBar({ percent, urgent }: { percent: number; urgent: boolean }) {
  return (
    <div className="w-full h-1.5 bg-volt-dark-700 rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          urgent ? 'bg-red-500' : percent > 60 ? 'bg-[#FFB800]' : 'bg-[#0066FF]'
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ActiveEscrows() {
  const [disputeTrade, setDisputeTrade] = useState<EscrowTrade | null>(null);

  if (MOCK_ESCROWS.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <CheckCircle2 className="w-12 h-12 text-gray-600" />
        <p className="text-gray-400 font-medium">Nenhum escrow ativo</p>
        <p className="text-sm text-gray-600">
          Crie uma nova trade para iniciar um escrow
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {MOCK_ESCROWS.map((trade) => {
          const totalBRL = trade.amountKwh * trade.pricePerKwh;
          const isUrgent = trade.deadlineMinutes < 3;
          const isBuyer = trade.direction === 'buying';

          return (
            <div
              key={trade.id}
              className="bg-volt-dark-700 border border-volt-dark-600 rounded-xl p-5 flex flex-col gap-4"
            >
              {/* Top row: direction + status + countdown */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      trade.direction === 'selling'
                        ? 'bg-[#0066FF]/10'
                        : 'bg-[#FFB800]/10'
                    )}
                  >
                    {trade.direction === 'selling' ? (
                      <ArrowUpRight className="w-4 h-4 text-[#0066FF]" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-[#FFB800]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {trade.direction === 'selling' ? 'Vendendo' : 'Comprando'}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {trade.direction === 'selling' ? 'Para' : 'De'}{' '}
                      {trade.counterparty}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={trade.status} label={trade.statusLabel} />
                  <Countdown
                    minutes={trade.deadlineMinutes}
                    seconds={trade.deadlineSeconds}
                    urgent={isUrgent}
                  />
                </div>
              </div>

              {/* Middle row: amounts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-t border-b border-volt-dark-600">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Quantidade</p>
                  <p className="text-sm font-semibold text-white">
                    {trade.amountKwh} kWh
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Preço/kWh</p>
                  <p className="text-sm font-semibold text-white">
                    R${' '}
                    {trade.pricePerKwh.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Total BRL</p>
                  <p className="text-sm font-semibold text-white">
                    R${' '}
                    {totalBRL.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Equivalente</p>
                  <p className="text-sm font-semibold text-white">
                    {trade.maticEquivalent.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    MATIC
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Tempo decorrido</span>
                  <span>{trade.elapsedPercent}%</span>
                </div>
                <ProgressBar percent={trade.elapsedPercent} urgent={isUrgent} />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {isBuyer && (
                  <button className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0066FF] hover:bg-[#0055DD] text-white text-sm font-semibold rounded-lg transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Entrega
                  </button>
                )}
                <button
                  onClick={() => setDisputeTrade(trade)}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent hover:bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/40 hover:border-red-500/70 rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Disputar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispute modal */}
      <DisputeModal
        isOpen={disputeTrade !== null}
        onClose={() => setDisputeTrade(null)}
        tradeId={disputeTrade?.id ?? ''}
      />
    </>
  );
}
