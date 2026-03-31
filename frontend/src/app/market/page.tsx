import { TrendingUp } from 'lucide-react';
import { PriceChart }    from '@/components/market/price-chart';
import { OrderBook }     from '@/components/market/order-book';
import { TradeForm }     from '@/components/market/trade-form';
import { ClearingInfo }  from '@/components/market/clearing-info';
import { MarketHistory } from '@/components/market/market-history';

export const metadata = {
  title: 'Marketplace | VoltchainHub',
  description: 'Compre e venda energia P2P no mercado descentralizado da VoltchainHub.',
};

export default function MarketPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#0066FF]/10 border border-[#0066FF]/20">
          <TrendingUp className="w-5 h-5 text-[#0066FF]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Marketplace de Energia</h1>
          <p className="text-sm text-gray-400">
            Compre e venda energia P2P no mercado descentralizado
          </p>
        </div>
      </div>

      {/* Row 1: Price chart — full width */}
      <PriceChart />

      {/* Row 2: Order book + Trade form */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Order book takes more horizontal space */}
        <div className="lg:col-span-3">
          <OrderBook />
        </div>
        {/* Trade form */}
        <div className="lg:col-span-2">
          <TradeForm />
        </div>
      </div>

      {/* Row 3: Clearing info + Market history */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Clearing info */}
        <div className="xl:col-span-2">
          <ClearingInfo />
        </div>
        {/* Market history */}
        <div className="xl:col-span-3">
          <MarketHistory />
        </div>
      </div>
    </div>
  );
}
