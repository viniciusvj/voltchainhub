'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Minus, Plus, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { energyVaultAbi } from '@/contracts/abis/EnergyVault';
import { luzTokenAbi } from '@/contracts/abis/LuzToken';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/contracts/addresses';

const LUZ_TOKEN_ID = BigInt(1);
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

// ── Types ─────────────────────────────────────────────────────────────────────

type Side      = 'buy' | 'sell';
type OrderType = 'limit' | 'market';

// ── Component ─────────────────────────────────────────────────────────────────

export function TradeForm() {
  const { isConnected } = useAccount();
  const { t } = useI18n();

  const [side,      setSide]      = useState<Side>('buy');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [price,     setPrice]     = useState<number>(0.1050);
  const [amount,    setAmount]    = useState<number>(10);
  const [seller,    setSeller]    = useState<string>('');
  const [txHash,    setTxHash]    = useState<string | null>(null);
  const [txError,   setTxError]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { writeContractAsync } = useWriteContract();
  const vault = CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID].energyVault;
  const luz = CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID].luzToken;

  const total    = price * amount;
  const fee      = total * 0.005;
  const netTotal = side === 'buy' ? total + fee : total - fee;

  // Buy: buyer-funded lockTrade (native value locked in the vault, seller tokens escrowed).
  // The price is treated as the native-token price per kWh on the testnet.
  async function handleBuy() {
    setTxError(null);
    if (!ADDRESS_RE.test(seller)) { setTxError(t('form.errSeller')); return; }
    setSubmitting(true);
    try {
      const energyWh = BigInt(Math.round(amount * 1000));
      const pricePerKwhWei = parseEther(price.toString());
      const value = (energyWh * pricePerKwhWei) / BigInt(1000);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 24 * 3600);
      const hash = await writeContractAsync({
        address: vault,
        abi: energyVaultAbi,
        functionName: 'lockTrade',
        args: [seller as `0x${string}`, LUZ_TOKEN_ID, energyWh, pricePerKwhWei, deadline],
        value,
        chainId: DEFAULT_CHAIN_ID,
      });
      setTxHash(hash);
    } catch (err) {
      setTxError(err instanceof Error ? err.message.split('\n')[0] : t('form.errTx'));
    } finally {
      setSubmitting(false);
    }
  }

  // Sell: seller approves the vault as ERC-1155 operator so its LuzTokens can be escrowed.
  async function handleSell() {
    setTxError(null);
    setSubmitting(true);
    try {
      const hash = await writeContractAsync({
        address: luz,
        abi: luzTokenAbi,
        functionName: 'setApprovalForAll',
        args: [vault, true],
        chainId: DEFAULT_CHAIN_ID,
      });
      setTxHash(hash);
    } catch (err) {
      setTxError(err instanceof Error ? err.message.split('\n')[0] : t('form.errTx'));
    } finally {
      setSubmitting(false);
    }
  }

  function adjustPrice(delta: number) {
    setPrice((p) => Math.round(Math.max(0.0001, p + delta) * 10000) / 10000);
  }

  function handleAmountSlider(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(Number(e.target.value));
  }

  const isBuy = side === 'buy';

  const accentColor = isBuy ? '#0066FF' : '#FFB800';
  const accentBg    = isBuy ? 'bg-[#0066FF] hover:bg-[#0055DD]' : 'bg-[#FFB800] hover:bg-[#E5A600]';
  const accentText  = isBuy ? 'text-[#0066FF]' : 'text-[#FFB800]';
  const accentBorder = isBuy ? 'border-[#0066FF]/40' : 'border-[#FFB800]/40';

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl flex flex-col">
      {/* Buy / Sell tabs */}
      <div className="flex border-b border-volt-dark-600">
        {(['buy', 'sell'] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-colors rounded-t-xl',
              side === s
                ? s === 'buy'
                  ? 'text-[#0066FF] border-b-2 border-[#0066FF]'
                  : 'text-[#FFB800] border-b-2 border-[#FFB800]'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            {s === 'buy' ? t('form.buy') : t('form.sell')}
          </button>
        ))}
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Order type toggle */}
        <div className="flex gap-1 p-1 bg-volt-dark-700 rounded-lg">
          {(['limit', 'market'] as OrderType[]).map((ot) => (
            <button
              key={ot}
              onClick={() => setOrderType(ot)}
              className={cn(
                'flex-1 py-1.5 text-xs font-medium rounded-md transition-colors',
                orderType === ot
                  ? 'bg-volt-dark-600 text-gray-100'
                  : 'text-gray-500 hover:text-gray-300',
              )}
            >
              {ot === 'limit' ? t('form.limit') : t('form.market')}
            </button>
          ))}
        </div>

        {/* Not connected */}
        {!isConnected ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-gray-400 text-center">
              {t('form.connectPrompt')}
            </p>
            <ConnectButton label={t('connect')} />
          </div>
        ) : (
          <>
            {/* Price field */}
            {orderType === 'limit' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  {t('form.price')} <span className="text-gray-600">(R$/kWh)</span>
                </label>
                <div className={cn('flex items-center bg-volt-dark-700 border rounded-lg overflow-hidden', accentBorder)}>
                  <button
                    onClick={() => adjustPrice(-0.0001)}
                    className="px-3 py-2.5 text-gray-400 hover:text-gray-100 hover:bg-volt-dark-600 transition-colors"
                    aria-label={t('form.decrease')}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Math.max(0.0001, Number(e.target.value)))}
                    step="0.0001"
                    min="0.0001"
                    className="flex-1 bg-transparent text-center font-mono text-sm text-gray-100 outline-none py-2"
                  />
                  <button
                    onClick={() => adjustPrice(0.0001)}
                    className="px-3 py-2.5 text-gray-400 hover:text-gray-100 hover:bg-volt-dark-600 transition-colors"
                    aria-label={t('form.increase')}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Amount field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-gray-400">
                  {t('form.amount')} <span className="text-gray-600">(kWh)</span>
                </label>
                <span className={cn('text-xs font-mono font-semibold', accentText)}>
                  {amount.toFixed(1)} kWh
                </span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0.1, Number(e.target.value)))}
                min="0.1"
                step="0.1"
                className={cn(
                  'w-full bg-volt-dark-700 border rounded-lg px-3 py-2.5 font-mono text-sm text-gray-100 outline-none mb-2',
                  accentBorder,
                )}
              />
              {/* Slider */}
              <input
                type="range"
                min={0.1}
                max={500}
                step={0.1}
                value={amount}
                onChange={handleAmountSlider}
                className="w-full accent-[var(--accent)]"
                style={{ '--accent': accentColor } as React.CSSProperties}
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                <span>0.1</span>
                <span>125</span>
                <span>250</span>
                <span>375</span>
                <span>500</span>
              </div>
            </div>

            {/* Seller address (buyer-funded escrow needs a counterparty) */}
            {isBuy && (
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  {t('form.seller')} <span className="text-gray-600">{t('form.sellerAddr')}</span>
                </label>
                <input
                  type="text"
                  value={seller}
                  onChange={(e) => setSeller(e.target.value.trim())}
                  placeholder="0x..."
                  className={cn(
                    'w-full bg-volt-dark-700 border rounded-lg px-3 py-2.5 font-mono text-xs text-gray-100 outline-none',
                    accentBorder,
                  )}
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  {t('form.sellerHint')}
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="bg-volt-dark-700 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>{t('form.subtotal')}</span>
                <span className="font-mono text-gray-300">R$ {total.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span className="flex items-center gap-1">
                  {t('form.protocolFee')}
                  <Info className="w-3 h-3 text-gray-600" />
                </span>
                <span className="font-mono text-gray-300">R$ {fee.toFixed(4)}</span>
              </div>
              <div className="flex justify-between border-t border-volt-dark-600 pt-1.5 font-semibold">
                <span className="text-gray-300">{t('form.estTotal')}</span>
                <span className={cn('font-mono', accentText)}>
                  R$ {netTotal.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Submit (real on-chain action) */}
            <button
              onClick={isBuy ? handleBuy : handleSell}
              disabled={submitting}
              className={cn(
                'w-full py-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2',
                accentBg,
                isBuy ? 'text-white' : 'text-volt-dark-900',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isBuy ? t('form.lockEscrow') : t('form.approveVault')}
            </button>

            {txError && (
              <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 break-words">
                {txError}
              </div>
            )}
            {txHash && (
              <a
                href={`https://amoy.polygonscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-[11px] text-[#0066FF] hover:underline break-all"
              >
                {t('form.txSent')}
              </a>
            )}

            <p className="text-center text-[11px] text-gray-600">
              {t('form.footer')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
