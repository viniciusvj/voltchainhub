'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Wind,
  Battery,
  Globe,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Wallet,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';

// ── Types ─────────────────────────────────────────────────────────────────────

type TradeType = 'buy' | 'sell';
type SourcePreference = 'solar' | 'wind' | 'battery' | 'any';
type DeadlineOption = '5min' | '15min' | '30min' | '1h';

interface WizardState {
  type: TradeType | null;
  amountKwh: number;
  pricePerKwh: number;
  deadline: DeadlineOption;
  source: SourcePreference;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEADLINE_OPTIONS: { value: DeadlineOption; label: string }[] = [
  { value: '5min', label: '5 minutos' },
  { value: '15min', label: '15 minutos' },
  { value: '30min', label: '30 minutos' },
  { value: '1h', label: '1 hora' },
];

const SOURCE_OPTIONS: {
  value: SourcePreference;
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}[] = [
  { value: 'solar', label: 'Solar', icon: Zap, color: 'text-[#FFB800]' },
  { value: 'wind', label: 'Eólico', icon: Wind, color: 'text-cyan-400' },
  { value: 'battery', label: 'Bateria', icon: Battery, color: 'text-green-400' },
  { value: 'any', label: 'Qualquer', icon: Globe, color: 'text-gray-400' },
];

const INITIAL_STATE: WizardState = {
  type: null,
  amountKwh: 5,
  pricePerKwh: 0.1,
  deadline: '15min',
  source: 'any',
};

const FEE_PERCENT = 0.01;
const MATIC_RATE = 0.042; // mock BRL/MATIC rate

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = [
    { n: 1, label: 'Tipo' },
    { n: 2, label: 'Detalhes' },
    { n: 3, label: 'Confirmar' },
  ];

  return (
    <div className="flex items-center gap-0">
      {steps.map(({ n, label }, idx) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                n < current
                  ? 'bg-[#0066FF] border-[#0066FF] text-white'
                  : n === current
                  ? 'border-[#0066FF] text-[#0066FF] bg-[#0066FF]/10'
                  : 'border-volt-dark-600 text-gray-500'
              )}
            >
              {n < current ? <CheckCircle2 className="w-4 h-4" /> : n}
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                n === current ? 'text-[#0066FF]' : 'text-gray-500'
              )}
            >
              {label}
            </span>
          </div>

          {idx < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 w-16 sm:w-24 mx-2 mb-5 rounded-full transition-colors',
                n < current ? 'bg-[#0066FF]' : 'bg-volt-dark-600'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Type ──────────────────────────────────────────────────────────────

function StepType({
  selected,
  onSelect,
}: {
  selected: TradeType | null;
  onSelect: (t: TradeType) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-400 text-center">
        Selecione a direção da sua trade
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Buy */}
        <button
          onClick={() => onSelect('buy')}
          className={cn(
            'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
            selected === 'buy'
              ? 'border-[#FFB800] bg-[#FFB800]/10'
              : 'border-volt-dark-600 bg-volt-dark-700 hover:border-[#FFB800]/50'
          )}
        >
          <div className="w-14 h-14 rounded-full bg-[#FFB800]/10 flex items-center justify-center">
            <ArrowDownLeft className="w-7 h-7 text-[#FFB800]" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-white">Comprar Energia</p>
            <p className="text-xs text-gray-400 mt-1">
              Adquira energia de produtores da rede P2P
            </p>
          </div>
          {selected === 'buy' && (
            <CheckCircle2 className="w-5 h-5 text-[#FFB800]" />
          )}
        </button>

        {/* Sell */}
        <button
          onClick={() => onSelect('sell')}
          className={cn(
            'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
            selected === 'sell'
              ? 'border-[#0066FF] bg-[#0066FF]/10'
              : 'border-volt-dark-600 bg-volt-dark-700 hover:border-[#0066FF]/50'
          )}
        >
          <div className="w-14 h-14 rounded-full bg-[#0066FF]/10 flex items-center justify-center">
            <ArrowUpRight className="w-7 h-7 text-[#0066FF]" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-white">Vender Energia</p>
            <p className="text-xs text-gray-400 mt-1">
              Venda seu excedente de energia na rede P2P
            </p>
          </div>
          {selected === 'sell' && (
            <CheckCircle2 className="w-5 h-5 text-[#0066FF]" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Details ───────────────────────────────────────────────────────────

function StepDetails({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Amount slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">
            Quantidade de energia
          </label>
          <span className="text-sm font-bold text-white">
            {state.amountKwh} kWh
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          step={1}
          value={state.amountKwh}
          onChange={(e) => onChange({ amountKwh: Number(e.target.value) })}
          className="w-full h-2 appearance-none rounded-full bg-volt-dark-600 cursor-pointer accent-[#0066FF]"
        />
        <div className="flex justify-between text-xs text-gray-600">
          <span>1 kWh</span>
          <span>100 kWh</span>
        </div>
      </div>

      {/* Price input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-300">
          Preço por kWh (R$)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
            R$
          </span>
          <input
            type="number"
            min={0.01}
            max={9.99}
            step={0.01}
            value={state.pricePerKwh}
            onChange={(e) => onChange({ pricePerKwh: Number(e.target.value) })}
            className="w-full pl-9 pr-4 py-2.5 bg-volt-dark-700 border border-volt-dark-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#0066FF] transition-colors"
          />
        </div>
      </div>

      {/* Deadline */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-300">
          Prazo de entrega
        </label>
        <select
          value={state.deadline}
          onChange={(e) => onChange({ deadline: e.target.value as DeadlineOption })}
          className="w-full px-3 py-2.5 bg-volt-dark-700 border border-volt-dark-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#0066FF] transition-colors cursor-pointer"
        >
          {DEADLINE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Source preference */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">
          Preferência de fonte
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SOURCE_OPTIONS.map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => onChange({ source: value })}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-center',
                state.source === value
                  ? 'border-[#0066FF] bg-[#0066FF]/10'
                  : 'border-volt-dark-600 bg-volt-dark-700 hover:border-volt-dark-500'
              )}
            >
              <Icon className={cn('w-5 h-5', color)} />
              <span className="text-xs font-medium text-gray-300">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Confirm ───────────────────────────────────────────────────────────

function StepConfirm({
  state,
  onSubmit,
  isConnected,
}: {
  state: WizardState;
  onSubmit: () => void;
  isConnected: boolean;
}) {
  const gross = state.amountKwh * state.pricePerKwh;
  const fee = gross * FEE_PERCENT;
  const net = state.type === 'buy' ? gross + fee : gross - fee;
  const maticEquiv = net / (1 / MATIC_RATE);

  const sourceLabel =
    SOURCE_OPTIONS.find((s) => s.value === state.source)?.label ?? 'Qualquer';
  const deadlineLabel =
    DEADLINE_OPTIONS.find((d) => d.value === state.deadline)?.label ?? '';

  return (
    <div className="flex flex-col gap-5">
      {/* Summary card */}
      <div className="bg-volt-dark-700 border border-volt-dark-600 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Resumo da trade
        </p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <SummaryRow label="Tipo" value={state.type === 'buy' ? 'Compra' : 'Venda'} />
          <SummaryRow label="Quantidade" value={`${state.amountKwh} kWh`} />
          <SummaryRow
            label="Preço/kWh"
            value={`R$ ${state.pricePerKwh.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          />
          <SummaryRow label="Prazo" value={deadlineLabel} />
          <SummaryRow label="Fonte" value={sourceLabel} />
        </div>
      </div>

      {/* Fee breakdown */}
      <div className="bg-volt-dark-700 border border-volt-dark-600 rounded-xl p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Detalhamento de valores
        </p>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Subtotal</span>
          <span className="text-white">
            R$ {gross.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}
          </span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Taxa da plataforma (1%)</span>
          <span className="text-red-400">
            − R$ {fee.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}
          </span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-white border-t border-volt-dark-600 pt-2 mt-1">
          <span>{state.type === 'buy' ? 'Total a pagar' : 'Total a receber'}</span>
          <div className="text-right">
            <p>R$ {net.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}</p>
            <p className="text-xs text-gray-500 font-normal">
              ≈ {maticEquiv.toFixed(4)} MATIC
            </p>
          </div>
        </div>
      </div>

      {/* Wallet warning */}
      {!isConnected && (
        <div className="flex items-start gap-2 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-lg p-3">
          <Wallet className="w-4 h-4 text-[#FFB800] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#FFB800]">
            Conecte sua carteira para criar a trade. O contrato de escrow exige
            uma assinatura de transação na rede Polygon.
          </p>
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-lg p-3">
        <Info className="w-4 h-4 text-[#0066FF] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-400">
          Os fundos serão bloqueados em escrow no contrato inteligente até a
          confirmação de entrega ou expiração do prazo.
        </p>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!isConnected}
        className={cn(
          'w-full py-3 rounded-xl text-sm font-bold transition-all',
          isConnected
            ? 'bg-[#0066FF] hover:bg-[#0055DD] text-white shadow-lg shadow-[#0066FF]/25'
            : 'bg-volt-dark-600 text-gray-500 cursor-not-allowed'
        )}
      >
        Criar Trade
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function NewTradeWizard() {
  const { isConnected } = useAccount();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [submitted, setSubmitted] = useState(false);

  function patch(update: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...update }));
  }

  function handleNext() {
    if (step === 1 && state.type === null) return;
    setStep((s) => Math.min(3, s + 1));
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  function handleSubmit() {
    // Mock submission
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setStep(1);
      setState(INITIAL_STATE);
    }, 2500);
  }

  if (submitted) {
    return (
      <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-8 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#0066FF]/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#0066FF]" />
        </div>
        <p className="text-lg font-bold text-white">Trade criada!</p>
        <p className="text-sm text-gray-400 text-center">
          Seu escrow foi registrado na blockchain. Aguardando contraparte.
        </p>
      </div>
    );
  }

  const canNext = step === 1 ? state.type !== null : true;

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-white">Nova Trade</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure e publique uma oferta de energia P2P
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center">
        <StepIndicator current={step} />
      </div>

      {/* Step content */}
      <div className="min-h-[220px]">
        {step === 1 && (
          <StepType
            selected={state.type}
            onSelect={(t) => patch({ type: t })}
          />
        )}
        {step === 2 && <StepDetails state={state} onChange={patch} />}
        {step === 3 && (
          <StepConfirm
            state={state}
            onSubmit={handleSubmit}
            isConnected={isConnected}
          />
        )}
      </div>

      {/* Navigation */}
      {step < 3 && (
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-volt-dark-600 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
              canNext
                ? 'bg-[#0066FF] hover:bg-[#0055DD] text-white'
                : 'bg-volt-dark-600 text-gray-500 cursor-not-allowed'
            )}
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 3 && (
        <button
          onClick={handleBack}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-volt-dark-600 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
      )}
    </div>
  );
}
