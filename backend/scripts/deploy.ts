import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🚀 Starting GreenToken Smart Contract Deployment...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📍 Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH\n");

    if (balance === 0n) {
        console.error("❌ Error: Deployer has no ETH. Get test ETH from a faucet:");
        console.error("   Sepolia: https://sepoliafaucet.com/");
        console.error("   Mumbai: https://faucet.polygon.technology/");
        process.exit(1);
    }

    // ========================================
    // 1. Deploy BlueCarbonCredit (ERC20 Token)
    // ========================================
    console.log("📦 Deploying BlueCarbonCredit...");
    const BlueCarbonCredit = await ethers.getContractFactory("BlueCarbonCredit");
    const carbonCredit = await BlueCarbonCredit.deploy();
    await carbonCredit.waitForDeployment();
    const carbonCreditAddress = await carbonCredit.getAddress();
    console.log("✅ BlueCarbonCredit deployed to:", carbonCreditAddress);

    // ========================================
    // 2. Deploy SoulboundToken (ERC721 NFT)
    // ========================================
    console.log("\n📦 Deploying SoulboundToken...");
    const SoulboundToken = await ethers.getContractFactory("SoulboundToken");
    const soulbound = await SoulboundToken.deploy();
    await soulbound.waitForDeployment();
    const soulboundAddress = await soulbound.getAddress();
    console.log("✅ SoulboundToken deployed to:", soulboundAddress);

    // ========================================
    // 3. Deploy ProjectRegistry (links to BlueCarbonCredit)
    // ========================================
    console.log("\n📦 Deploying ProjectRegistry...");
    const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
    const registry = await ProjectRegistry.deploy(carbonCreditAddress);
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("✅ ProjectRegistry deployed to:", registryAddress);

    // ========================================
    // 4. Grant MINTER_ROLE to ProjectRegistry
    // ========================================
    console.log("\n🔐 Granting MINTER_ROLE to ProjectRegistry...");
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await carbonCredit.grantRole(MINTER_ROLE, registryAddress);
    console.log("✅ ProjectRegistry can now mint carbon credits");

    // ========================================
    // Summary
    // ========================================
    console.log("\n" + "=".repeat(50));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(50));
    console.log("\nContract Addresses:");
    console.log(`  CARBON_CREDIT_TOKEN_ADDRESS=${carbonCreditAddress}`);
    console.log(`  SOULBOUND_TOKEN_ADDRESS=${soulboundAddress}`);
    console.log(`  PROJECT_REGISTRY_ADDRESS=${registryAddress}`);
    console.log("\n📝 Add these to your .env file!");

    // ========================================
    // Save addresses to a file
    // ========================================
    const deploymentInfo = {
        network: (await ethers.provider.getNetwork()).name,
        chainId: Number((await ethers.provider.getNetwork()).chainId),
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        contracts: {
            BlueCarbonCredit: carbonCreditAddress,
            SoulboundToken: soulboundAddress,
            ProjectRegistry: registryAddress,
        },
    };

    const outputPath = path.join(__dirname, "..", "deployment.json");
    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${outputPath}`);

    // ========================================
    // Generate .env snippet
    // ========================================
    const envSnippet = `
# Contract Addresses (Deployed ${new Date().toISOString()})
CARBON_CREDIT_TOKEN_ADDRESS=${carbonCreditAddress}
SOULBOUND_TOKEN_ADDRESS=${soulboundAddress}
PROJECT_REGISTRY_ADDRESS=${registryAddress}
`;

    const envPath = path.join(__dirname, "..", ".env.contracts");
    fs.writeFileSync(envPath, envSnippet.trim());
    console.log(`📄 Environment snippet saved to: ${envPath}`);
    console.log("\n🔑 Copy the above addresses to your .env file to complete setup!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
