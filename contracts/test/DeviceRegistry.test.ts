import { expect } from "chai";
import { ethers } from "hardhat";
import { DeviceRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("DeviceRegistry", function () {
  let registry: DeviceRegistry;
  let admin: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));
  const deviceId = ethers.keccak256(ethers.toUtf8Bytes("device-serial-001"));
  const pubKeyX = ethers.keccak256(ethers.toUtf8Bytes("pubkey-x"));
  const pubKeyY = ethers.keccak256(ethers.toUtf8Bytes("pubkey-y"));
  const attestationSig = "0xdeadbeef";
  const metadata = "QmSomeIpfsHash";

  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("DeviceRegistry");
    registry = await Factory.deploy(admin.address);
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set admin roles", async function () {
      expect(await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
      expect(await registry.hasRole(REGISTRAR_ROLE, admin.address)).to.be.true;
    });

    it("should revert with zero address", async function () {
      const Factory = await ethers.getContractFactory("DeviceRegistry");
      await expect(Factory.deploy(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(registry, "ZeroAddress");
    });
  });

  describe("Device Registration", function () {
    it("should register a new device", async function () {
      await registry.connect(user1).registerDevice(deviceId, pubKeyX, pubKeyY, attestationSig, metadata);

      const device = await registry.getDevice(deviceId);
      expect(device.owner).to.equal(user1.address);
      expect(device.publicKeyX).to.equal(pubKeyX);
      expect(device.publicKeyY).to.equal(pubKeyY);
      expect(device.active).to.be.true;
      expect(device.metadata).to.equal(metadata);
    });

    it("should emit DeviceRegistered event", async function () {
      await expect(registry.connect(user1).registerDevice(deviceId, pubKeyX, pubKeyY, attestationSig, metadata))
        .to.emit(registry, "DeviceRegistered")
        .withArgs(deviceId, user1.address);
    });

    it("should increment device count", async function () {
      await registry.connect(user1).registerDevice(deviceId, pubKeyX, pubKeyY, attestationSig, metadata);
      expect(await registry.getDeviceCount()).to.equal(1);
    });

    it("should revert for duplicate device ID", async function () {
      await registry.connect(user1).registerDevice(deviceId, pubKeyX, pubKeyY, attestationSig, metadata);
      await expect(
        registry.connect(user2).registerDevice(deviceId, pubKeyX, pubKeyY, attestationSig, metadata)
      ).to.be.revertedWithCustomError(registry, "DeviceAlreadyRegistered");
    });

    it("should revert for zero public key", async function () {
      await expect(
        registry.connect(user1).registerDevice(deviceId, ethers.ZeroHash, pubKeyY, attestationSig, metadata)
      ).to.be.revertedWithCustomError(registry, "InvalidPublicKey");
    });

    it("should revert for empty attestation signature", async function () {
      await expect(
        registry.connect(user1).registerDevice(deviceId, pubKeyX, pubKeyY, "0x", metadata)
      ).to.be.revertedWithCustomError(registry, "InvalidSignature");
    });
  });

  describe("Device Deactivation", function () {
    beforeEach(async function () {
      await registry.connect(user1).registerDevice(deviceId, pubKeyX, pubKeyY, attestationSig, metadata);
    });

    it("should allow owner to deactivate", async function () {
      await registry.connect(user1).deactivateDevice(deviceId, "compromised");
      expect(await registry.isDeviceActive(deviceId)).to.be.false;
    });

    it("should allow admin to deactivate", async function () {
      await registry.connect(admin).deactivateDevice(deviceId, "admin override");
      expect(await registry.isDeviceActive(deviceId)).to.be.false;
    });

    it("should revert if non-owner/non-admin deactivates", async function () {
      await expect(
        registry.connect(user2).deactivateDevice(deviceId, "malicious")
      ).to.be.revertedWithCustomError(registry, "NotDeviceOwner");
    });

    it("should emit DeviceDeactivated event", async function () {
      await expect(registry.connect(user1).deactivateDevice(deviceId, "test"))
        .to.emit(registry, "DeviceDeactivated")
        .withArgs(deviceId, "test");
    });
  });

  describe("Device Reactivation", function () {
    beforeEach(async function () {
      await registry.connect(user1).registerDevice(deviceId, pubKeyX, pubKeyY, attestationSig, metadata);
      await registry.connect(user1).deactivateDevice(deviceId, "test");
    });

    it("should allow admin to reactivate", async function () {
      await registry.connect(admin).reactivateDevice(deviceId);
      expect(await registry.isDeviceActive(deviceId)).to.be.true;
    });

    it("should revert if non-admin reactivates", async function () {
      await expect(
        registry.connect(user1).reactivateDevice(deviceId)
      ).to.be.reverted;
    });
  });

  describe("Verify Reading", function () {
    beforeEach(async function () {
      await registry.connect(user1).registerDevice(deviceId, pubKeyX, pubKeyY, attestationSig, metadata);
    });

    it("should return true for valid reading from active device", async function () {
      const readingHash = ethers.keccak256(ethers.toUtf8Bytes("reading-data"));
      expect(await registry.verifyReading(deviceId, readingHash, attestationSig)).to.be.true;
    });

    it("should revert for non-existent device", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(
        registry.verifyReading(fakeId, ethers.ZeroHash, attestationSig)
      ).to.be.revertedWithCustomError(registry, "DeviceNotFound");
    });

    it("should revert for inactive device", async function () {
      await registry.connect(user1).deactivateDevice(deviceId, "test");
      const readingHash = ethers.keccak256(ethers.toUtf8Bytes("reading-data"));
      await expect(
        registry.verifyReading(deviceId, readingHash, attestationSig)
      ).to.be.revertedWithCustomError(registry, "DeviceNotActive");
    });
  });

  describe("Nonce Management", function () {
    beforeEach(async function () {
      await registry.connect(user1).registerDevice(deviceId, pubKeyX, pubKeyY, attestationSig, metadata);
    });

    it("should increment nonce", async function () {
      expect(await registry.deviceNonces(deviceId)).to.equal(0);
      await registry.connect(admin).incrementNonce(deviceId);
      expect(await registry.deviceNonces(deviceId)).to.equal(1);
    });

    it("should revert if non-registrar increments nonce", async function () {
      await expect(
        registry.connect(user1).incrementNonce(deviceId)
      ).to.be.reverted;
    });
  });

  describe("Metadata Update", function () {
    beforeEach(async function () {
      await registry.connect(user1).registerDevice(deviceId, pubKeyX, pubKeyY, attestationSig, metadata);
    });

    it("should allow owner to update metadata", async function () {
      await registry.connect(user1).updateMetadata(deviceId, "QmNewHash");
      const device = await registry.getDevice(deviceId);
      expect(device.metadata).to.equal("QmNewHash");
    });

    it("should revert if non-owner updates metadata", async function () {
      await expect(
        registry.connect(user2).updateMetadata(deviceId, "QmNewHash")
      ).to.be.revertedWithCustomError(registry, "NotDeviceOwner");
    });
  });
});
