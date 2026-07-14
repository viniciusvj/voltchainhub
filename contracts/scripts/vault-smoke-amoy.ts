/**
 * On-chain escrow smoke test (Polygon Amoy): proves the full EnergyVault flow.
 * Self-trade (deployer is both seller and buyer) so a single key can drive it.
 *
 *   1. Seller approves the vault as ERC-1155 operator on LuzToken.
 *   2. Buyer lockTrade(seller, tokenId, energyWh, pricePerKwh, deadline){value}.
 *   3. Buyer confirmDelivery(tradeId).
 *   4. settleTrade(tradeId): LuzTokens escrow -> buyer, MATIC -> seller.
 *
 * Run: npx hardhat run scripts/vault-smoke-amoy.ts --network amoy
 */
import { ethers } from "hardhat";

const ADDR = {
  luzToken: "0x380b71ed16bA683d7adb471585740daF0507331A",
  energyVault: "0x5f91d715adFd8130894d406431ccDE0defA2771F",
};

async function main() {
  const [signer] = await ethers.getSigners();
  const me = signer.address;
  console.log("Seller = Buyer (self-trade):", me);

  const luz = await ethers.getContractAt("LuzToken", ADDR.luzToken);
  const vault = await ethers.getContractAt("EnergyVault", ADDR.energyVault);

  const tokenId = 1n;
  const energyWh = 100n; // escrow 100 units of LuzToken #1
  const pricePerKwh = 1_000_000_000_000n; // 1e12 wei per kWh
  const requiredMatic = (energyWh * pricePerKwh) / 1000n; // vault formula

  const bal = await luz.balanceOf(me, tokenId);
  if (bal < energyWh) throw new Error(`insufficient LuzToken #1 balance: have ${bal}, need ${energyWh}`);

  // 1. Approve the vault as operator (idempotent)
  if (!(await luz.isApprovedForAll(me, ADDR.energyVault))) {
    console.log("\n[1/4] setApprovalForAll(vault, true)");
    await (await luz.setApprovalForAll(ADDR.energyVault, true)).wait();
  } else {
    console.log("\n[1/4] vault already approved as operator");
  }

  // 2. Lock the trade (buyer pays MATIC, seller's tokens pulled into escrow)
  const block = await ethers.provider.getBlock("latest");
  const deadline = BigInt(block!.timestamp) + 3600n;
  console.log("\n[2/4] lockTrade energyWh=100 value=", requiredMatic.toString(), "wei");
  const lockTx = await vault.lockTrade(me, tokenId, energyWh, pricePerKwh, deadline, { value: requiredMatic });
  const lockRc = await lockTx.wait();

  // Extract tradeId from the TradeLocked event
  const ev = lockRc!.logs
    .map((l) => { try { return vault.interface.parseLog(l); } catch { return null; } })
    .find((p) => p && p.name === "TradeLocked");
  if (!ev) throw new Error("TradeLocked event not found");
  const tradeId = ev.args.tradeId as string;
  console.log("      tradeId:", tradeId, "| tx:", lockRc!.hash);

  const escrowBal = await luz.balanceOf(ADDR.energyVault, tokenId);
  console.log("      vault now holds LuzToken #1:", escrowBal.toString());

  // 3. Confirm delivery (buyer)
  console.log("\n[3/4] confirmDelivery");
  await (await vault.confirmDelivery(tradeId)).wait();

  // 4. Settle (tokens -> buyer, MATIC -> seller)
  console.log("\n[4/4] settleTrade");
  const settleRc = await (await vault.settleTrade(tradeId)).wait();

  const trade = await vault.getTrade(tradeId);
  const STATUS = ["Pending", "Locked", "Delivered", "Settled", "Expired", "Disputed"];
  console.log("\n=== RESULT ===");
  console.log("trade status:", STATUS[Number(trade.status)]);
  console.log("energyAmount:", trade.energyAmount.toString(), "Wh | maticLocked:", trade.maticLocked.toString(), "wei");
  const ok = Number(trade.status) === 3; // Settled
  console.log("assertion:", ok ? "PASS ✅ (escrow lock -> confirm -> settle)" : "FAIL ❌");
  console.log("\nExplorer:");
  console.log("  settle tx: https://amoy.polygonscan.com/tx/" + settleRc!.hash);
  console.log("  vault:     https://amoy.polygonscan.com/address/" + ADDR.energyVault);
  if (!ok) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
