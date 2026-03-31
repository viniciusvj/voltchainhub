import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { LuzToken, EnergyVault } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("EnergyVault", function () {
  let luzToken: LuzToken;
  let vault: EnergyVault;
  let admin: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let liquidityPool: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let arbiter: HardhatEthersSigner;

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

  let tokenId: bigint;
  const energyAmount = 5000n; // 5 kWh in Wh
  const pricePerKwh = ethers.parseEther("0.01"); // 0.01 MATIC per kWh

  async function createLockedTrade(deadlineOffset = 3600): Promise<string> {
    const deadline = BigInt(await time.latest()) + BigInt(deadlineOffset);
    const requiredMatic = (energyAmount * pricePerKwh) / 1000n;

    const tx = await vault.connect(buyer).lockTrade(
      seller.address,
      tokenId,
      energyAmount,
      pricePerKwh,
      deadline,
      { value: requiredMatic }
    );
    const receipt = await tx.wait();
    const event = receipt!.logs.find((log) => {
      try {
        return vault.interface.parseLog({ topics: [...log.topics], data: log.data })?.name === "TradeLocked";
      } catch { return false; }
    });
    const parsed = vault.interface.parseLog({ topics: [...event!.topics], data: event!.data });
    return parsed!.args[0]; // tradeId
  }

  beforeEach(async function () {
    [admin, treasury, liquidityPool, seller, buyer, arbiter] = await ethers.getSigners();

    // Deploy LuzToken
    const LuzFactory = await ethers.getContractFactory("LuzToken");
    luzToken = await LuzFactory.deploy(
      "https://voltchainhub.io/{id}.json",
      treasury.address,
      liquidityPool.address,
      admin.address
    );

    // Deploy EnergyVault
    const VaultFactory = await ethers.getContractFactory("EnergyVault");
    vault = await VaultFactory.deploy(await luzToken.getAddress(), admin.address);

    // Grant vault the ARBITER_ROLE to arbiter
    await vault.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ARBITER_ROLE")), arbiter.address);

    // Mint tokens to seller (grant MINTER_ROLE to admin for test setup)
    await luzToken.grantRole(MINTER_ROLE, admin.address);

    tokenId = await luzToken.encodeTokenId(seller.address, 1000, 0);
    // Mint 10000 Wh to seller (after fees, seller gets 9800)
    await luzToken.mint(seller.address, tokenId, 10000n, "0x");

    // Seller approves vault to transfer tokens
    await luzToken.connect(seller).setApprovalForAll(await vault.getAddress(), true);
  });

  describe("Deployment", function () {
    it("should set LuzToken address", async function () {
      expect(await vault.luzToken()).to.equal(await luzToken.getAddress());
    });

    it("should revert with zero address", async function () {
      const Factory = await ethers.getContractFactory("EnergyVault");
      await expect(Factory.deploy(ethers.ZeroAddress, admin.address))
        .to.be.revertedWithCustomError(vault, "ZeroAddress");
    });
  });

  describe("Lock Trade", function () {
    it("should lock a trade with correct MATIC", async function () {
      const tradeId = await createLockedTrade();
      const trade = await vault.getTrade(tradeId);

      expect(trade.seller).to.equal(seller.address);
      expect(trade.buyer).to.equal(buyer.address);
      expect(trade.energyAmount).to.equal(energyAmount);
      expect(trade.status).to.equal(1); // Locked
    });

    it("should transfer seller tokens to vault", async function () {
      const balanceBefore = await luzToken.balanceOf(seller.address, tokenId);
      await createLockedTrade();
      const balanceAfter = await luzToken.balanceOf(seller.address, tokenId);
      expect(balanceBefore - balanceAfter).to.equal(energyAmount);
    });

    it("should emit TradeLocked event", async function () {
      const deadline = BigInt(await time.latest()) + 3600n;
      const requiredMatic = (energyAmount * pricePerKwh) / 1000n;

      await expect(
        vault.connect(buyer).lockTrade(seller.address, tokenId, energyAmount, pricePerKwh, deadline, { value: requiredMatic })
      ).to.emit(vault, "TradeLocked");
    });

    it("should revert with insufficient MATIC", async function () {
      const deadline = BigInt(await time.latest()) + 3600n;
      await expect(
        vault.connect(buyer).lockTrade(seller.address, tokenId, energyAmount, pricePerKwh, deadline, { value: 1n })
      ).to.be.revertedWithCustomError(vault, "InsufficientPayment");
    });

    it("should refund excess MATIC", async function () {
      const deadline = BigInt(await time.latest()) + 3600n;
      const requiredMatic = (energyAmount * pricePerKwh) / 1000n;
      const excess = ethers.parseEther("1");

      const balanceBefore = await ethers.provider.getBalance(buyer.address);
      const tx = await vault.connect(buyer).lockTrade(
        seller.address, tokenId, energyAmount, pricePerKwh, deadline,
        { value: requiredMatic + excess }
      );
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(buyer.address);

      // Buyer should only have spent requiredMatic + gas, not the excess
      expect(balanceBefore - balanceAfter - gasCost).to.equal(requiredMatic);
    });

    it("should revert for zero amount", async function () {
      const deadline = BigInt(await time.latest()) + 3600n;
      await expect(
        vault.connect(buyer).lockTrade(seller.address, tokenId, 0n, pricePerKwh, deadline, { value: 0n })
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");
    });

    it("should revert for deadline in past", async function () {
      const pastDeadline = BigInt(await time.latest()) - 100n;
      const requiredMatic = (energyAmount * pricePerKwh) / 1000n;
      await expect(
        vault.connect(buyer).lockTrade(seller.address, tokenId, energyAmount, pricePerKwh, pastDeadline, { value: requiredMatic })
      ).to.be.revertedWithCustomError(vault, "DeadlineInPast");
    });
  });

  describe("Confirm Delivery", function () {
    it("should allow buyer to confirm delivery", async function () {
      const tradeId = await createLockedTrade();
      await vault.connect(buyer).confirmDelivery(tradeId);
      const trade = await vault.getTrade(tradeId);
      expect(trade.status).to.equal(2); // Delivered
    });

    it("should revert if seller tries to confirm", async function () {
      const tradeId = await createLockedTrade();
      await expect(
        vault.connect(seller).confirmDelivery(tradeId)
      ).to.be.revertedWithCustomError(vault, "NotTradeParticipant");
    });
  });

  describe("Settle Trade", function () {
    it("should transfer tokens to buyer and MATIC to seller", async function () {
      const tradeId = await createLockedTrade();
      await vault.connect(buyer).confirmDelivery(tradeId);

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const buyerTokensBefore = await luzToken.balanceOf(buyer.address, tokenId);

      await vault.connect(buyer).settleTrade(tradeId);

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const buyerTokensAfter = await luzToken.balanceOf(buyer.address, tokenId);
      const trade = await vault.getTrade(tradeId);

      expect(trade.status).to.equal(3); // Settled
      expect(buyerTokensAfter - buyerTokensBefore).to.equal(energyAmount);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(trade.maticLocked);
    });

    it("should revert if not Delivered status", async function () {
      const tradeId = await createLockedTrade();
      await expect(
        vault.connect(buyer).settleTrade(tradeId)
      ).to.be.revertedWithCustomError(vault, "InvalidTradeStatus");
    });

    it("should revert if non-participant calls settle", async function () {
      const tradeId = await createLockedTrade();
      await vault.connect(buyer).confirmDelivery(tradeId);
      await expect(
        vault.connect(admin).settleTrade(tradeId)
      ).to.be.revertedWithCustomError(vault, "NotTradeParticipant");
    });
  });

  describe("Dispute Trade", function () {
    it("should allow buyer to dispute a locked trade", async function () {
      const tradeId = await createLockedTrade();
      await vault.connect(buyer).disputeTrade(tradeId, "Energy not received");
      const trade = await vault.getTrade(tradeId);
      expect(trade.status).to.equal(5); // Disputed
    });

    it("should allow seller to dispute a locked trade", async function () {
      const tradeId = await createLockedTrade();
      await vault.connect(seller).disputeTrade(tradeId, "Buyer unresponsive");
      const trade = await vault.getTrade(tradeId);
      expect(trade.status).to.equal(5); // Disputed
    });

    it("should revert if non-participant disputes", async function () {
      const tradeId = await createLockedTrade();
      await expect(
        vault.connect(admin).disputeTrade(tradeId, "random")
      ).to.be.revertedWithCustomError(vault, "NotTradeParticipant");
    });

    it("should emit TradeDisputed event", async function () {
      const tradeId = await createLockedTrade();
      await expect(vault.connect(buyer).disputeTrade(tradeId, "test reason"))
        .to.emit(vault, "TradeDisputed")
        .withArgs(tradeId, "test reason");
    });
  });

  describe("Resolve Dispute", function () {
    it("should resolve in seller's favor", async function () {
      const tradeId = await createLockedTrade();
      await vault.connect(buyer).disputeTrade(tradeId, "test");

      const sellerTokensBefore = await luzToken.balanceOf(seller.address, tokenId);
      const sellerBalBefore = await ethers.provider.getBalance(seller.address);

      await vault.connect(arbiter).resolveDispute(tradeId, true);

      const trade = await vault.getTrade(tradeId);
      expect(trade.status).to.equal(3); // Settled
      expect(await luzToken.balanceOf(seller.address, tokenId)).to.be.gt(sellerTokensBefore);
      expect(await ethers.provider.getBalance(seller.address)).to.be.gt(sellerBalBefore);
    });

    it("should resolve in buyer's favor", async function () {
      const tradeId = await createLockedTrade();
      await vault.connect(buyer).disputeTrade(tradeId, "test");

      const buyerTokensBefore = await luzToken.balanceOf(buyer.address, tokenId);

      await vault.connect(arbiter).resolveDispute(tradeId, false);

      expect(await luzToken.balanceOf(buyer.address, tokenId)).to.be.gt(buyerTokensBefore);
    });

    it("should revert if non-arbiter resolves", async function () {
      const tradeId = await createLockedTrade();
      await vault.connect(buyer).disputeTrade(tradeId, "test");
      await expect(
        vault.connect(buyer).resolveDispute(tradeId, false)
      ).to.be.reverted;
    });
  });

  describe("Expire Trade", function () {
    it("should expire and return assets after deadline", async function () {
      const tradeId = await createLockedTrade(60); // 60 second deadline

      await time.increase(120); // past deadline

      const sellerTokensBefore = await luzToken.balanceOf(seller.address, tokenId);
      const buyerBalBefore = await ethers.provider.getBalance(buyer.address);

      await vault.connect(admin).expireTrade(tradeId);

      const trade = await vault.getTrade(tradeId);
      expect(trade.status).to.equal(4); // Expired
      expect(await luzToken.balanceOf(seller.address, tokenId)).to.be.gt(sellerTokensBefore);
      expect(await ethers.provider.getBalance(buyer.address)).to.be.gt(buyerBalBefore);
    });

    it("should revert if deadline not reached", async function () {
      const tradeId = await createLockedTrade(3600);
      await expect(
        vault.connect(admin).expireTrade(tradeId)
      ).to.be.revertedWithCustomError(vault, "TradeNotExpired");
    });
  });

  describe("Pause", function () {
    it("should prevent lockTrade when paused", async function () {
      await vault.pause();
      const deadline = BigInt(await time.latest()) + 3600n;
      const requiredMatic = (energyAmount * pricePerKwh) / 1000n;
      await expect(
        vault.connect(buyer).lockTrade(seller.address, tokenId, energyAmount, pricePerKwh, deadline, { value: requiredMatic })
      ).to.be.reverted;
    });
  });
});
