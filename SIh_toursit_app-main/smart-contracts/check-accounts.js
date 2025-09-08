import { ethers } from 'ethers';

async function fundAccount() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // The funded account (we need to find its private key)
  const fundedAccount = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  // The account we want to fund
  const targetAccount = '0x2d38919ac8eBFeA5D1033762c415D6d107092923';
  
  console.log('Funded account balance:', ethers.formatEther(await provider.getBalance(fundedAccount)), 'ETH');
  console.log('Target account balance before:', ethers.formatEther(await provider.getBalance(targetAccount)), 'ETH');
  
  // Try different hardhat private keys
  const hardhatPrivateKeys = [
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5ef7aed7ff149677ea4d',
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'
  ];
  
  for (let i = 0; i < hardhatPrivateKeys.length; i++) {
    try {
      const wallet = new ethers.Wallet(hardhatPrivateKeys[i], provider);
      const balance = await provider.getBalance(wallet.address);
      console.log(`Account ${i}: ${wallet.address} - Balance: ${ethers.formatEther(balance)} ETH`);
    } catch (error) {
      console.log(`Error with private key ${i}:`, error.message);
    }
  }
}

fundAccount().catch(console.error);
