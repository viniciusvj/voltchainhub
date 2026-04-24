/**
 * Pre-flight check for deploy: verifies the deployer wallet has enough
 * native token (MATIC on Amoy/Polygon) to cover the Ignition module + some
 * slack for verify transactions.
 *
 * Exits non-zero if balance is too low.
 *
 * Usage:
 *   npx hardhat run scripts/check-deployer-balance.ts --network amoy
 *   npx hardhat run scripts/check-deployer-balance.ts --network polygon
 */
import { ethers, network } from "hardhat";

// Conservative estimates — refine after first real deploy
const MIN_BALANCE_BY_NETWORK: Record<string, string> = {
  amoy: "0.5",       // ~USD 0.5 equivalent in test MATIC
  polygon: "5.0",    // ~USD 2-3 at current MATIC price
  hardhat: "0",      // local, no real cost
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const balanceWei = await ethers.provider.getBalance(deployer.address);
  const balance = ethers.formatEther(balanceWei);

  const netName = network.name;
  const minStr = MIN_BALANCE_BY_NETWORK[netName];

  console.log(`Network:    ${netName} (chainId ${network.config.chainId})`);
  console.log(`Deployer:   ${deployer.address}`);
  console.log(`Balance:    ${balance} native token`);
  if (minStr !== undefined) {
    const minWei = ethers.parseEther(minStr);
    console.log(`Required:   >= ${minStr}`);
    if (balanceWei < minWei) {
      console.error(
        `\n❌ Insufficient balance for ${netName} deploy. Fund ${deployer.address} and retry.`,
      );
      process.exit(1);
    }
    console.log(`\n✅ Balance OK for ${netName} deploy.`);
  } else {
    console.log(`Required:   <no threshold configured for '${netName}'>`);
    console.log(`\n⚠️  Network '${netName}' has no minimum configured — proceed with caution.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
