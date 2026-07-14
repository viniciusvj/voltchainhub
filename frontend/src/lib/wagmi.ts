import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

export const polygonAmoy = defineChain({
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: {
    decimals: 18,
    name: 'POL',
    symbol: 'POL',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://amoy.polygonscan.com',
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'VoltchainHub',
  // WalletConnect projectId is a public client identifier (ships in the browser
  // bundle). Reown Cloud project "VoltchainHub dApp". Override via env for other envs.
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '8de26eaacf87d30a2bf7380cd29c595e',
  chains: [polygonAmoy],
  ssr: true,
});
