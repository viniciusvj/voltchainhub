'use client';

import { useState } from 'react';
import {
  Wifi,
  Clock,
  Cpu,
  ChevronRight,
  PowerOff,
  TrendingUp,
  TrendingDown,
  BatteryCharging,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type PowerMode = 'generating' | 'consuming' | 'charging';

interface MockDevice {
  id: string;
  shortId: string;
  name: string;
  model: string;
  type: string;
  status: 'active' | 'inactive';
  powerKw: number;
  powerMode: PowerMode;
  energyTodayKwh: number;
  signalPct: number;
  firmware: string;
  lastSeenLabel: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_DEVICES: MockDevice[] = [
  {
    id:              '0xA3F9...C2B1',
    shortId:         '0xa3f9c4e8...b7c2b1d0',
    name:            'Nó Solar Principal',
    model:           'Fronius Primo 5.0',
    type:            'ESP32-S3',
    status:          'active',
    powerKw:         4.2,
    powerMode:       'generating',
    energyTodayKwh:  23.4,
    signalPct:       92,
    firmware:        'v1.2.0',
    lastSeenLabel:   'há 2 min',
  },
  {
    id:              '0xD8E2...F4A7',
    shortId:         '0xd8e21b3f...a9f4a7c5',
    name:            'Nó Bateria Garagem',
    model:           'BYD HVS 5.1',
    type:            'ESP32-S3',
    status:          'active',
    powerKw:         -1.5,
    powerMode:       'charging',
    energyTodayKwh:  8.2,
    signalPct:       87,
    firmware:        'v1.2.0',
    lastSeenLabel:   'há 1 min',
  },
  {
    id:              '0x71B3...8D9C',
    shortId:         '0x71b3e05a...c28d9c11',
    name:            'Medidor Consumo',
    model:           'Growatt MIC 3000',
    type:            'ESP32-S3',
    status:          'active',
    powerKw:         2.1,
    powerMode:       'consuming',
    energyTodayKwh:  15.7,
    signalPct:       95,
    firmware:        'v1.1.8',
    lastSeenLabel:   'há 30 seg',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SignalBar({ pct }: { pct: number }) {
  const bars = 4;
  const filled = Math.round((pct / 100) * bars);
  return (
    <div className="flex items-end gap-0.5 h-4">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          style={{ height: `${((i + 1) / bars) * 100}%` }}
          className={cn(
            'w-1.5 rounded-sm',
            i < filled ? 'bg-[#0066FF]' : 'bg-volt-dark-600'
          )}
        />
      ))}
    </div>
  );
}

function PowerBadge({ kw, mode }: { kw: number; mode: PowerMode }) {
  const configs: Record<PowerMode, { label: string; color: string; Icon: React.ElementType }> = {
    generating: { label: 'Gerando',   color: 'text-green-400',   Icon: TrendingUp      },
    consuming:  { label: 'Consumindo', color: 'text-orange-400', Icon: TrendingDown    },
    charging:   { label: 'Carregando', color: 'text-[#0066FF]', Icon: BatteryCharging },
  };
  const { label, color, Icon } = configs[mode];
  const display = kw < 0 ? `${Math.abs(kw).toFixed(1)} kW` : `${kw.toFixed(1)} kW`;

  return (
    <div className={cn('flex items-center gap-1.5', color)}>
      <Icon className="w-4 h-4" />
      <span className="text-lg font-bold">{display}</span>
      <span className="text-xs font-normal text-gray-500">{label}</span>
    </div>
  );
}

// ── DeviceCard ────────────────────────────────────────────────────────────────

function DeviceCard({ device }: { device: MockDevice }) {
  const [deactivating, setDeactivating] = useState(false);

  function handleDeactivate() {
    setDeactivating(true);
    // mock async op
    setTimeout(() => setDeactivating(false), 1500);
  }

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-5 flex flex-col gap-4 hover:border-[#0066FF]/30 transition-colors">

      {/* Header: name + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {/* Active dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
            </span>
            <h3 className="font-semibold text-white truncate">{device.name}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">{device.shortId}</p>
        </div>

        {/* Type badge */}
        <span className="flex-shrink-0 flex items-center gap-1 text-xs bg-volt-dark-700 border border-volt-dark-600 rounded-md px-2 py-0.5 text-gray-400">
          <Cpu className="w-3 h-3" />
          {device.type}
        </span>
      </div>

      {/* Model */}
      <div className="text-xs text-gray-500">
        Inversor: <span className="text-gray-300 font-medium">{device.model}</span>
      </div>

      {/* Power reading */}
      <PowerBadge kw={device.powerKw} mode={device.powerMode} />

      {/* Energy today */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Energia hoje</span>
        <span className="text-[#FFB800] font-semibold">
          {device.energyTodayKwh.toFixed(1)} kWh
        </span>
      </div>

      {/* Signal + firmware */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5 text-gray-500" />
          <SignalBar pct={device.signalPct} />
          <span className="text-xs text-gray-500">{device.signalPct}%</span>
        </div>
        <span className="text-xs text-gray-600 bg-volt-dark-700 border border-volt-dark-600 rounded px-1.5 py-0.5">
          {device.firmware}
        </span>
      </div>

      {/* Last seen */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        <Clock className="w-3 h-3" />
        Última leitura: {device.lastSeenLabel}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-volt-dark-600">
        <button
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
            'bg-[#0066FF]/10 border border-[#0066FF]/30 text-[#0066FF]',
            'hover:bg-[#0066FF]/20 transition-colors'
          )}
        >
          Detalhes
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleDeactivate}
          disabled={deactivating}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
            'border border-red-500/30 text-red-400',
            'hover:bg-red-500/10 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <PowerOff className="w-3 h-3" />
          {deactivating ? 'Aguarde…' : 'Desativar'}
        </button>
      </div>
    </div>
  );
}

// ── DeviceList ────────────────────────────────────────────────────────────────

export function DeviceList() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-200">
          Meus Dispositivos
        </h2>
        <span className="text-xs text-gray-500">
          {MOCK_DEVICES.length} dispositivo{MOCK_DEVICES.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {MOCK_DEVICES.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </section>
  );
}
