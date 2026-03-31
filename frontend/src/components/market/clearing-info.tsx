'use client';

import { useEffect, useState } from 'react';
import { Activity, Users, RotateCcw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const CYCLE_SECONDS = 5 * 60; // 5 minutes

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatCountdown(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ClearingInfo() {
  // Offset into the current 5-min cycle so countdown is always realistic
  const [remaining, setRemaining] = useState<number>(() => {
    const now = Math.floor(Date.now() / 1000);
    return CYCLE_SECONDS - (now % CYCLE_SECONDS);
  });

  const [cycleNumber, setCycleNumber] = useState<number>(() =>
    Math.floor(Math.floor(Date.now() / 1000) / CYCLE_SECONDS),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setCycleNumber((c) => c + 1);
          return CYCLE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progress    = ((CYCLE_SECONDS - remaining) / CYCLE_SECONDS) * 100;
  const isUrgent    = remaining <= 30;
  const progressColor = isUrgent ? '#FFB800' : '#0066FF';

  // Static mock data for last clearing
  const lastClearing = {
    price:   0.1075,
    volume:  342.5,
    agents:  24,
  };

  // SVG circular progress
  const radius   = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-[#0066FF]" />
        <h2 className="text-sm font-semibold text-gray-100">PowerMatcher Clearing</h2>
      </div>

      <div className="flex flex-wrap gap-6 items-center">
        {/* Circular countdown */}
        <div className="flex flex-col items-center gap-1 select-none">
          <div className="relative w-24 h-24">
            <svg
              className="absolute inset-0 -rotate-90"
              width="96"
              height="96"
              viewBox="0 0 96 96"
            >
              {/* Track */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke="#222230"
                strokeWidth="6"
              />
              {/* Progress */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke={progressColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.3s' }}
              />
            </svg>
            {/* Countdown text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  'text-xl font-mono font-bold tabular-nums',
                  isUrgent ? 'text-[#FFB800]' : 'text-white',
                )}
              >
                {formatCountdown(remaining)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500">Próximo Clearing</p>
        </div>

        {/* Stats grid */}
        <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
          <StatCard
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Preço Último Clearing"
            value={`R$ ${lastClearing.price.toFixed(4)}`}
            mono
          />
          <StatCard
            icon={<Activity className="w-3.5 h-3.5" />}
            label="Volume Liquidado"
            value={`${lastClearing.volume.toFixed(1)} kWh`}
            mono
          />
          <StatCard
            icon={<Users className="w-3.5 h-3.5" />}
            label="Agentes Ativos"
            value={String(lastClearing.agents)}
          />
          <StatCard
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            label="Ciclo nº"
            value={`#${cycleNumber.toLocaleString('pt-BR')}`}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] text-gray-600 mb-1">
          <span>Ciclo atual</span>
          <span>{progress.toFixed(0)}% concluído</span>
        </div>
        <div className="h-1.5 bg-volt-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width:      `${progress}%`,
              background: `linear-gradient(90deg, #0066FF, ${progressColor})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  mono = false,
}: {
  icon:  React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-volt-dark-700 rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('text-sm font-semibold text-gray-100', mono && 'font-mono')}>
        {value}
      </p>
    </div>
  );
}
