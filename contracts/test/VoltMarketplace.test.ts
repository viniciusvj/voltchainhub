import { expect } from "chai";
import { ethers } from "hardhat";
import {
  VoltMarketplace,
  TokenRegistry,
  MockERC20,
  MockSwapRouter,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("VoltMarketplace", function () {
  let marketplace: VoltMarketplace;
  let registry: TokenRegistry;
  let swapRouter: MockSwapRouter;
  let brz: MockERC20;
  let usdc: MockERC20;

  let admin: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let operator: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let random: HardhatEthersSigner;

  const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
  const FEE_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FEE_MANAGER_ROLE"));

  enum Category {
    BRL_STABLE = 0,
    USD_STABLE = 1,
    NATIVE_WRAPPED = 2,
    OTHER = 3,
  }

  const orderId = ethers.keccak256(ethers.toUtf8Bytes("order-1"));
  const ONE_E18 = 10n ** 18n;

  beforeEach(async function () {
    [admin, treasury, operator, buyer, seller, random] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    brz = (await MockERC20.deploy("Brazilian Digital Token", "BRZ")) as unknown as MockERC20;
    usdc = (await MockERC20.deploy("USD Coin", "USDC")) as unknown as MockERC20;

    const TokenRegistryF = await ethers.getContractFactory("TokenRegistry");
    registry = (await TokenRegistryF.deploy(admin.address)) as unknown as TokenRegistry;
    await registry.addToken(await brz.getAddress(), Category.BRL_STABLE, 18, "BRZ");
    await registry.addToken(await usdc.getAddress(), Category.USD_STABLE, 18, "USDC");

    const MockSwapRouterF = await ethers.getContractFactory("MockSwapRouter");
    swapRouter = (await MockSwapRouterF.deploy()) as unknown as MockSwapRouter;

    const VoltMarketplaceF = await ethers.getContractFactory("VoltMarketplace");
    marketplace = (await VoltMarketplaceF.deploy(
      admin.address,
      treasury.address,
      await registry.getAddress(),
      await swapRouter.getAddress(),
    )) as unknown as VoltMarketplace;

    await marketplace.grantRole(OPERATOR_ROLE, operator.address);

    // Fund operator with BRZ so they can settle (operator holds buyer funds in real flow)
    await brz.mint(operator.address, ethers.parseEther("10000"));
    // Fund swap router with USDC so it can deliver it after receiving BRZ
    await usdc.mint(await swapRouter.getAddress(), ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("should set admin, treasury, registry, and swapRouter", async function () {
      expect(await marketplace.treasury()).to.equal(treasury.address);
      expect(await marketplace.registry()).to.equal(await registry.getAddress());
      expect(await marketplace.swapRouter()).to.equal(await swapRouter.getAddress());
      expect(await marketplace.feeBps()).to.equal(50);
    });

    it("should revert on zero addresses", async function () {
      const F = await ethers.getContractFactory("VoltMarketplace");
      await expect(
        F.deploy(ethers.ZeroAddress, treasury.address, await registry.getAddress(), await swapRouter.getAddress())
      ).to.be.revertedWithCustomError(marketplace, "ZeroAddress");

      await expect(
        F.deploy(admin.address, ethers.ZeroAddress, await registry.getAddress(), await swapRouter.getAddress())
      ).to.be.revertedWithCustomError(marketplace, "ZeroAddress");
    });
  });

  describe("settle — direct transfer (payToken == receiveToken)", function () {
    it("should retain 0.5% fee and forward 99.5% to seller", async function () {
      const gross = ethers.parseEther("1000"); // 1000 BRZ
      const expectedFee = (gross * 50n) / 10_000n; // 0.5% = 5 BRZ
      const expectedNet = gross - expectedFee; // 995 BRZ

      await brz.connect(operator).approve(await marketplace.getAddress(), gross);

      await expect(
        marketplace.connect(operator).settle(
          orderId,
          buyer.address,
          seller.address,
          await brz.getAddress(),
          await brz.getAddress(), // same token → direct
          gross,
          expectedNet, // minReceive
        )
      ).to.emit(marketplace, "PaymentSettled");

      expect(await brz.balanceOf(seller.address)).to.equal(expectedNet);
      expect(await brz.balanceOf(treasury.address)).to.equal(expectedFee);
    });
  });

  describe("settle — swap path (payToken != receiveToken)", function () {
    it("should swap BRZ→USDC at 1:1 rate and forward to seller (minus fee)", async function () {
      // MockSwapRouter default rate = 1e18 (1:1)
      const gross = ethers.parseEther("1000");
      const expectedFee = (gross * 50n) / 10_000n;
      const expectedNetForSwap = gross - expectedFee;

      await brz.connect(operator).approve(await marketplace.getAddress(), gross);

      await marketplace.connect(operator).settle(
        orderId,
        buyer.address,
        seller.address,
        await brz.getAddress(),
        await usdc.getAddress(),
        gross,
        expectedNetForSwap, // minReceive (1:1 rate → same amount)
      );

      expect(await usdc.balanceOf(seller.address)).to.equal(expectedNetForSwap);
      expect(await brz.balanceOf(treasury.address)).to.equal(expectedFee);
    });

    it("should revert on slippage (router returns less than minReceive)", async function () {
      // Set rate to 0.9 (10% slippage)
      await swapRouter.setRate(ethers.parseEther("0.9"));

      const gross = ethers.parseEther("1000");
      const expectedNetForSwap = gross - (gross * 50n) / 10_000n; // expect 995
      // But router returns 995 * 0.9 = 895.5, below minReceive

      await brz.connect(operator).approve(await marketplace.getAddress(), gross);

      await expect(
        marketplace.connect(operator).settle(
          orderId,
          buyer.address,
          seller.address,
          await brz.getAddress(),
          await usdc.getAddress(),
          gross,
          expectedNetForSwap,
        )
      ).to.be.revertedWithCustomError(marketplace, "SlippageTooHigh");
    });
  });

  describe("Access control", function () {
    it("should revert if caller lacks OPERATOR_ROLE", async function () {
      const gross = ethers.parseEther("1");
      await brz.mint(random.address, gross);
      await brz.connect(random).approve(await marketplace.getAddress(), gross);

      await expect(
        marketplace.connect(random).settle(
          orderId,
          buyer.address,
          seller.address,
          await brz.getAddress(),
          await brz.getAddress(),
          gross,
          0,
        )
      ).to.be.revertedWithCustomError(marketplace, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Unsupported token", function () {
    it("should revert if payToken not in registry", async function () {
      const fake = await (await ethers.getContractFactory("MockERC20")).deploy("FAKE", "FAKE");
      await fake.mint(operator.address, ethers.parseEther("1"));
      await fake.connect(operator).approve(await marketplace.getAddress(), ethers.parseEther("1"));

      await expect(
        marketplace.connect(operator).settle(
          orderId,
          buyer.address,
          seller.address,
          await fake.getAddress(),
          await brz.getAddress(),
          ethers.parseEther("1"),
          0,
        )
      )
        .to.be.revertedWithCustomError(marketplace, "UnsupportedToken")
        .withArgs(await fake.getAddress());
    });

    it("should revert if receiveToken not in registry", async function () {
      const fake = await (await ethers.getContractFactory("MockERC20")).deploy("FAKE", "FAKE");
      await brz.connect(operator).approve(await marketplace.getAddress(), ethers.parseEther("1"));

      await expect(
        marketplace.connect(operator).settle(
          orderId,
          buyer.address,
          seller.address,
          await brz.getAddress(),
          await fake.getAddress(),
          ethers.parseEther("1"),
          0,
        )
      )
        .to.be.revertedWithCustomError(marketplace, "UnsupportedToken")
        .withArgs(await fake.getAddress());
    });
  });

  describe("Fee management", function () {
    it("FEE_MANAGER_ROLE can update feeBps within cap", async function () {
      await expect(marketplace.setFeeBps(100))
        .to.emit(marketplace, "FeeUpdated")
        .withArgs(50, 100);
      expect(await marketplace.feeBps()).to.equal(100);
    });

    it("should revert when setting feeBps above MAX_FEE_BPS (200)", async function () {
      await expect(marketplace.setFeeBps(201))
        .to.be.revertedWithCustomError(marketplace, "FeeAboveMaximum")
        .withArgs(201, 200);
    });

    it("non-manager cannot update fee", async function () {
      await expect(marketplace.connect(random).setFeeBps(10))
        .to.be.revertedWithCustomError(marketplace, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pausable", function () {
    it("settle reverts when paused", async function () {
      await marketplace.pause();
      const gross = ethers.parseEther("1");
      await brz.connect(operator).approve(await marketplace.getAddress(), gross);

      await expect(
        marketplace.connect(operator).settle(
          orderId,
          buyer.address,
          seller.address,
          await brz.getAddress(),
          await brz.getAddress(),
          gross,
          0,
        )
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
    });

    it("settle works again after unpause", async function () {
      await marketplace.pause();
      await marketplace.unpause();
      const gross = ethers.parseEther("100");
      await brz.connect(operator).approve(await marketplace.getAddress(), gross);

      await expect(
        marketplace.connect(operator).settle(
          orderId,
          buyer.address,
          seller.address,
          await brz.getAddress(),
          await brz.getAddress(),
          gross,
          (gross * 9_950n) / 10_000n,
        )
      ).to.not.be.reverted;
    });
  });

  describe("Treasury & admin", function () {
    it("admin can update treasury", async function () {
      await expect(marketplace.setTreasury(random.address))
        .to.emit(marketplace, "TreasuryUpdated");
      expect(await marketplace.treasury()).to.equal(random.address);
    });

    it("cannot set treasury to zero", async function () {
      await expect(marketplace.setTreasury(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(marketplace, "ZeroAddress");
    });
  });

  describe("Input validation", function () {
    it("should revert on zero grossAmount", async function () {
      await expect(
        marketplace.connect(operator).settle(
          orderId,
          buyer.address,
          seller.address,
          await brz.getAddress(),
          await brz.getAddress(),
          0,
          0,
        )
      ).to.be.revertedWithCustomError(marketplace, "ZeroAmount");
    });

    it("should revert on zero buyer or seller address", async function () {
      const gross = ethers.parseEther("1");
      await brz.connect(operator).approve(await marketplace.getAddress(), gross);

      await expect(
        marketplace.connect(operator).settle(
          orderId,
          ethers.ZeroAddress,
          seller.address,
          await brz.getAddress(),
          await brz.getAddress(),
          gross,
          0,
        )
      ).to.be.revertedWithCustomError(marketplace, "ZeroAddress");
    });
  });
});
