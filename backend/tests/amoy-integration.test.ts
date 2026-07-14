import { describe, it, expect } from 'vitest';
import { ethers } from 'ethers';

/**
 * Opt-in integration test against the LIVE Polygon Amoy deployment.
 * Read-only (no private key, no state change), so it is safe and free.
 *
 * Gated behind AMOY_INTEGRATION=1 so the default `npm test` (which has no
 * network guarantee in CI) stays hermetic. Run explicitly with:
 *   AMOY_INTEGRATION=1 npm test -- amoy-integration
 *
 * Asserts the on-chain state left by the contract smoke tests:
 *   - DeviceRegistry.deviceCount() >= 1
 *   - LuzToken.totalSupply(1) >= 1000
 *   - VoltMarketplace.feeBps() == 50 (0.5%)
 *
 * NOTE: uses minimal inline ABIs to keep the test self-contained. The backend's
 * shipped ABIs in src/infra/blockchain/abis were regenerated from the compiled
 * artifacts so they now match the deployed contracts.
 */
const RUN = process.env.AMOY_INTEGRATION === '1';
const RPC = process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology';

const ADDR = {
  deviceRegistry: '0x02c4770b07b313C12E0288250505E9b04c742A29',
  luzToken: '0x380b71ed16bA683d7adb471585740daF0507331A',
  voltMarketplace: '0x44eA9fD6489E8bAda380607e03841154f079DFB9',
};

const describeMaybe = RUN ? describe : describe.skip;

describeMaybe('Amoy live deployment (read-only)', () => {
  const provider = new ethers.JsonRpcProvider(RPC, 80002);

  it('DeviceRegistry has at least one registered device', async () => {
    const c = new ethers.Contract(ADDR.deviceRegistry, ['function deviceCount() view returns (uint256)'], provider);
    const count = await c.deviceCount();
    expect(count).toBeGreaterThanOrEqual(1n);
  }, 30_000);

  it('LuzToken tokenId 1 has supply from the mint smoke test', async () => {
    const c = new ethers.Contract(ADDR.luzToken, ['function totalSupply(uint256) view returns (uint256)'], provider);
    const supply = await c.totalSupply(1);
    expect(supply).toBeGreaterThanOrEqual(1000n);
  }, 30_000);

  it('VoltMarketplace fee is 0.5% (50 bps) and hard-capped below 2%', async () => {
    const c = new ethers.Contract(
      ADDR.voltMarketplace,
      ['function feeBps() view returns (uint256)', 'function MAX_FEE_BPS() view returns (uint256)'],
      provider,
    );
    const [fee, max] = await Promise.all([c.feeBps(), c.MAX_FEE_BPS()]);
    expect(fee).toBe(50n);
    expect(max).toBe(200n);
  }, 30_000);
});
