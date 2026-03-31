'use client';

import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Order {
  price:  number;
  amount: number;
  total:  number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const SELL_ORDERS: Order[] = [
  { price: 0.1500, amount: 12.5,  total: 1.8750 },
  { price: 0.1450, amount: 8.0,   total: 1.1600 },
  { price: 0.1400, amount: 22.0,  total: 3.0800 },
  { price: 0.1350, amount: 5.5,   total: 0.7425 },
  { price: 0.1300, amount: 30.0,  total: 3.9000 },
  { price: 0.1250, amount: 18.0,  total: 2.2500 },
  { price: 0.1200, amount: 45.0,  total: 5.4000 },
  { price: 0.1100, amount: 10.0,  total: 1.1000 },
];

const BUY_ORDERS: Order[] = [
  { price: 0.1050, amount: 15.0,  total: 1.5750 },
  { price: 0.1000, amount: 28.0,  total: 2.8000 },
  { price: 0.0950, amount: 9.5,   total: 0.9025 },
  { price: 0.0900, amount: 40.0,  total: 3.6000 },
  { price: 0.0850, amount: 6.0,   total: 0.5100 },
  { price: 0.0800, amount: 55.0,  total: 4.4000 },
  { price: 0.0700, amount: 20.0,  total: 1.4000 },
  { price: 0.0500, amount: 100.0, total: 5.0000 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeCumulative(orders: Order[]): (Order & { cumulative: number })[] {
  let cum = 0;
  return orders.map((o) => {
    cum += o.amount;
    return { ...o, cumulative: cum };
  });
}

function DepthBar({
  pct,
  color,
}: {
  pct: number;
  color: 'red' | 'green';
}) {
  return (
    <span
      className={cn(
        'absolute inset-y-0 right-0 rounded-sm opacity-15',
        color === 'red' ? 'bg-red-500' : 'bg-green-500',
      )}
      style={{ width: `${pct}%` }}
    />
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  maxCum,
  color,
}: {
  order: Order & { cumulative: number };
  maxCum: number;
  color: 'red' | 'green';
}) {
  const pct = (order.cumulative / maxCum) * 100;
  return (
    <tr className="relative group hover:bg-volt-dark-700/40 transition-colors">
      <td className="relative px-3 py-1.5 text-right font-mono text-xs">
        <DepthBar pct={pct} color={color} />
        <span className={color === 'red' ? 'text-red-400' : 'text-green-400'}>
          {order.price.toFixed(4)}
        </span>
      </td>
      <td className="px-3 py-1.5 text-right font-mono text-xs text-gray-300">
        {order.amount.toFixed(2)}
      </td>
      <td className="px-3 py-1.5 text-right font-mono text-xs text-gray-400">
        {order.total.toFixed(4)}
      </td>
    </tr>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OrderBook() {
  const sellWithCum = computeCumulative([...SELL_ORDERS].reverse()).reverse();
  const buyWithCum  = computeCumulative(BUY_ORDERS);

  const maxSellCum = sellWithCum[sellWithCum.length - 1]?.cumulative ?? 1;
  const maxBuyCum  = buyWithCum[buyWithCum.length - 1]?.cumulative ?? 1;

  const bestSell = SELL_ORDERS[SELL_ORDERS.length - 1].price;
  const bestBuy  = BUY_ORDERS[0].price;
  const spread   = (bestSell - bestBuy).toFixed(4);
  const spreadPct = (((bestSell - bestBuy) / bestSell) * 100).toFixed(2);

  const headerCls = 'px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider';

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-volt-dark-600">
        <h2 className="text-sm font-semibold text-gray-100">Livro de Ordens</h2>
      </div>

      {/* Column headers */}
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-volt-dark-600/50">
            <th className={headerCls}>Preço (R$)</th>
            <th className={headerCls}>Qtd (kWh)</th>
            <th className={headerCls}>Total (R$)</th>
          </tr>
        </thead>
      </table>

      {/* Sell orders */}
      <div className="overflow-y-auto flex-1">
        <table className="w-full table-fixed">
          <tbody>
            {sellWithCum.map((o, i) => (
              <OrderRow key={i} order={o} maxCum={maxSellCum} color="red" />
            ))}
          </tbody>
        </table>
      </div>

      {/* Spread */}
      <div className="flex items-center justify-between px-4 py-2 bg-volt-dark-700/50 border-y border-volt-dark-600">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Spread</span>
        <span className="font-mono text-xs text-gray-300">
          R$ {spread}{' '}
          <span className="text-gray-500">({spreadPct}%)</span>
        </span>
      </div>

      {/* Buy orders */}
      <div className="overflow-y-auto flex-1">
        <table className="w-full table-fixed">
          <tbody>
            {buyWithCum.map((o, i) => (
              <OrderRow key={i} order={o} maxCum={maxBuyCum} color="green" />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
