import { ethers } from "hardhat";
import { verify } from "./verify";

async function main() {
  console.log("🚀 Deploying ConsentAudit contract...");

  // Get the contract factory
  const ConsentAudit = await ethers.getContractFactory("ConsentAudit");

  // Deploy the contract
  const consentAudit = await ConsentAudit.deploy();
  await consentAudit.waitForDeployment();

  const address = await consentAudit.getAddress();
  console.log(`✅ ConsentAudit deployed to: ${address}`);

  // Wait for a few block confirmations
  console.log("⏳ Waiting for block confirmations...");
  await consentAudit.deploymentTransaction()?.wait(5);

  // Get deployment info
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  const blockNumber = await ethers.provider.getBlockNumber();

  console.log(`📊 Deployment Info:`);
  console.log(`   Network: ${network.name} (Chain ID: ${chainId})`);
  console.log(`   Contract: ${address}`);
  console.log(`   Block: ${blockNumber}`);
  console.log(`   Deployer: ${await consentAudit.deploymentTransaction()?.from}`);

  // Verify contract on Etherscan (if not local network)
  if (chainId !== 1337n && chainId !== 31337n) {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await verify(address, []);
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("⚠️  Contract verification failed:", error);
    }
  }

  // Test basic functionality
  console.log("🧪 Testing basic contract functionality...");
  
  try {
    // Test getStats
    const stats = await consentAudit.getStats();
    console.log(`   Initial stats: ${stats.totalConsents_} consents, ${stats.totalAccessLogs_} logs, ${stats.consentExpiryDays_} days expiry`);
    
    // Test owner functions
    const owner = await consentAudit.owner();
    console.log(`   Contract owner: ${owner}`);
    
    console.log("✅ Basic functionality test passed!");
  } catch (error) {
    console.log("❌ Basic functionality test failed:", error);
  }

  // Save deployment info
  const deploymentInfo = {
    contract: "ConsentAudit",
    address: address,
    network: network.name,
    chainId: chainId.toString(),
    blockNumber: blockNumber.toString(),
    deployer: await consentAudit.deploymentTransaction()?.from,
    timestamp: new Date().toISOString(),
    abi: ConsentAudit.interface.formatJson()
  };

  // Write to deployment file
  const fs = require("fs");
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = `${deploymentsDir}/${network.name}-${chainId}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentFile}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Update your frontend with contract address: ${address}`);
  console.log(`   2. Configure your environment variables`);
  console.log(`   3. Test the contract functionality`);
  console.log(`   4. Grant initial consents if needed`);
}

// Handle errors
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
}); 