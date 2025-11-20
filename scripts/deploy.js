const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const AccessControlManager = await hre.ethers.getContractFactory("AccessControlManager");
  const access = await AccessControlManager.deploy(deployer.address);
  await access.waitForDeployment();
  const accessAddress = await access.getAddress();
  console.log("AccessControlManager:", accessAddress);

  const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
  const registry = await ProductRegistry.deploy(accessAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("ProductRegistry:", registryAddress);

  const ProvenanceTracker = await hre.ethers.getContractFactory("ProvenanceTracker");
  const provenance = await ProvenanceTracker.deploy(accessAddress);
  await provenance.waitForDeployment();
  const provenanceAddress = await provenance.getAddress();
  console.log("ProvenanceTracker:", provenanceAddress);

  const SupplyChainController = await hre.ethers.getContractFactory("SupplyChainController");
  const controller = await SupplyChainController.deploy(
    accessAddress,
    registryAddress,
    provenanceAddress
  );
  await controller.waitForDeployment();
  const controllerAddress = await controller.getAddress();
  console.log("SupplyChainController:", controllerAddress);

  const roleInit = [
    access.grantManufacturer(deployer.address),
    access.grantDistributor(deployer.address),
    access.grantRetailer(deployer.address),
    access.grantRegulator(deployer.address),
    access.grantManufacturer(controllerAddress)
  ];

  for (const txPromise of roleInit) {
    const tx = await txPromise;
    await tx.wait();
  }

  console.log("Granted base roles to deployer and controller.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
