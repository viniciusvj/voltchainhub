import { Metadata } from 'next';
import { TradeStats } from '@/components/trades/trade-stats';
import { NewTradeWizard } from '@/components/trades/new-trade-wizard';
import { TabsClient } from './tabs-client';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = {
  title: 'Trades P2P | VoltchainHub',
  description:
    'Gerencie suas transações de energia peer-to-peer com escrow automático na blockchain Polygon.',
};

export default function TradesPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <PageHeader titleKey="page.trades.title" subKey="page.trades.sub" />

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
