const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Blockchain Supply Tracker", function () {
  async function deployFixture() {
    const [
      admin,
      manufacturer,
      distributor,
      retailer,
      regulator,
      outsider
    ] = await ethers.getSigners();

    const Access = await ethers.getContractFactory("AccessControlManager");
    const access = await Access.deploy(admin.address);
    await access.waitForDeployment();
    const accessAddress = await access.getAddress();

    await access.grantManufacturer(manufacturer.address);
    await access.grantDistributor(distributor.address);
    await access.grantRetailer(retailer.address);
    await access.grantRegulator(regulator.address);

    const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
    const registry = await ProductRegistry.deploy(accessAddress);
    await registry.waitForDeployment();

    const ProvenanceTracker = await ethers.getContractFactory("ProvenanceTracker");
    const provenance = await ProvenanceTracker.deploy(accessAddress);
    await provenance.waitForDeployment();

    const SupplyChainController = await ethers.getContractFactory("SupplyChainController");
    const controller = await SupplyChainController.deploy(
      accessAddress,
      await registry.getAddress(),
      await provenance.getAddress()
    );
    await controller.waitForDeployment();

    await access.grantManufacturer(await controller.getAddress());

    return {
      accounts: {
        admin,
        manufacturer,
        distributor,
        retailer,
        regulator,
        outsider
      },
      access,
      registry,
      provenance,
      controller
    };
  }

  it("allows only manufacturers to register products", async function () {
    const { registry, accounts } = await loadFixture(deployFixture);
    const tokenURI = "ipfs://token-1-metadata";
    const productCid = "bafy-manifest-1";

    await expect(
      registry
        .connect(accounts.outsider)
        .registerProduct(accounts.outsider.address, productCid, tokenURI, "RAW")
    ).to.be.revertedWith("Not manufacturer");

    await registry
      .connect(accounts.manufacturer)
      .registerProduct(accounts.manufacturer.address, productCid, tokenURI, "RAW");

    expect(await registry.ownerOf(1)).to.equal(accounts.manufacturer.address);
    expect(await registry.tokenURI(1)).to.equal(tokenURI);
    expect(await registry.ipfsCids(1)).to.equal(productCid);
    expect(await registry.status(1)).to.equal("RAW");
  });

  it("allows any supply-role account to update status and provenance", async function () {
    const { registry, provenance, accounts } = await loadFixture(deployFixture);

    await registry
      .connect(accounts.manufacturer)
      .registerProduct(accounts.manufacturer.address, "cid-1", "ipfs://token-1", "RAW");

    await expect(registry.connect(accounts.outsider).updateStatus(1, "SHIPPED")).to.be.revertedWith(
      "Not authorized"
    );

    await registry.connect(accounts.distributor).updateStatus(1, "IN_TRANSIT");
    expect(await registry.status(1)).to.equal("IN_TRANSIT");

    await expect(
      provenance.connect(accounts.outsider).addEvent(1, "INSPECTED", "cid-inspection")
    ).to.be.revertedWith("Not authorized");

    await provenance
      .connect(accounts.retailer)
      .addEvent(1, "INSPECTED", "cid-inspection");

    const [by, action, cid] = await provenance.getHistoryEntry(1, 0);
    expect(by).to.equal(accounts.retailer.address);
    expect(action).to.equal("INSPECTED");
    expect(cid).to.equal("cid-inspection");
  });

  it("runs the controller convenience flow", async function () {
    const { controller, registry, provenance, accounts, access } = await loadFixture(deployFixture);

    await access.grantManufacturer(accounts.manufacturer.address);
    await controller
      .connect(accounts.manufacturer)
      .registerAndLog(accounts.manufacturer.address, "cid-controller", "ipfs://controller", "CREATED");

    expect(await registry.ownerOf(1)).to.equal(accounts.manufacturer.address);
    expect(await provenance.getHistoryCount(1)).to.equal(1);
    const [, action] = await provenance.getHistoryEntry(1, 0);
    expect(action).to.equal("CREATED");
  });
});
