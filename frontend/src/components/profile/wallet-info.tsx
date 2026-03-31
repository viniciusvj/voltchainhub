'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Clipboard,
  ClipboardCheck,
  ExternalLink,
  Wallet,
  Zap,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MATIC_BALANCE = 12.45;
const MOCK_LUZ_BALANCE = 142.5; // kWh total across all token IDs
const EXPLORER_BASE = 'https://mumbai.polygonscan.com/address/';

// ── Identicon gradient ────────────────────────────────────────────────────────

function AddressAvatar({ address }: { address: string }) {
  // Derive two hue values from the address hex chars for a consistent gradient
  const hex = address.replace('0x', '');
  const hue1 = parseInt(hex.slice(0, 4), 16) % 360;
  const hue2 = parseInt(hex.slice(4, 8), 16) % 360;

  return (
    <div
      className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-volt-dark-600"
      style={{
        background: `linear-gradient(135deg, hsl(${hue1},80%,55%) 0%, hsl(${hue2},80%,40%) 100%)`,
      }}
    >
      {address.slice(2, 4).toUpperCase()}
    </div>
  );
}

// ── Disconnected state ────────────────────────────────────────────────────────

function DisconnectedCard() {
  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-8 flex flex-col items-center justify-center gap-5 min-h-[300px]">
      <div className="w-16 h-16 rounded-full bg-volt-dark-700 flex items-center justify-center">
        <Wallet className="w-8 h-8 text-gray-500" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-lg font-semibold text-white">Conecte sua Carteira</p>
        <p className="text-sm text-gray-400">
          Conecte sua carteira para ver detalhes, saldos e atividades do seu perfil de
          prosumidor.
        </p>
      </div>
      <ConnectButton label="Conectar Carteira" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WalletInfo() {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);

  if (!isConnected || !address) {
    return <DisconnectedCard />;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available in some environments
    }
  };

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-electric" />
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Informações da Carteira
        </h2>
      </div>

      {/* Identity row */}
      <div className="flex items-center gap-4">
        <AddressAvatar address={address} />
        <div className="min-w-0 flex-1">
          {/* Full address + copy */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-mono text-xs text-gray-300 break-all leading-relaxed"
              title={address}
            >
              {address}
            </span>
            <button
              onClick={handleCopy}
              className={cn(
                'flex-shrink-0 p-1.5 rounded-md transition-colors',
                copied
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-gray-400 hover:text-white hover:bg-volt-dark-700'
              )}
              aria-label="Copiar endereço"
              title={copied ? 'Copiado!' : 'Copiar endereço'}
            >
              {copied ? (
                <ClipboardCheck className="w-4 h-4" />
              ) : (
                <Clipboard className="w-4 h-4" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-400 mt-0.5">Endereço copiado!</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-volt-dark-600" />

      {/* Network row */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Rede</span>
        <div className="flex items-center gap-2">
          <CircleDot className="w-4 h-4 text-[#8247E5]" />
          <span className="text-sm font-medium text-white">Polygon Mumbai</span>
          <span className="text-xs bg-[#8247E5]/15 text-[#A97CF8] border border-[#8247E5]/30 px-2 py-0.5 rounded-full">
            Testnet
          </span>
        </div>
      </div>

      {/* MATIC balance row */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Saldo MATIC</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white">
            {MOCK_MATIC_BALANCE.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs text-gray-400">MATIC</span>
        </div>
      </div>

      {/* LUZ Token balance row */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Saldo LUZ Token</span>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-electric" />
          <span className="text-sm font-semibold text-white">
            {MOCK_LUZ_BALANCE.toLocaleString('pt-BR', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
          <span className="text-xs text-gray-400">kWh (todos os IDs)</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-volt-dark-600" />

      {/* Explorer link */}
      <a
        href={`${EXPLORER_BASE}${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-electric/40 text-electric text-sm font-medium hover:bg-electric/10 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Ver no Explorer
      </a>
    </div>
  );
}
