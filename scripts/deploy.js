import hre from "hardhat";

async function main() {
  console.log("Starting deployment to Arc Testnet...");
  
  // Get the contract factories
  const ArcOneFactory = await hre.ethers.getContractFactory("ArcOneFactory");
  const ArcDexFactory = await hre.ethers.getContractFactory("ArcDexFactory");
  
  // Deploy ArcOneFactory
  console.log("Deploying ArcOneFactory...");
  const factory = await ArcOneFactory.deploy();
  
  // Wait for the deployment to finish
  let factoryAddress;
  if (factory.waitForDeployment) {
    await factory.waitForDeployment();
    factoryAddress = await factory.getAddress();
  } else {
    await factory.deployed();
    factoryAddress = factory.address;
  }
  console.log(`ArcOneFactory deployed successfully to: ${factoryAddress}`);

  // Deploy ArcDexFactory
  console.log("Deploying ArcDexFactory...");
  const dexFactory = await ArcDexFactory.deploy();
  
  let dexFactoryAddress;
  if (dexFactory.waitForDeployment) {
    await dexFactory.waitForDeployment();
    dexFactoryAddress = await dexFactory.getAddress();
  } else {
    await dexFactory.deployed();
    dexFactoryAddress = dexFactory.address;
  }
  console.log(`ArcDexFactory deployed successfully to: ${dexFactoryAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
