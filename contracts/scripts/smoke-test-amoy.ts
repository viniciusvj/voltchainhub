/**
 * On-chain smoke test (Polygon Amoy): proves the end-to-end happy path.
 *   1. Register a device on DeviceRegistry (permissionless).
 *   2. Grant MINTER_ROLE to the deployer on LuzToken (deployer is admin).
 *   3. Mint a 1 kWh LuzToken receipt (tokenId 1) to the deployer.
 *   4. Read back device count and token balance/supply.
 *
 * Run: npx hardhat run scripts/smoke-test-amoy.ts --network amoy
 */
import { ethers } from "hardhat";

const ADDR = {
  deviceRegistry: "0x02c4770b07b313C12E0288250505E9b04c742A29",
  luzToken: "0x380b71ed16bA683d7adb471585740daF0507331A",
};

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);

  const registry = await ethers.getContractAt("DeviceRegistry", ADDR.deviceRegistry);
  const luz = await ethers.getContractAt("LuzToken", ADDR.luzToken);

  // 1. Register a device (unique id per run via block timestamp seed)
  const block = await ethers.provider.getBlock("latest");
  const deviceId = ethers.id(`voltchainhub-smoke-${block!.timestamp}`);
  const pubKeyX = ethers.id("smoke-pubkey-x");
  const pubKeyY = ethers.id("smoke-pubkey-y");
  const attestationSig = "0x00"; // non-empty; full P-256 verified off-chain
  const metadata = JSON.stringify({ test: "smoke", model: "esp32s3-sim", ts: block!.timestamp });

  console.log("\n[1/3] registerDevice", deviceId.slice(0, 18) + "...");
  let tx = await registry.registerDevice(deviceId, pubKeyX, pubKeyY, attestationSig, metadata);
  let rc = await tx.wait();
  console.log("      tx:", rc!.hash, "| gasUsed:", rc!.gasUsed.toString());

  // 2. Grant MINTER_ROLE to deployer (admin action) if not already granted
  const MINTER_ROLE = await luz.MINTER_ROLE();
  const hasMinter = await luz.hasRole(MINTER_ROLE, signer.address);
  if (!hasMinter) {
    console.log("\n[2/3] grantRole MINTER_ROLE ->", signer.address);
    tx = await luz.grantRole(MINTER_ROLE, signer.address);
    rc = await tx.wait();
    console.log("      tx:", rc!.hash);
  } else {
    console.log("\n[2/3] deployer already has MINTER_ROLE, skipping grant");
  }

  // 3. Mint a 1 kWh receipt (tokenId 1, amount 1000 = 1.000 kWh in mWh-scaled units)
  const tokenId = 1n;
  const amount = 1000n;
  console.log("\n[3/3] mint tokenId", tokenId.toString(), "amount", amount.toString());
  tx = await luz.mint(signer.address, tokenId, amount, "0x");
  rc = await tx.wait();
  console.log("      tx:", rc!.hash, "| gasUsed:", rc!.gasUsed.toString());

  // 4. Read back state
  const deviceCount = await registry.deviceCount();
  const balance = await luz.balanceOf(signer.address, tokenId);
  const supply = await luz.totalSupply(tokenId);
  console.log("\n=== RESULT ===");
  console.log("deviceCount:", deviceCount.toString());
  console.log("balanceOf(signer, tokenId 1):", balance.toString());
  console.log("totalSupply(tokenId 1):", supply.toString());
  console.log("\nExplorer:");
  console.log("  device tx:  https://amoy.polygonscan.com/tx/" + rc!.hash);
  console.log("  LuzToken:   https://amoy.polygonscan.com/address/" + ADDR.luzToken);
}

main().catch((e) => { console.error(e); process.exit(1); });
