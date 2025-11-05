# blockchain-supply-tracker

A lightweight, modular Solidity example that demonstrates a role-protected supply-chain registry. The project uses an ERC-721 token to represent physical products, an on-chain provenance log, and a small controller that wires the pieces together. The code is intended for learning, demos, and as a starting point for a more complete system.

---

# Project layout

```
contracts/
  ├─ AccessControlManager.sol     # role management (manufacturer / distributor / retailer / regulator)
  ├─ ProductRegistry.sol          # ERC-721 product registry (ERC721URIStorage) with IPFS CID + status
  ├─ ProvenanceTracker.sol        # per-token history events (who, action, ipfsCid, timestamp)
  └─ SupplyChainController.sol    # convenience controller that coordinates registry + provenance
scripts/
  └─ deploy.js                    # deployment script (examples below)
test/
  └─ (Mocha/Chai tests)
hardhat.config.js
package.json
README.md
```

All contracts use `pragma solidity ^0.8.19` and import OpenZeppelin contracts.

---

# Goals

* Provide a minimal, modular architecture for tracking product provenance on-chain.
* Demonstrate role-based access (AccessControl), a tokenized product registry (ERC-721), and an append-only provenance store.
* Show how to wire contracts together cleanly so different developers can own separate modules.

---

# Prerequisites

* Node.js (18.x or newer recommended) and npm.
* Git (optional).
* Recommended: Hardhat toolchain for local development and tests.

---

# Quick start — Hardhat (cross-platform)

1. Clone or open the repo and change into the project directory.

```bash
git clone <repo-url>
cd blockchain-supply-tracker
```

2. Initialize the project and install dev dependencies:

```bash
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

3. Create a minimal `hardhat.config.js` (project root) — set the Solidity compiler to 0.8.19:

```js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
};
```

4. Compile:

```bash
npx hardhat compile
```

If compilation succeeds, artifacts will appear in `artifacts/`.

---

# Deploy locally (example)

Start a local Hardhat node:

```bash
npx hardhat node
```

Deploy the contracts to the local network (new terminal):

```bash
npx hardhat run --network localhost scripts/deploy.js
```

---

# Example `scripts/deploy.js`

Place this in `scripts/deploy.js`. It deploys contracts in the correct order and prints addresses.

```js
// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1) AccessControlManager
  const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
  const access = await AccessControlManager.deploy(deployer.address);
  await access.deployed();
  console.log("AccessControlManager:", access.address);

  // 2) ProductRegistry (pass access control address)
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const registry = await ProductRegistry.deploy(access.address);
  await registry.deployed();
  console.log("ProductRegistry:", registry.address);

  // 3) ProvenanceTracker (pass access control address)
  const ProvenanceTracker = await ethers.getContractFactory("ProvenanceTracker");
  const provenance = await ProvenanceTracker.deploy(access.address);
  await provenance.deployed();
  console.log("ProvenanceTracker:", provenance.address);

  // 4) (optional) SupplyChainController (pass addresses)
  const SupplyChainController = await ethers.getContractFactory("SupplyChainController");
  const controller = await SupplyChainController.deploy(access.address, registry.address, provenance.address);
  await controller.deployed();
  console.log("SupplyChainController:", controller.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

# Typical development flow

* Deploy `AccessControlManager` first — it is the canonical source of role data.
* Deploy `ProductRegistry` and `ProvenanceTracker` next, each receiving the `AccessControlManager` address in their constructor.
* Optionally deploy `SupplyChainController` which orchestrates registry + provenance in a single call for convenient frontend integration.
* Use the admin account (the address passed to `AccessControlManager` during deployment) to grant manufacturer/distributor/retailer/regulator roles.

---

# Testing suggestions

Create simple Mocha/Chai tests that cover:

* Role assignment: admin grants/revokes roles.
* Mint flow: manufacturer registers a product (token minted, tokenURI and ipfsCid set).
* Provenance logging: adding and reading history events.
* Transfer flow: owner transfers token, provenance records a transfer.
* Access control: ensure unauthorized callers are rejected.

Example test path: `test/product-registration.js`.

---

# Notes / troubleshooting

* If compilation fails with missing OpenZeppelin imports, ensure `@openzeppelin/contracts` is installed and `node_modules` is in the project root.
* Ensure `hardhat.config.js` solidity version satisfies `^0.8.19`.
* Contract addresses and ABI files are available in `artifacts/` after successful compilation.
* For quick experiments, paste contracts into Remix and use the Solidity compiler version `0.8.19`.

---

# Design notes

* The project uses a modular pattern: `AccessControlManager` is the single source of truth for roles; `ProductRegistry` owns tokens and metadata; `ProvenanceTracker` stores the history; `SupplyChainController` glues them together. This separation helps parallel development and simplifies audits.
* IPFS CIDs are stored as strings on-chain and used as an integrity anchor for off-chain documents (manifests, certificates). For private documents, encrypt before uploading to IPFS and store the encrypted CID on-chain.
* Recording every small event on-chain is auditable but can be costly. Consider batching or anchoring off-chain logs (Merkle roots) for high-volume production systems.

---

# Alternatives & next steps

* If the team prefers not to mint ERC-721 tokens, replace `ProductRegistry` with a numeric ID registry and keep `ProvenanceTracker` unchanged.
* Add an indexer (The Graph) or off-chain listener to index events for an easy frontend UI.
* Add unit & integration tests and a CI action that runs `npx hardhat compile` and tests on push.

---

# License

Contracts include an SPDX header `MIT`. Add a `LICENSE` file in the repo root if you want a project-level license file.

---

# Contact / contribution

Open a PR with feature changes or bugfixes. Use the issue tracker to report bugs or request features.

---
