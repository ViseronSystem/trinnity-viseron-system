require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

module.exports = {
  paths: { sources: "./sol", artifacts: "./artifacts", cache: "./cache" },
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    hardhat: {},
    ethereum: { url: RPC_URL, accounts: [PRIVATE_KEY] },
    binance: { url: "https://bsc-dataseed.binance.org", accounts: [PRIVATE_KEY] },
  },
};
