/**
 * On-chain marketplace settlement smoke test (Polygon Amoy).
 * Proves the 0.5% protocol fee end-to-end using the same-token path
 * (payToken == receiveToken), which needs no Uniswap pool on the testnet.
 *
 *   1. Deploy a MockERC20 ("Test BRZ" / tBRZ).
 *   2. Register it in TokenRegistry as BRL_STABLE.
 *   3. Grant OPERATOR_ROLE to the deployer on VoltMarketplace.
 *   4. Mint gross to the operator, approve the marketplace.
 *   5. settle(): fee -> treasury, net -> seller. Assert the split.
 *
 * Run: npx hardhat run scripts/marketplace-smoke-amoy.ts --network amoy
 */
import { ethers } from "hardhat";

const ADDR = {
  tokenRegistry: "0xf319976e714c460B9bf9a95228954bB6FEeE5874",
  voltMarketplace: "0x44eA9fD6489E8bAda380607e03841154f079DFB9",
};
const CATEGORY_BRL_STABLE = 0;

async function main() {
  const [operator] = await ethers.getSigners();
  console.log("Operator/treasury (deployer):", operator.address);

  const registry = await ethers.getContractAt("TokenRegistry", ADDR.tokenRegistry);
  const market = await ethers.getContractAt("VoltMarketplace", ADDR.voltMarketplace);

  // 1. Deploy a fresh mock stablecoin
  console.log("\n[1/5] deploy MockERC20 (tBRZ)");
  const Mock = await ethers.getContractFactory("MockERC20");
  const mock = await Mock.deploy("Test BRZ", "tBRZ");
  await mock.waitForDeployment();
  const mockAddr = await mock.getAddress();
  console.log("      tBRZ:", mockAddr);

  // 2. Register in TokenRegistry (idempotent guard)
  if (!(await registry.isSupported(mockAddr))) {
    console.log("\n[2/5] TokenRegistry.addToken(tBRZ, BRL_STABLE)");
    const tx = await registry.addToken(mockAddr, CATEGORY_BRL_STABLE, 18, "tBRZ");
    await tx.wait();
    console.log("      registered");
  } else {
    console.log("\n[2/5] token already supported, skipping");
  }

  // 3. Grant OPERATOR_ROLE to deployer
  const OPERATOR_ROLE = await market.OPERATOR_ROLE();
  if (!(await market.hasRole(OPERATOR_ROLE, operator.address))) {
    console.log("\n[3/5] grant OPERATOR_ROLE ->", operator.address);
    const tx = await market.grantRole(OPERATOR_ROLE, operator.address);
    await tx.wait();
  } else {
    console.log("\n[3/5] deployer already has OPERATOR_ROLE, skipping");
  }

  // 4. Mint gross to operator and approve marketplace
  const gross = ethers.parseUnits("1000", 18); // 1000 tBRZ
  console.log("\n[4/5] mint 1000 tBRZ to operator + approve marketplace");
  await (await mock.mint(operator.address, gross)).wait();
  await (await mock.approve(ADDR.voltMarketplace, gross)).wait();

  // 5. settle same-token: fee -> treasury(=operator), net -> seller
  const seller = ethers.Wallet.createRandom().address;
  const buyer = ethers.Wallet.createRandom().address;
  const orderId = ethers.id("voltchainhub-market-smoke-" + seller);
  const feeBps = await market.feeBps();
  const bpsDen = await market.BPS_DENOMINATOR();
  const expFee = (gross * feeBps) / bpsDen;
  const expNet = gross - expFee;
  const minReceive = expNet; // same token, no slippage

  console.log("\n[5/5] settle order (seller " + seller.slice(0, 10) + "...)");
  const opBefore = await mock.balanceOf(operator.address);
  const tx = await market.settle(orderId, buyer, seller, mockAddr, mockAddr, gross, minReceive);
  const rc = await tx.wait();

  const sellerBal = await mock.balanceOf(seller);
  const treasuryDelta = (await mock.balanceOf(operator.address)) - (opBefore - gross);

  console.log("\n=== RESULT ===");
  console.log("feeBps:", feeBps.toString(), "(0.5%)");
  console.log("gross:            ", ethers.formatUnits(gross, 18), "tBRZ");
  console.log("seller received:  ", ethers.formatUnits(sellerBal, 18), "tBRZ (expected " + ethers.formatUnits(expNet, 18) + ")");
  console.log("treasury fee:     ", ethers.formatUnits(treasuryDelta, 18), "tBRZ (expected " + ethers.formatUnits(expFee, 18) + ")");
  const ok = sellerBal === expNet && treasuryDelta === expFee;
  console.log("assertion:", ok ? "PASS ✅" : "FAIL ❌");
  console.log("\nExplorer:");
  console.log("  settle tx:  https://amoy.polygonscan.com/tx/" + rc!.hash);
  console.log("  tBRZ token: https://amoy.polygonscan.com/address/" + mockAddr);
  if (!ok) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
