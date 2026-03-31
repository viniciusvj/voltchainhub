'use client';

import { useState } from 'react';
import { Lock, ClockRewind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActiveEscrows } from '@/components/trades/active-escrows';
import { TradeHistory } from '@/components/trades/trade-history';

type Tab = 'escrows' | 'history';

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'escrows', label: 'Escrows Ativos', icon: Lock },
  { id: 'history', label: 'Histórico', icon: ClockRewind },
];

export function TabsClient() {
  const [active, setActive] = useState<Tab>('escrows');

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-volt-dark-600 px-4 pt-3 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all',
              active === id
                ? 'text-[#0066FF] border-[#0066FF] bg-[#0066FF]/5'
                : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-volt-dark-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {active === 'escrows' && <ActiveEscrows />}
        {active === 'history' && <TradeHistory />}
      </div>
    </div>
  );
}
