// Viseron Cosmos — Hardhat deploy script (Ethereum / BSC)
// Uso: npx hardhat run scripts/deploy.cjs --network ethereum|binance|hardhat
// Exige contracts/.env com DEPLOYER_PRIVATE_KEY e RPC_URL (gitignored).
const { ethers } = require("hardhat");
const fs = require("node:fs");
const path = require("node:path");

const OUT = path.join(__dirname, "..", "deployments.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n[Viseron Cosmos] Deploying with ${deployer.address}`);

  const vsr = await (await ethers.getContractFactory("ViseronCrown")).deploy(deployer.address);
  await vsr.waitForDeployment();
  const vsrAddr = await vsr.getAddress();
  console.log(`VSR  ViseronCrown : ${vsrAddr}`);

  const trin = await (await ethers.getContractFactory("Trinnity")).deploy();
  await trin.waitForDeployment();
  const trinAddr = await trin.getAddress();
  console.log(`TRIN Trinnity     : ${trinAddr}`);

  const staking = await (await ethers.getContractFactory("ViseronCrownStaking")).deploy(vsrAddr, trinAddr, ethers.parseEther("100"));
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log(`Staking           : ${stakingAddr}`);

  const gov = await (await ethers.getContractFactory("ViseronGovernance")).deploy(vsrAddr);
  await gov.waitForDeployment();
  const govAddr = await gov.getAddress();
  console.log(`Governance        : ${govAddr}`);

  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const snapshot = { chainId, deployedAt: Date.now(), deployer: deployer.address, VSR: vsrAddr, TRIN: trinAddr, Staking: stakingAddr, Governance: govAddr };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
  existing[chainId] = snapshot;
  fs.writeFileSync(OUT, JSON.stringify(existing, null, 2), "utf8");

  console.log(`\n[Viseron Cosmos] Done. Endereços gravados em ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
