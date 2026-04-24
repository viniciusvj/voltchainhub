/**
 * Seeds the TokenRegistry on Polygon Amoy with the initial testnet token list.
 *
 * Run AFTER deploying the Ignition module:
 *   npx hardhat run scripts/seed-token-registry-amoy.ts --network amoy
 *
 * Addresses below are common Amoy testnet tokens. Some may not exist on all
 * testnets — this script skips any address that does not have bytecode, rather
 * than reverting the whole transaction.
 */
import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

enum Category {
  BRL_STABLE = 0,
  USD_STABLE = 1,
  NATIVE_WRAPPED = 2,
  OTHER = 3,
}

interface SeedEntry {
  address: string;
  symbol: string;
  decimals: number;
  category: Category;
}

// Starter list for Amoy. Real BRZ/BRLA on Amoy may not exist; safe to skip.
const AMOY_SEED: SeedEntry[] = [
  { address: "0x0000000000000000000000000000000000001010", symbol: "WMATIC", decimals: 18, category: Category.NATIVE_WRAPPED },
  // Add confirmed addresses as you verify them on Amoy:
  // { address: "0x...", symbol: "USDC", decimals: 6, category: Category.USD_STABLE },
  // { address: "0x...", symbol: "USDT", decimals: 6, category: Category.USD_STABLE },
];

async function loadTokenRegistryAddress(): Promise<string> {
  const envOverride = process.env.TOKEN_REGISTRY_ADDRESS;
  if (envOverride) return envOverride;

  // Fallback: read from Ignition deployments file
  const deploymentsPath = path.join(
    __dirname,
    "..",
    "ignition",
    "deployments",
    "chain-80002",
    "deployed_addresses.json",
  );
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(
      "TokenRegistry address not found. Set TOKEN_REGISTRY_ADDRESS env var or run Ignition first.",
    );
  }
  const raw = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  const key = Object.keys(raw).find((k) => k.includes("TokenRegistry"));
  if (!key) throw new Error("TokenRegistry not present in Ignition deployments");
  return raw[key];
}

async function main() {
  const registryAddress = await loadTokenRegistryAddress();
  const [signer] = await ethers.getSigners();
  const registry = await ethers.getContractAt("TokenRegistry", registryAddress, signer);

  console.log(`Seeding TokenRegistry @ ${registryAddress}`);
  console.log(`Signer:   ${signer.address}`);
  console.log(`Entries:  ${AMOY_SEED.length}`);

  for (const entry of AMOY_SEED) {
    const code = await ethers.provider.getCode(entry.address);
    if (code === "0x") {
      console.log(`  - ${entry.symbol}: no bytecode at ${entry.address}, SKIP`);
      continue;
    }

    const supported = await registry.isSupported(entry.address);
    if (supported) {
      console.log(`  ✓ ${entry.symbol}: already registered`);
      continue;
    }

    const tx = await registry.addToken(entry.address, entry.category, entry.decimals, entry.symbol);
    await tx.wait();
    console.log(`  + ${entry.symbol} added (${entry.address}) tx=${tx.hash}`);
  }

  console.log(`\nDone. Current registry list:`);
  const list = await registry.listAll();
  for (const addr of list) {
    const info = await registry.tokens(addr);
    console.log(`  - ${info.symbol.padEnd(8)} ${addr}  category=${info.category}  supported=${info.supported}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
