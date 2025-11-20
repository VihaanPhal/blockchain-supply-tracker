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

* Node.js 18+ (use [nvm](https://github.com/nvm-sh/nvm) for easy switching) and npm.
* Git for cloning the repo and collaborating.
* VS Code (recommended) with the Solidity and Hardhat extensions, or JetBrains Fleet/WebStorm if you prefer.
* MetaMask browser extension for wallet/key management on Sepolia and localhost.
* Optional: IPFS Desktop or a pinning service account (Pinata, web3.storage) for uploading manifests and documents.

---

# Environment setup

1. Install the tools above and ensure `node -v` reports 18.x or higher.
2. Clone/open the repo and install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`, then provide the Sepolia RPC URL, the deployer private key (without `0x`), and optionally an Etherscan key.
4. Install the frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
5. Duplicate `frontend/.env.local.example` into `frontend/.env.local` and paste the deployed contract addresses (either from `npm run deploy:local` or Sepolia).
6. Launch VS Code in the repo (`code .`) and enable the Solidity extension so it picks up the Hardhat project automatically.
7. Add a wallet (MetaMask is easiest) with some Sepolia ETH for live deployments. Use the same private key you placed in `.env`.

---

# Useful npm scripts

| Command | Description |
| --- | --- |
| `npm run compile` | Compile Solidity contracts with Hardhat. |
| `npm run test` | Run the Mocha/Chai unit tests. |
| `npm run node` | Start a local Hardhat JSON-RPC node. |
| `npm run deploy:local` | Deploy all contracts to the local Hardhat node. |
| `npm run deploy:sepolia` | Deploy to Sepolia using the credentials in `.env`. |

If this is your first Hardhat run on a machine, macOS may prompt for access so Hardhat can create `~/Library/Preferences/hardhat-nodejs`.

---

# Local development flow

1. `npm run node` – spins up a local chain and prints funded accounts.
2. In another terminal, `npm run deploy:local` – deploys contracts, grants the deployer/controller base roles, and prints addresses.
3. Run `npm run test` anytime to execute the included end-to-end flow tests in `test/supply-chain-flow.js`.
4. Upload product documents to IPFS (Desktop app or a pinning service) and store the returned CID via `registerProduct`.
5. Use Hardhat tasks, scripts, or the console (`npx hardhat console --network localhost`) to mint tokens, update status, and append provenance events.

---

# Deploying to Sepolia

1. Get a Sepolia RPC endpoint (Infura/Alchemy/etc.) and some Sepolia ETH in the deployer wallet.
2. Populate `.env`:
   ```
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<project-id>
   SEPOLIA_PRIVATE_KEY=<hex-without-0x>
   ETHERSCAN_API_KEY=<optional-for-verification>
   ```
3. `npm run deploy:sepolia` – the script deploys AccessControl → ProductRegistry → ProvenanceTracker → SupplyChainController, grants base roles to the deployer and controller, and prints contract addresses.
4. (Optional) Verify on Etherscan with `npx hardhat verify --network sepolia <address> <constructor args>`.

---

# Frontend dApp

1. In `frontend/.env.local`, fill in:
   ```
   NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS=<access control address>
   NEXT_PUBLIC_PRODUCT_REGISTRY_ADDRESS=<product registry address>
   NEXT_PUBLIC_PROVENANCE_TRACKER_ADDRESS=<provenance tracker address>
   NEXT_PUBLIC_SUPPLY_CHAIN_CONTROLLER_ADDRESS=<controller address>
   NEXT_PUBLIC_CHAIN_ID=11155111 # (use 31337 for local Hardhat)
   ```
2. Start the dev server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Visit `http://localhost:3000`, connect MetaMask (select the same chain as the backend), and use the forms to:
   * Mint/register products
   * Run the controller convenience flow
   * Update product status
   * Append provenance events
   * Query ownership/status + view the on-chain history

The UI uses `ethers.js` directly, so any updates to the ABIs require a fresh `npm run compile` (to regenerate artifacts) and a frontend restart.

---

# Frontend & storage suggestions

* Scaffold a Next.js dApp (`frontend/` already included) that consumes the artifacts and interacts through MetaMask.
* Persist large documents off-chain on IPFS (Pinata/web3.storage/Infura) and store only the CID plus hashes on-chain.
* For collaboration, schedule the weekly Google Meet syncs defined in the team contract and use GitHub Projects/Trello for task tracking.

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
=======
# blockchain-supply-tracker
