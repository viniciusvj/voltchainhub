'use client';

import { useState } from 'react';
import { ExternalLink, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type EventColor = 'green' | 'blue' | 'solar' | 'purple' | 'gray';

interface ActivityEvent {
  id:          number;
  description: string;
  timestamp:   string;
  color:       EventColor;
  link?:       string;
}

// ── Mock events ───────────────────────────────────────────────────────────────

const MOCK_EVENTS: ActivityEvent[] = [
  {
    id:          1,
    description: 'Vendeu 5,2 kWh para 0xAb12...',
    timestamp:   'há 2 min',
    color:       'green',
    link:        'https://mumbai.polygonscan.com/tx/0xmock1',
  },
  {
    id:          2,
    description: 'Leitura verificada: 3,1 kWh',
    timestamp:   'há 15 min',
    color:       'blue',
    link:        'https://mumbai.polygonscan.com/tx/0xmock2',
  },
  {
    id:          3,
    description: 'Comprou 10 kWh de 0xCd34...',
    timestamp:   'há 1h',
    color:       'solar',
    link:        'https://mumbai.polygonscan.com/tx/0xmock3',
  },
  {
    id:          4,
    description: 'Dispositivo registrado: Nó Solar',
    timestamp:   'há 3h',
    color:       'purple',
  },
  {
    id:          5,
    description: 'Trade liquidada: 8,0 kWh',
    timestamp:   'há 5h',
    color:       'green',
    link:        'https://mumbai.polygonscan.com/tx/0xmock5',
  },
  {
    id:          6,
    description: 'Escrow criado: 15 kWh',
    timestamp:   'há 8h',
    color:       'blue',
    link:        'https://mumbai.polygonscan.com/tx/0xmock6',
  },
  {
    id:          7,
    description: 'Clearing #4521: R$ 0,09/kWh',
    timestamp:   'há 12h',
    color:       'gray',
  },
  {
    id:          8,
    description: 'Recompensa treasury: 0,5 kWh',
    timestamp:   'há 1 dia',
    color:       'solar',
    link:        'https://mumbai.polygonscan.com/tx/0xmock8',
  },
];

// ── Color map ─────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<EventColor, { dot: string; ring: string }> = {
  green:  { dot: 'bg-green-400',    ring: 'ring-green-400/20'  },
  blue:   { dot: 'bg-electric',     ring: 'ring-electric/20'   },
  solar:  { dot: 'bg-solar',        ring: 'ring-solar/20'      },
  purple: { dot: 'bg-[#A97CF8]',    ring: 'ring-[#A97CF8]/20'  },
  gray:   { dot: 'bg-gray-500',     ring: 'ring-gray-500/20'   },
};

// ── Event row ─────────────────────────────────────────────────────────────────

function EventRow({ event, isLast }: { event: ActivityEvent; isLast: boolean }) {
  const { dot, ring } = COLOR_MAP[event.color];

  return (
    <div className="relative flex gap-4">
      {/* Vertical timeline line */}
      {!isLast && (
        <div
          className="absolute left-[7px] top-5 bottom-0 w-px bg-volt-dark-600"
          aria-hidden="true"
        />
      )}

      {/* Dot */}
      <div className="flex-shrink-0 mt-1 relative z-10">
        <span
          className={cn(
            'block w-3.5 h-3.5 rounded-full ring-4',
            dot,
            ring
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-200 leading-snug">
            {event.description}
          </p>
          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-gray-500 hover:text-electric transition-colors mt-0.5"
              aria-label="Ver transação"
              title="Ver no Explorer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{event.timestamp}</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const INITIAL_VISIBLE = 5;

export function ActivityFeed() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? MOCK_EVENTS : MOCK_EVENTS.slice(0, INITIAL_VISIBLE);

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-electric" />
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Atividade Recente
          </h2>
        </div>
        <span className="text-xs text-gray-500 bg-volt-dark-700 px-2 py-0.5 rounded-full">
          {MOCK_EVENTS.length} eventos
        </span>
      </div>

      {/* Timeline */}
      <div className="flex flex-col">
        {visible.map((event, i) => (
          <EventRow
            key={event.id}
            event={event}
            isLast={i === visible.length - 1}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-volt-dark-600" />

      {/* Ver mais / Ver menos */}
      <button
        onClick={() => setShowAll((prev) => !prev)}
        className="w-full py-2 text-sm font-medium text-electric hover:text-white hover:bg-electric/10 border border-electric/30 hover:border-electric/60 rounded-lg transition-colors"
      >
        {showAll
          ? 'Ver menos'
          : `Ver mais (${MOCK_EVENTS.length - INITIAL_VISIBLE} restantes)`}
      </button>
    </div>
  );
}
