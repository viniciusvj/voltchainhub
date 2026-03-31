import { expect } from "chai";
import { ethers } from "hardhat";
import { LuzToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("LuzToken", function () {
  let luzToken: LuzToken;
  let admin: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let liquidityPool: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  const URI = "https://voltchainhub.io/metadata/{id}.json";
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

  beforeEach(async function () {
    [admin, treasury, liquidityPool, minter, user1, user2] = await ethers.getSigners();

    const LuzTokenFactory = await ethers.getContractFactory("LuzToken");
    luzToken = await LuzTokenFactory.deploy(URI, treasury.address, liquidityPool.address, admin.address);
    await luzToken.waitForDeployment();

    await luzToken.grantRole(MINTER_ROLE, minter.address);
    await luzToken.grantRole(BURNER_ROLE, minter.address);
  });

  describe("Deployment", function () {
    it("should set correct URI, treasury, and liquidity pool", async function () {
      expect(await luzToken.treasury()).to.equal(treasury.address);
      expect(await luzToken.liquidityPool()).to.equal(liquidityPool.address);
    });

    it("should revert with zero address constructor args", async function () {
      const Factory = await ethers.getContractFactory("LuzToken");
      await expect(
        Factory.deploy(URI, ethers.ZeroAddress, liquidityPool.address, admin.address)
      ).to.be.revertedWithCustomError(luzToken, "ZeroAddress");
    });
  });

  describe("encodeTokenId", function () {
    it("should return deterministic hash for same inputs", async function () {
      const id1 = await luzToken.encodeTokenId(user1.address, 1000, 0);
      const id2 = await luzToken.encodeTokenId(user1.address, 1000, 0);
      expect(id1).to.equal(id2);
    });

    it("should return different hashes for different inputs", async function () {
      const id1 = await luzToken.encodeTokenId(user1.address, 1000, 0);
      const id2 = await luzToken.encodeTokenId(user1.address, 1000, 1);
      expect(id1).to.not.equal(id2);
    });

    it("should revert for invalid source type", async function () {
      await expect(
        luzToken.encodeTokenId(user1.address, 1000, 4)
      ).to.be.revertedWithCustomError(luzToken, "InvalidSourceType");
    });
  });

  describe("Minting", function () {
    it("should mint with 1% treasury + 1% liquidity fee", async function () {
      const tokenId = await luzToken.encodeTokenId(user1.address, 1000, 0);
      const amount = 10000n; // 10 kWh in Wh

      await luzToken.connect(minter).mint(user1.address, tokenId, amount, "0x");

      const sellerAmount = amount - (amount * 100n) / 10000n - (amount * 100n) / 10000n;
      expect(await luzToken.balanceOf(user1.address, tokenId)).to.equal(sellerAmount);
      expect(await luzToken.balanceOf(treasury.address, tokenId)).to.equal(100n);
      expect(await luzToken.balanceOf(liquidityPool.address, tokenId)).to.equal(100n);
    });

    it("should track total supply correctly", async function () {
      const tokenId = await luzToken.encodeTokenId(user1.address, 1000, 0);
      await luzToken.connect(minter).mint(user1.address, tokenId, 10000n, "0x");

      expect(await luzToken.totalSupply(tokenId)).to.equal(10000n);
      expect(await luzToken.totalSupplyAll()).to.equal(10000n);
    });

    it("should revert if caller lacks MINTER_ROLE", async function () {
      const tokenId = await luzToken.encodeTokenId(user1.address, 1000, 0);
      await expect(
        luzToken.connect(user1).mint(user1.address, tokenId, 1000n, "0x")
      ).to.be.reverted;
    });

    it("should revert for zero amount", async function () {
      const tokenId = await luzToken.encodeTokenId(user1.address, 1000, 0);
      await expect(
        luzToken.connect(minter).mint(user1.address, tokenId, 0n, "0x")
      ).to.be.revertedWithCustomError(luzToken, "InvalidAmount");
    });

    it("should emit TokenMinted and FeesDistributed events", async function () {
      const tokenId = await luzToken.encodeTokenId(user1.address, 1000, 0);
      await expect(luzToken.connect(minter).mint(user1.address, tokenId, 10000n, "0x"))
        .to.emit(luzToken, "TokenMinted")
        .withArgs(user1.address, tokenId, 10000n)
        .and.to.emit(luzToken, "FeesDistributed");
    });
  });

  describe("Burning", function () {
    it("should burn tokens and decrease supply", async function () {
      const tokenId = await luzToken.encodeTokenId(user1.address, 1000, 0);
      await luzToken.connect(minter).mint(user1.address, tokenId, 10000n, "0x");

      const balance = await luzToken.balanceOf(user1.address, tokenId);
      await luzToken.connect(minter).burn(user1.address, tokenId, balance);

      expect(await luzToken.balanceOf(user1.address, tokenId)).to.equal(0n);
    });

    it("should revert if caller lacks BURNER_ROLE", async function () {
      const tokenId = await luzToken.encodeTokenId(user1.address, 1000, 0);
      await luzToken.connect(minter).mint(user1.address, tokenId, 10000n, "0x");
      await expect(
        luzToken.connect(user1).burn(user1.address, tokenId, 100n)
      ).to.be.reverted;
    });
  });

  describe("Admin", function () {
    it("should update treasury address", async function () {
      await luzToken.setTreasury(user2.address);
      expect(await luzToken.treasury()).to.equal(user2.address);
    });

    it("should update liquidity pool address", async function () {
      await luzToken.setLiquidityPool(user2.address);
      expect(await luzToken.liquidityPool()).to.equal(user2.address);
    });

    it("should pause and unpause", async function () {
      await luzToken.pause();
      const tokenId = await luzToken.encodeTokenId(user1.address, 1000, 0);
      await expect(
        luzToken.connect(minter).mint(user1.address, tokenId, 1000n, "0x")
      ).to.be.reverted;

      await luzToken.unpause();
      await expect(
        luzToken.connect(minter).mint(user1.address, tokenId, 1000n, "0x")
      ).to.not.be.reverted;
    });
  });
});
