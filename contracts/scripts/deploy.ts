import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");

  // --- Configuration ---
  const METADATA_URI = "https://voltchainhub.io/metadata/{id}.json";
  // In production, use dedicated addresses. For testnet, deployer acts as all.
  const treasury = deployer.address;
  const liquidityPool = deployer.address;
  const admin = deployer.address;

  // --- 1. Deploy LuzToken ---
  console.log("\n1. Deploying LuzToken...");
  const LuzToken = await ethers.getContractFactory("LuzToken");
  const luzToken = await LuzToken.deploy(METADATA_URI, treasury, liquidityPool, admin);
  await luzToken.waitForDeployment();
  const luzTokenAddr = await luzToken.getAddress();
  console.log("   LuzToken deployed to:", luzTokenAddr);

  // --- 2. Deploy DeviceRegistry ---
  console.log("\n2. Deploying DeviceRegistry...");
  const DeviceRegistry = await ethers.getContractFactory("DeviceRegistry");
  const registry = await DeviceRegistry.deploy(admin);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("   DeviceRegistry deployed to:", registryAddr);

  // --- 3. Deploy EnergyOracle ---
  console.log("\n3. Deploying EnergyOracle...");
  const EnergyOracle = await ethers.getContractFactory("EnergyOracle");
  const oracle = await EnergyOracle.deploy(registryAddr, luzTokenAddr, admin);
  await oracle.waitForDeployment();
  const oracleAddr = await oracle.getAddress();
  console.log("   EnergyOracle deployed to:", oracleAddr);

  // --- 4. Deploy EnergyVault ---
  console.log("\n4. Deploying EnergyVault...");
  const EnergyVault = await ethers.getContractFactory("EnergyVault");
  const vault = await EnergyVault.deploy(luzTokenAddr, admin);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("   EnergyVault deployed to:", vaultAddr);

  // --- 5. Configure Roles ---
  console.log("\n5. Configuring roles...");

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));

  // Grant EnergyOracle the MINTER_ROLE on LuzToken
  await luzToken.grantRole(MINTER_ROLE, oracleAddr);
  console.log("   Granted MINTER_ROLE to EnergyOracle on LuzToken");

  // Grant EnergyOracle the REGISTRAR_ROLE on DeviceRegistry (for nonce increment)
  await registry.grantRole(REGISTRAR_ROLE, oracleAddr);
  console.log("   Granted REGISTRAR_ROLE to EnergyOracle on DeviceRegistry");

  // --- Summary ---
  console.log("\n========================================");
  console.log("  VoltchainHub Deployment Summary");
  console.log("========================================");
  console.log("  LuzToken:       ", luzTokenAddr);
  console.log("  DeviceRegistry: ", registryAddr);
  console.log("  EnergyOracle:   ", oracleAddr);
  console.log("  EnergyVault:    ", vaultAddr);
  console.log("  Admin:          ", admin);
  console.log("  Treasury:       ", treasury);
  console.log("  Liquidity Pool: ", liquidityPool);
  console.log("========================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
