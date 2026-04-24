import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("TokenRegistry", function () {
  let registry: TokenRegistry;
  let admin: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));

  const tokenA = "0x1111111111111111111111111111111111111111";
  const tokenB = "0x2222222222222222222222222222222222222222";
  const tokenC = "0x3333333333333333333333333333333333333333";

  enum Category {
    BRL_STABLE = 0,
    USD_STABLE = 1,
    NATIVE_WRAPPED = 2,
    OTHER = 3,
  }

  beforeEach(async function () {
    [admin, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TokenRegistry");
    registry = await Factory.deploy(admin.address);
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should grant admin roles to deployer-provided admin", async function () {
      expect(await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
      expect(await registry.hasRole(REGISTRAR_ROLE, admin.address)).to.be.true;
    });

    it("should revert if admin is zero address", async function () {
      const Factory = await ethers.getContractFactory("TokenRegistry");
      await expect(Factory.deploy(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(registry, "ZeroAddress");
    });
  });

  describe("addToken", function () {
    it("should add a token and make it queryable", async function () {
      await expect(registry.addToken(tokenA, Category.BRL_STABLE, 18, "BRZ"))
        .to.emit(registry, "TokenAdded")
        .withArgs(tokenA, Category.BRL_STABLE, "BRZ");

      expect(await registry.isSupported(tokenA)).to.be.true;
      expect(await registry.getCategory(tokenA)).to.equal(Category.BRL_STABLE);

      const info = await registry.tokens(tokenA);
      expect(info.supported).to.be.true;
      expect(info.decimals).to.equal(18);
      expect(info.symbol).to.equal("BRZ");
    });

    it("should revert on zero token address", async function () {
      await expect(registry.addToken(ethers.ZeroAddress, Category.USD_STABLE, 6, "USDC"))
        .to.be.revertedWithCustomError(registry, "ZeroAddress");
    });

    it("should revert on duplicate add", async function () {
      await registry.addToken(tokenA, Category.BRL_STABLE, 18, "BRZ");
      await expect(registry.addToken(tokenA, Category.BRL_STABLE, 18, "BRZ"))
        .to.be.revertedWithCustomError(registry, "TokenAlreadySupported")
        .withArgs(tokenA);
    });

    it("should revert when caller lacks REGISTRAR_ROLE", async function () {
      await expect(registry.connect(other).addToken(tokenA, Category.BRL_STABLE, 18, "BRZ"))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("should accept tokens of every category", async function () {
      await registry.addToken(tokenA, Category.BRL_STABLE, 18, "BRZ");
      await registry.addToken(tokenB, Category.USD_STABLE, 6, "USDC");
      await registry.addToken(tokenC, Category.NATIVE_WRAPPED, 18, "WETH");
      expect(await registry.getCategory(tokenA)).to.equal(Category.BRL_STABLE);
      expect(await registry.getCategory(tokenB)).to.equal(Category.USD_STABLE);
      expect(await registry.getCategory(tokenC)).to.equal(Category.NATIVE_WRAPPED);
    });
  });

  describe("removeToken", function () {
    beforeEach(async function () {
      await registry.addToken(tokenA, Category.BRL_STABLE, 18, "BRZ");
    });

    it("should mark a supported token as unsupported and keep history", async function () {
      await expect(registry.removeToken(tokenA, "liquidity dropped below threshold"))
        .to.emit(registry, "TokenRemoved")
        .withArgs(tokenA, "liquidity dropped below threshold");

      expect(await registry.isSupported(tokenA)).to.be.false;
      // still in list (history preserved), but supported flag is false
      const list = await registry.listAll();
      expect(list).to.include(tokenA);
    });

    it("should revert if token was never added", async function () {
      await expect(registry.removeToken(tokenB, "not listed"))
        .to.be.revertedWithCustomError(registry, "TokenNotSupported");
    });

    it("should revert when caller lacks REGISTRAR_ROLE", async function () {
      await expect(registry.connect(other).removeToken(tokenA, "attempt"))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("listAll", function () {
    it("should return all registered tokens in insertion order", async function () {
      await registry.addToken(tokenA, Category.BRL_STABLE, 18, "BRZ");
      await registry.addToken(tokenB, Category.USD_STABLE, 6, "USDC");
      await registry.addToken(tokenC, Category.NATIVE_WRAPPED, 18, "WETH");

      const list = await registry.listAll();
      expect(list.length).to.equal(3);
      expect(list[0]).to.equal(tokenA);
      expect(list[1]).to.equal(tokenB);
      expect(list[2]).to.equal(tokenC);
    });

    it("should return empty array when no tokens added", async function () {
      const list = await registry.listAll();
      expect(list.length).to.equal(0);
    });
  });

  describe("getCategory", function () {
    it("should revert for unknown token", async function () {
      await expect(registry.getCategory(tokenA))
        .to.be.revertedWithCustomError(registry, "TokenNotSupported");
    });
  });

  describe("Role management", function () {
    it("should allow admin to grant REGISTRAR_ROLE to another account", async function () {
      await registry.grantRole(REGISTRAR_ROLE, other.address);
      await expect(registry.connect(other).addToken(tokenA, Category.USD_STABLE, 6, "USDT"))
        .to.emit(registry, "TokenAdded");
    });
  });
});
