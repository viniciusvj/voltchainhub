import { Metadata } from 'next';
import { TradeStats } from '@/components/trades/trade-stats';
import { ActiveEscrows } from '@/components/trades/active-escrows';
import { TradeHistory } from '@/components/trades/trade-history';
import { NewTradeWizard } from '@/components/trades/new-trade-wizard';
import { TabsClient } from './tabs-client';

export const metadata: Metadata = {
  title: 'Trades P2P | VoltchainHub',
  description:
    'Gerencie suas transações de energia peer-to-peer com escrow automático na blockchain Polygon.',
};

export default function TradesPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Trades P2P
        </h1>
        <p className="text-sm text-gray-400">
          Gerencie suas transações de energia peer-to-peer
        </p>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <TradeStats />

      {/* ── Tabs + Wizard layout ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabs section: takes 2/3 of the row on xl */}
        <div className="xl:col-span-2">
          <TabsClient />
        </div>

        {/* Wizard: right column on xl */}
        <div className="xl:col-span-1">
          <NewTradeWizard />
        </div>
      </div>
    </div>
  );
}
