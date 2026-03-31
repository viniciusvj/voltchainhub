import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

export const polygonMumbai = defineChain({
  id: 80001,
  name: 'Polygon Mumbai',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mumbai.maticvigil.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://mumbai.polygonscan.com',
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'VoltchainHub',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [polygonMumbai],
  ssr: true,
});
