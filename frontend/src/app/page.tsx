import { BalanceCard } from '@/components/dashboard/balance-card'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { EnergyChart } from '@/components/dashboard/energy-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { NetworkStats } from '@/components/dashboard/network-stats'
import { MarketPrice } from '@/components/dashboard/market-price'

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          Visão geral da sua energia descentralizada
        </p>
      </div>

      {/* Top row: Balance + Market price + Stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left column: balance + market stacked */}
        <div className="flex flex-col gap-4">
          <BalanceCard />
          <MarketPrice />
        </div>

        {/* Right columns: stats grid spans 2 columns */}
        <div className="lg:col-span-2">
          <StatsGrid />
        </div>
      </div>

      {/* Middle row: Energy chart (full width) */}
      <EnergyChart />

      {/* Bottom row: Recent transactions + Network stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
        <div>
          <NetworkStats />
        </div>
      </div>
    </div>
  )
}
