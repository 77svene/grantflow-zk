const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 GrantFlow Deployment Starting...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const threshold = BigInt(0.01) * BigInt(1e18);
  if (balance < threshold) {
    console.error("❌ Insufficient balance for deployment");
    process.exit(1);
  }

  console.log("\n📦 Deploying ZKVerifier contract...");

  const ZKVerifier = await hre.ethers.getContractFactory("ZKVerifier");
  const verifier = await ZKVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("✅ ZKVerifier deployed to:", verifierAddress);

  console.log("\n🔍 Verifying on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: verifierAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on Etherscan");
  } catch (error) {
    if (error.message.includes("Already verified")) {
      console.log("⚠️ Contract already verified on Etherscan");
    } else {
      console.log("⚠️ Verification failed (may be rate limited):", error.message);
    }
  }

  console.log("\n💾 Saving addresses to .env...");
  
  const envPath = path.join(process.cwd(), ".env");
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  const envVars = {
    VERIFIER_ADDRESS: verifierAddress,
  };

  let newEnvContent = "";
  for (const [key, value] of Object.entries(envVars)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (envContent.match(regex)) {
      newEnvContent += `${key}=${value}\n`;
    } else {
      newEnvContent += `${key}=${value}\n`;
    }
  }

  const existingLines = envContent.split("\n").filter(line => !Object.keys(envVars).some(k => line.startsWith(k + "=")));
  newEnvContent += existingLines.join("\n");

  fs.writeFileSync(envPath, newEnvContent.trim() + "\n");
  console.log("✅ Addresses saved to .env");

  console.log("\n📊 Deployment Summary:");
  console.log("   ZKVerifier:", verifierAddress);
  console.log("\n✅ Deployment completed successfully!");
  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });