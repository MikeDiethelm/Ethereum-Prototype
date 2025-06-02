import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { ZHAW_RPC_URL, PRIVATE_KEY } from "./constants";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    zhaw: {
      url: ZHAW_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};

export default config;
