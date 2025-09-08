import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.24",
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  // Add this line
  plugins: ["@typechain/hardhat"],
};

export default config;
