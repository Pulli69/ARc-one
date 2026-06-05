import hre from "hardhat";

async function main() {
  console.log("Starting deployment to Arc Testnet...");
  
  // Get the contract factory
  const ArcOneFactory = await hre.ethers.getContractFactory("ArcOneFactory");
  
  // Deploy the contract
  console.log("Deploying ArcOneFactory...");
  const factory = await ArcOneFactory.deploy();
  
  // Wait for the deployment to finish
  // Using ethers v6 syntax (adjust to factory.deployed() and factory.address if ethers v5)
  if (factory.waitForDeployment) {
    await factory.waitForDeployment();
    console.log(`ArcOneFactory deployed successfully to: ${await factory.getAddress()}`);
  } else {
    await factory.deployed();
    console.log(`ArcOneFactory deployed successfully to: ${factory.address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
