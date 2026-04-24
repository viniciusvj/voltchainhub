/**
 * Hardhat Ignition module — deploys the full VoltchainHub core stack.
 *
 * Order (reflects constructor dependencies):
 *   1. DeviceRegistry(admin)
 *   2. LuzToken(uri, treasury, liquidityPool, admin)
 *   3. EnergyOracle(deviceRegistry, luzToken, admin)
 *   4. EnergyVault(luzToken, admin)
 *   5. TokenRegistry(admin)
 *   6. VoltMarketplace(admin, treasury, tokenRegistry, swapRouter)
 *
 * Notes:
 * - `swapRouter` must point to the Uniswap v3 SwapRouter02 on the target chain.
 *   On Polygon Amoy we use the canonical 0xE592427A0AEce92De3Edee1F18E0157C05861564
 *   address (Uniswap v3 router deployed by the Uniswap team across EVM chains).
 *   Override via parameter when needed.
 * - Treasury and liquidityPool default to the deployer unless overridden.
 *   For real deploys, set these to the multisig (Gnosis Safe 3/5) address.
 * - Run from `contracts/`:
 *     npx hardhat ignition deploy ignition/modules/VoltchainCore.ts --network amoy
 */
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DEFAULT_URI = "https://voltchainhub.io/metadata/luz-token/{id}.json";
const DEFAULT_SWAP_ROUTER_AMOY = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

const VoltchainCoreModule = buildModule("VoltchainCore", (m) => {
  // Parameters — override from command-line or parameters file
  const admin = m.getParameter<string>("admin", m.getAccount(0));
  const treasury = m.getParameter<string>("treasury", m.getAccount(0));
  const liquidityPool = m.getParameter<string>("liquidityPool", m.getAccount(0));
  const tokenUri = m.getParameter<string>("tokenUri", DEFAULT_URI);
  const swapRouter = m.getParameter<string>("swapRouter", DEFAULT_SWAP_ROUTER_AMOY);

  // 1. DeviceRegistry
  const deviceRegistry = m.contract("DeviceRegistry", [admin]);

  // 2. LuzToken
  const luzToken = m.contract("LuzToken", [tokenUri, treasury, liquidityPool, admin]);

  // 3. EnergyOracle
  const energyOracle = m.contract("EnergyOracle", [deviceRegistry, luzToken, admin]);

  // 4. EnergyVault
  const energyVault = m.contract("EnergyVault", [luzToken, admin]);

  // 5. TokenRegistry
  const tokenRegistry = m.contract("TokenRegistry", [admin]);

  // 6. VoltMarketplace (depends on TokenRegistry + swap router)
  const voltMarketplace = m.contract("VoltMarketplace", [
    admin,
    treasury,
    tokenRegistry,
    swapRouter,
  ]);

  return {
    deviceRegistry,
    luzToken,
    energyOracle,
    energyVault,
    tokenRegistry,
    voltMarketplace,
  };
});

export default VoltchainCoreModule;
