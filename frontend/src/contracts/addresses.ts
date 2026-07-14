export const CONTRACT_ADDRESSES = {
  80002: { // Polygon Amoy (testnet) — deployed + verified 2026-07-14
    luzToken:        '0x380b71ed16bA683d7adb471585740daF0507331A' as `0x${string}`,
    deviceRegistry:  '0x02c4770b07b313C12E0288250505E9b04c742A29' as `0x${string}`,
    tokenRegistry:   '0xf319976e714c460B9bf9a95228954bB6FEeE5874' as `0x${string}`,
    energyOracle:    '0x26a74154849753572CDaf85d5271Ffc055F8B9A8' as `0x${string}`,
    energyVault:     '0x5f91d715adFd8130894d406431ccDE0defA2771F' as `0x${string}`,
    voltMarketplace: '0x44eA9fD6489E8bAda380607e03841154f079DFB9' as `0x${string}`,
  },
} as const;

export const DEFAULT_CHAIN_ID = 80002;
