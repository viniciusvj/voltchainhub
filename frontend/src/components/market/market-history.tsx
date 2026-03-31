'use client';

import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Clearing {
  time:    string;
  price:   number;
  volume:  number;
  agents:  number;
  cycle:   number;
  status:  'settled';
}

// ── Mock data ─────────────────────────────────────────────────────────────────

function buildHistory(): Clearing[] {
  const now   = Date.now();
  const rows: Clearing[] = [];
  let price   = 0.1075;

  for (let i = 0; i < 10; i++) {
    const ts    = new Date(now - i * 5 * 60 * 1000);
    const h     = String(ts.getHours()).padStart(2, '0');
    const m     = String(ts.getMinutes()).padStart(2, '0');
    price       = Math.min(0.15, Math.max(0.06, price + (Math.random() - 0.5) * 0.006));
    const volume = 200 + Math.random() * 300;
    const agents = 18 + Math.floor(Math.random() * 14);
    rows.push({
      time:   `${h}:${m}`,
      price:  Math.round(price * 10000) / 10000,
      volume: Math.round(volume * 10) / 10,
      agents,
      cycle:  Math.floor(Date.now() / 1000 / 300) - i,
      status: 'settled',
    });
  }
  return rows;
}

const HISTORY = buildHistory();

// ── Component ─────────────────────────────────────────────────────────────────

export function MarketHistory() {
  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-volt-dark-600 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-100">Histórico de Clearings</h2>
        <span className="text-[11px] text-gray-500">Últimas 10 liquidações</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-volt-dark-600/60">
              <Th>Horário</Th>
              <Th right>Preço Equilíbrio</Th>
              <Th right>Volume</Th>
              <Th right>Agentes</Th>
              <Th right>Ciclo</Th>
              <Th right>Status</Th>
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((row, i) => {
              const prevPrice = HISTORY[i + 1]?.price;
              const isUp      = prevPrice !== undefined ? row.price >= prevPrice : true;
              return (
                <tr
                  key={i}
                  className="border-b border-volt-dark-700/50 hover:bg-volt-dark-700/30 transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-gray-400 tabular-nums">
                    {row.time}
                  </td>
                  <td className={cn(
                    'px-4 py-2.5 font-mono text-right tabular-nums font-semibold',
                    isUp ? 'text-green-400' : 'text-red-400',
                  )}>
                    R$ {row.price.toFixed(4)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-right text-gray-300 tabular-nums">
                    {row.volume.toFixed(1)} kWh
                  </td>
                  <td className="px-4 py-2.5 font-mono text-right text-gray-400 tabular-nums">
                    {row.agents}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-right text-gray-500 tabular-nums">
                    #{row.cycle.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-[10px] font-semibold uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      Liquidado
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Table header cell ─────────────────────────────────────────────────────────

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={cn(
        'px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider',
        right ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}
