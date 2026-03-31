import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { LuzToken, DeviceRegistry, EnergyOracle } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("EnergyOracle", function () {
  let luzToken: LuzToken;
  let registry: DeviceRegistry;
  let oracle: EnergyOracle;
  let admin: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let liquidityPool: HardhatEthersSigner;
  let oracle1: HardhatEthersSigner;
  let oracle2: HardhatEthersSigner;
  let oracle3: HardhatEthersSigner;
  let prosumer: HardhatEthersSigner;
  let contester: HardhatEthersSigner;

  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE"));
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));

  const deviceId = ethers.keccak256(ethers.toUtf8Bytes("device-001"));
  const pubKeyX = ethers.keccak256(ethers.toUtf8Bytes("pubkey-x"));
  const pubKeyY = ethers.keccak256(ethers.toUtf8Bytes("pubkey-y"));
  const signature = "0xdeadbeef";

  beforeEach(async function () {
    [admin, treasury, liquidityPool, oracle1, oracle2, oracle3, prosumer, contester] = await ethers.getSigners();

    // Deploy LuzToken
    const LuzFactory = await ethers.getContractFactory("LuzToken");
    luzToken = await LuzFactory.deploy(
      "https://voltchainhub.io/{id}.json",
      treasury.address,
      liquidityPool.address,
      admin.address
    );

    // Deploy DeviceRegistry
    const RegistryFactory = await ethers.getContractFactory("DeviceRegistry");
    registry = await RegistryFactory.deploy(admin.address);

    // Deploy EnergyOracle
    const OracleFactory = await ethers.getContractFactory("EnergyOracle");
    oracle = await OracleFactory.deploy(
      await registry.getAddress(),
      await luzToken.getAddress(),
      admin.address
    );

    // Grant oracle contract REGISTRAR_ROLE on registry (for incrementNonce)
    await registry.grantRole(REGISTRAR_ROLE, await oracle.getAddress());

    // Grant oracle contract MINTER_ROLE on LuzToken
    await luzToken.grantRole(MINTER_ROLE, await oracle.getAddress());

    // Grant ORACLE_ROLE to oracle accounts
    await oracle.grantRole(ORACLE_ROLE, oracle1.address);
    await oracle.grantRole(ORACLE_ROLE, oracle2.address);
    await oracle.grantRole(ORACLE_ROLE, oracle3.address);

    // Register a device
    await registry.connect(prosumer).registerDevice(deviceId, pubKeyX, pubKeyY, signature, "QmDevice");
  });

  describe("Deployment", function () {
    it("should set device registry and luz token addresses", async function () {
      expect(await oracle.deviceRegistry()).to.equal(await registry.getAddress());
      expect(await oracle.luzToken()).to.equal(await luzToken.getAddress());
    });

    it("should revert with zero address", async function () {
      const Factory = await ethers.getContractFactory("EnergyOracle");
      await expect(
        Factory.deploy(ethers.ZeroAddress, await luzToken.getAddress(), admin.address)
      ).to.be.revertedWithCustomError(oracle, "ZeroAddress");
    });
  });

  describe("Submit Reading", function () {
    it("should submit a reading below quorum threshold (auto-confirm)", async function () {
      const slot = 1000;
      await oracle.connect(oracle1).submitReading(deviceId, 5000, 1700000000, slot, 0, signature);

      const readingId = await oracle.computeReadingId(deviceId, slot, 0);
      const reading = await oracle.getReading(readingId);
      expect(reading.wattHours).to.equal(5000);
      // Status.Confirmed = 1
      expect(reading.status).to.equal(1);
    });

    it("should emit ReadingSubmitted and ReadingConfirmed for small readings", async function () {
      const slot = 1000;
      const readingId = await oracle.computeReadingId(deviceId, slot, 0);

      await expect(oracle.connect(oracle1).submitReading(deviceId, 5000, 1700000000, slot, 0, signature))
        .to.emit(oracle, "ReadingSubmitted")
        .withArgs(readingId, deviceId, 5000)
        .and.to.emit(oracle, "ReadingConfirmed")
        .withArgs(readingId);
    });

    it("should keep reading Pending for large amounts (>100 kWh)", async function () {
      const slot = 2000;
      const largeAmount = 200_000; // 200 kWh in Wh
      await oracle.connect(oracle1).submitReading(deviceId, largeAmount, 1700000000, slot, 0, signature);

      const readingId = await oracle.computeReadingId(deviceId, slot, 0);
      const reading = await oracle.getReading(readingId);
      // Status.Pending = 0
      expect(reading.status).to.equal(0);
    });

    it("should revert for inactive device", async function () {
      await registry.connect(prosumer).deactivateDevice(deviceId, "test");
      await expect(
        oracle.connect(oracle1).submitReading(deviceId, 1000, 1700000000, 1000, 0, signature)
      ).to.be.revertedWithCustomError(oracle, "DeviceNotActive");
    });

    it("should revert for zero watt hours", async function () {
      await expect(
        oracle.connect(oracle1).submitReading(deviceId, 0, 1700000000, 1000, 0, signature)
      ).to.be.revertedWithCustomError(oracle, "InvalidReading");
    });

    it("should revert for duplicate reading", async function () {
      await oracle.connect(oracle1).submitReading(deviceId, 5000, 1700000000, 1000, 0, signature);
      await expect(
        oracle.connect(oracle2).submitReading(deviceId, 5000, 1700000000, 1000, 0, signature)
      ).to.be.revertedWithCustomError(oracle, "ReadingAlreadyExists");
    });

    it("should revert if caller lacks ORACLE_ROLE", async function () {
      await expect(
        oracle.connect(prosumer).submitReading(deviceId, 5000, 1700000000, 1000, 0, signature)
      ).to.be.reverted;
    });
  });

  describe("Multi-Oracle Confirmation", function () {
    const slot = 3000;
    const largeAmount = 200_000;
    let readingId: string;

    beforeEach(async function () {
      await oracle.connect(oracle1).submitReading(deviceId, largeAmount, 1700000000, slot, 0, signature);
      readingId = await oracle.computeReadingId(deviceId, slot, 0);
    });

    it("should confirm after reaching quorum (3 oracles)", async function () {
      await oracle.connect(oracle2).confirmReading(readingId, signature);
      let reading = await oracle.getReading(readingId);
      expect(reading.status).to.equal(0); // Still Pending

      await oracle.connect(oracle3).confirmReading(readingId, signature);
      reading = await oracle.getReading(readingId);
      expect(reading.status).to.equal(1); // Confirmed
    });

    it("should revert if oracle confirms twice", async function () {
      await expect(
        oracle.connect(oracle1).confirmReading(readingId, signature)
      ).to.be.revertedWithCustomError(oracle, "AlreadyConfirmed");
    });
  });

  describe("Contestation", function () {
    const slot = 4000;
    let readingId: string;

    beforeEach(async function () {
      await oracle.connect(oracle1).submitReading(deviceId, 5000, 1700000000, slot, 0, signature);
      readingId = await oracle.computeReadingId(deviceId, slot, 0);
    });

    it("should allow contestation within 30 min window", async function () {
      await oracle.connect(contester).contestReading(readingId, "0xdeadbeefcafe");
      const reading = await oracle.getReading(readingId);
      expect(reading.status).to.equal(2); // Contested
    });

    it("should revert contestation after window closes", async function () {
      await time.increase(31 * 60); // 31 minutes
      await expect(
        oracle.connect(contester).contestReading(readingId, "0xdeadbeefcafe")
      ).to.be.revertedWithCustomError(oracle, "ContestationWindowClosed");
    });

    it("should resolve contestation - accept", async function () {
      await oracle.connect(contester).contestReading(readingId, "0xdeadbeefcafe");
      await oracle.connect(admin).resolveContestation(readingId, true);
      const reading = await oracle.getReading(readingId);
      expect(reading.status).to.equal(1); // Confirmed
    });

    it("should resolve contestation - reject", async function () {
      await oracle.connect(contester).contestReading(readingId, "0xdeadbeefcafe");
      await oracle.connect(admin).resolveContestation(readingId, false);
      const reading = await oracle.getReading(readingId);
      expect(reading.status).to.equal(3); // Rejected
    });
  });

  describe("Mint From Reading", function () {
    const slot = 5000;
    let readingId: string;

    beforeEach(async function () {
      await oracle.connect(oracle1).submitReading(deviceId, 5000, 1700000000, slot, 0, signature);
      readingId = await oracle.computeReadingId(deviceId, slot, 0);
    });

    it("should mint tokens after contestation window", async function () {
      await time.increase(31 * 60);
      await oracle.connect(oracle1).mintFromReading(readingId, prosumer.address);

      const reading = await oracle.getReading(readingId);
      expect(reading.status).to.equal(4); // Minted
    });

    it("should revert if contestation window still open", async function () {
      await expect(
        oracle.connect(oracle1).mintFromReading(readingId, prosumer.address)
      ).to.be.revertedWithCustomError(oracle, "ContestationWindowOpen");
    });

    it("should revert for non-confirmed reading", async function () {
      // Submit a large reading (stays Pending)
      const slot2 = 6000;
      await oracle.connect(oracle1).submitReading(deviceId, 200_000, 1700000000, slot2, 1, signature);
      const rid = await oracle.computeReadingId(deviceId, slot2, 1);
      await time.increase(31 * 60);

      await expect(
        oracle.connect(oracle1).mintFromReading(rid, prosumer.address)
      ).to.be.revertedWithCustomError(oracle, "ReadingNotPending");
    });
  });

  describe("Admin", function () {
    it("should update quorum threshold", async function () {
      await oracle.setQuorumThreshold(200_000);
      expect(await oracle.quorumThreshold()).to.equal(200_000);
    });

    it("should update quorum required", async function () {
      await oracle.setQuorumRequired(5);
      expect(await oracle.quorumRequired()).to.equal(5);
    });

    it("should update anomaly threshold", async function () {
      await oracle.setAnomalyThreshold(30000);
      expect(await oracle.anomalyThresholdBps()).to.equal(30000);
    });
  });
});
