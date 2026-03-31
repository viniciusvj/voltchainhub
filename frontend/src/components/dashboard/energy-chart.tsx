'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { cn } from '@/lib/utils'

type TabPeriod = '24h' | '7d' | '30d'

// Mock 24h hourly data
// Generation: solar curve peaking at midday
// Consumption: morning and evening peaks
function generateMockData() {
  const now = new Date()
  now.setMinutes(0, 0, 0)

  return Array.from({ length: 25 }, (_, i) => {
    const hour = (now.getHours() - 24 + i + 24) % 24
    const label = `${String(hour).padStart(2, '0')}:00`

    // Solar generation: bell curve around hour 12
    const solarPeak = 12
    const generation = Math.max(
      0,
      8 * Math.exp(-0.5 * Math.pow((hour - solarPeak) / 4, 2))
    )

    // Consumption: two peaks at 7h and 19h
    const morning = 4 * Math.exp(-0.5 * Math.pow((hour - 7) / 1.5, 2))
    const evening = 5 * Math.exp(-0.5 * Math.pow((hour - 19) / 2, 2))
    const base = 1.5
    const consumption = base + morning + evening

    return {
      hour: label,
      geracao: parseFloat(generation.toFixed(2)),
      consumo: parseFloat(consumption.toFixed(2)),
    }
  })
}

const MOCK_DATA_24H = generateMockData()

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-volt-dark-700 border border-volt-dark-600 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-gray-400 mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-300">
            {entry.dataKey === 'geracao' ? 'Geração' : 'Consumo'}:
          </span>
          <span className="text-white font-semibold">
            {Number(entry.value).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            kWh
          </span>
        </div>
      ))}
    </div>
  )
}

const TABS: TabPeriod[] = ['24h', '7d', '30d']

export function EnergyChart() {
  const [activeTab, setActiveTab] = useState<TabPeriod>('24h')

  // Future: swap data source based on activeTab
  const data = MOCK_DATA_24H

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-semibold text-white">Geração vs. Consumo</h2>
          <p className="text-xs text-gray-500 mt-0.5">Energia em kWh por hora</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-volt-dark-700 rounded-lg p-1 self-start sm:self-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'bg-electric text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-electric/70" />
          <span className="text-xs text-gray-400">Geração</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-solar/70" />
          <span className="text-xs text-gray-400">Consumo</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="geracaoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0066FF" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0066FF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="consumoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FFB800" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#222230"
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={3}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="geracao"
            stroke="#0066FF"
            strokeWidth={2}
            fill="url(#geracaoGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#0066FF', stroke: '#12121A', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="consumo"
            stroke="#FFB800"
            strokeWidth={2}
            fill="url(#consumoGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#FFB800', stroke: '#12121A', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
