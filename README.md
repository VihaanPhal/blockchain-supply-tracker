# blockchain-supply-tracker

A simple supply-chain tracking example implemented in Solidity. The repository contains four smart contracts that demonstrate role-based access control, an ERC-721 product registry, provenance/history tracking, and a controller that wires the pieces together.

## Repository structure

- `contracts/`
	- `AccessControlManager.sol` - role management (manufacturer / distributor / retailer / regulator) built on OpenZeppelin `AccessControl`.
	- `ProductRegistry.sol` - ERC-721 token registry for products (uses `ERC721URIStorage`) with IPFS CIDs and status tracking.
	- `ProvenanceTracker.sol` - stores history events for each tokenId (who did what, when, and an IPFS CID).
	- `SupplyChainController.sol` - helper contract that coordinates registry and provenance when a product is registered.

All contracts use `pragma solidity ^0.8.19` and import `@openzeppelin/contracts`.

## Goals

- Show how to build a role-protected supply-chain registry using ERC-721 tokens.
- Demonstrate basic provenance logging and a controller to orchestrate actions.

## Prerequisites

- Node.js (recommended: 18.x or newer) and npm installed.
- Git (optional, for cloning).

If you prefer not to set up a local build, you can compile & test these contracts in Remix by copying the files into the Remix editor and selecting compiler `0.8.19`.

## Recommended local build (Hardhat) - Windows (cmd.exe)

The steps below create a minimal Hardhat environment, install OpenZeppelin, and compile the contracts.

1. Open a Windows command prompt and change into the repository root (note the path contains spaces; use quotes):

```cmd
cd "c:\Users\nikhi\Documents\College Stuff\CSE 540\codebase\blockchain-supply-tracker"
```

2. Initialize npm (creates `package.json`):

```cmd
npm init -y
```

3. Install Hardhat and the toolbox, and OpenZeppelin contracts:

```cmd
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

4. Create or edit `hardhat.config.js` to set the compiler to `0.8.19`.

You can use the interactive initializer:

```cmd
npx hardhat
```

Or create a minimal `hardhat.config.js` with the following content:

```js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
	solidity: "0.8.19",
};
```

5. Compile the contracts:

```cmd
npx hardhat compile
```

If compile succeeds, artifacts will be produced in `artifacts/` and `cache/`.

6. (Optional) Run a local Hardhat node and deploy locally:

```cmd
npx hardhat node

// In another terminal
npx hardhat run --network localhost scripts/deploy.js
```

I can scaffold a `scripts/deploy.js` file that deploys `AccessControlManager`, `ProductRegistry`, `ProvenanceTracker`, and `SupplyChainController` in the proper order if you'd like.

## Quick notes on compilation errors

- If the compiler complains about missing OpenZeppelin imports, ensure `node_modules/@openzeppelin/contracts` exists (installed in step 3).
- Ensure `hardhat.config.js` sets `solidity: "0.8.19"` or a compatible range that satisfies `^0.8.19`.

## Alternatives

- Remix: paste the contracts in the Remix IDE and select compiler 0.8.19 — fastest for quick experiments.
- Foundry (forge): if you prefer Foundry's toolchain I can provide `forge init` steps and tests instead.

## Next steps I can do for you

- Add a `hardhat.config.js` and `package.json` (I can create these files and run a compile locally).
- Add a `scripts/deploy.js` and a small test suite (Mocha/Chai) that covers: register product, transfer, update status, and provenance event creation.
- Add CI workflow to compile on push.

## License

This repository uses the SPDX header `MIT` in contracts; add a project-level `LICENSE` file if desired.

## Contact / Author

If you'd like me to add the deploy script and tests, tell me which network (local / testnet) to target and I will scaffold them.
