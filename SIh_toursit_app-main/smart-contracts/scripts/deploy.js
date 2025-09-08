import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  const UserRegistry = await ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();

  console.log("UserRegistry deployed to:", await userRegistry.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
