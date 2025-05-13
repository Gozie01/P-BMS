// scripts/deploy.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔨 Deploying BloodMatching contract to PureChain...");

  const BloodMatching = await hre.ethers.getContractFactory("BloodMatching");
  const blood = await BloodMatching.deploy();
  await blood.waitForDeployment(); // Use waitForDeployment for Ethers v6+ compatibility

  const address = await blood.getAddress();
  console.log("✅ BloodMatching contract deployed at:", address);

  // Optional: Write the deployed address to a file
  const deploymentInfo = {
    address: address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };

  const filePath = path.join(__dirname, "../deployment/purechain.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));

  console.log("📦 Deployment details saved to:", filePath);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
