# Blockchain Supply Chain Tracker

A decentralized application (dApp) for tracking product provenance using Ethereum smart contracts. Products are tokenized as ERC-721 NFTs with role-based access control and immutable audit trails.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - Check with `node -v`
- **MetaMask** browser extension - [Download here](https://metamask.io/download/)

---

## Quick Start (TL;DR)

```bash
# Terminal 1: Start blockchain
cd blockchain-supply-tracker
npm install
npm run compile
npm run node

# Terminal 2: Deploy contracts
npm run deploy:local

# Terminal 3: Start frontend
cd frontend
npm install
npm run dev
```

Then configure MetaMask (see Step 6 below) and open http://localhost:3000

---

## Step-by-Step Setup Guide

### Step 1: Install Backend Dependencies

Open a terminal and navigate to the project folder:

```bash
cd "/Users/vihaanphal/Desktop/Blockchain app/blockchain-supply-tracker"
npm install
```

This installs Hardhat, OpenZeppelin contracts, and other dependencies.

---

### Step 2: Compile Smart Contracts

```bash
npm run compile
```

You should see: `Compiled 21 Solidity files successfully`

---

### Step 3: Run Tests (Optional)

Verify everything works:

```bash
npm run test
```

All 3 tests should pass.

---

### Step 4: Start the Local Blockchain

```bash
npm run node
```

**Keep this terminal running!** It will display:
- Server running at `http://127.0.0.1:8545`
- 20 test accounts, each with 10,000 ETH

**Important:** Save Account #0's private key for MetaMask:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

### Step 5: Deploy Contracts

Open a **new terminal** (keep the blockchain running):

```bash
cd "/Users/vihaanphal/Desktop/Blockchain app/blockchain-supply-tracker"
npm run deploy:local
```

You'll see output like:
```
Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
AccessControlManager: 0x5FbDB2315678afecb367f032d93F642f64180aa3
ProductRegistry: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
ProvenanceTracker: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
SupplyChainController: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

**Save these addresses!** You'll need them for the frontend.

---

### Step 6: Configure MetaMask (Test Wallet Setup)

#### 6.1 Add Hardhat Network to MetaMask

1. Open MetaMask in your browser
2. Click the network dropdown (top left, usually says "Ethereum Mainnet")
3. Click **"Add network"** > **"Add a network manually"**
4. Enter these details:

| Field | Value |
|-------|-------|
| Network Name | `Hardhat Local` |
| New RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |
| Block Explorer URL | *(leave empty)* |

5. Click **Save**

#### 6.2 Import Test Account (with 10,000 ETH)

1. In MetaMask, click the account icon (top right)
2. Click **"Add account or hardware wallet"**
3. Select **"Import account"**
4. Paste this private key:

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

5. Click **Import**

You now have a test wallet with 10,000 ETH!

#### 6.3 Switch to Hardhat Network

Make sure MetaMask is connected to "Hardhat Local" network (not Ethereum Mainnet).

---

### Step 7: Configure Frontend Environment

Create the environment file for the frontend:

```bash
cd frontend
```

Create a file named `.env.local` with this content:

```env
NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_PRODUCT_REGISTRY_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_PROVENANCE_TRACKER_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_SUPPLY_CHAIN_CONTROLLER_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
NEXT_PUBLIC_CHAIN_ID=31337
```

**Note:** If your contract addresses are different (from Step 5), use those instead.

---

### Step 8: Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

### Step 9: Start the Frontend

```bash
npm run dev
```

You should see:
```
▲ Next.js 16.0.3
- Local: http://localhost:3000
```

---

### Step 10: Use the Application

1. Open http://localhost:3000 in your browser
2. Click **"Connect Wallet"**
3. MetaMask will pop up - click **Connect**
4. You're ready to use the app!

**Available Features:**
- Register new products (mint NFTs)
- Update product status (RAW → PACKED → IN_TRANSIT → DELIVERED)
- View product information
- View provenance history (immutable audit trail)

---

## Restarting the App (After Closing)

Every time you want to run the app again:

### Terminal 1: Start Blockchain
```bash
cd "/Users/vihaanphal/Desktop/Blockchain app/blockchain-supply-tracker"
npm run node
```

### Terminal 2: Deploy Contracts
```bash
cd "/Users/vihaanphal/Desktop/Blockchain app/blockchain-supply-tracker"
npm run deploy:local
```

**Important:** Update `frontend/.env.local` if contract addresses changed.

### Terminal 3: Start Frontend
```bash
cd "/Users/vihaanphal/Desktop/Blockchain app/blockchain-supply-tracker/frontend"
npm run dev
```

### MetaMask
1. Make sure you're on "Hardhat Local" network
2. If you see "nonce" errors, reset your account:
   - MetaMask > Settings > Advanced > Clear activity tab data

---

## Test Accounts (All Have 10,000 ETH)

| Account | Address | Private Key |
|---------|---------|-------------|
| #0 (Admin) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| #3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| #4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

**Warning:** These are PUBLIC test keys. Never send real ETH to these addresses!

---

## Available Commands

### Backend (Smart Contracts)
```bash
npm run compile      # Compile Solidity contracts
npm run test         # Run unit tests
npm run node         # Start local blockchain
npm run deploy:local # Deploy to local blockchain
npm run clean        # Clean build artifacts
```

### Frontend
```bash
cd frontend
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
```

---

## Troubleshooting

### "Nonce too high" error in MetaMask
1. Go to MetaMask > Settings > Advanced
2. Click "Clear activity tab data"
3. Try the transaction again

### "Could not connect to network"
- Make sure `npm run node` is running in a terminal
- Check MetaMask is set to "Hardhat Local" network
- Verify RPC URL is `http://127.0.0.1:8545`

### Contract addresses don't match
- Restart the blockchain: stop `npm run node` and start it again
- Redeploy: run `npm run deploy:local`
- Update `frontend/.env.local` with new addresses
- Restart frontend: stop and run `npm run dev` again

### "User rejected the request"
- Make sure to click "Confirm" in MetaMask when prompted

### Frontend shows wrong data
- Clear browser cache or open in incognito mode
- Reset MetaMask activity data (see above)

---

## Project Structure

```
blockchain-supply-tracker/
├── contracts/                    # Solidity smart contracts
│   ├── AccessControlManager.sol  # Role management
│   ├── ProductRegistry.sol       # ERC-721 product tokens
│   ├── ProvenanceTracker.sol     # Audit trail history
│   └── SupplyChainController.sol # Orchestration layer
├── scripts/
│   └── deploy.js                 # Deployment script
├── test/
│   └── supply-chain-flow.js      # Unit tests
├── frontend/                     # Next.js web application
│   ├── src/app/
│   │   └── page.js               # Main dApp interface
│   ├── .env.local                # Contract addresses (create this)
│   └── package.json
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Backend dependencies
└── README.md                     # This file
```

---

## Smart Contract Roles

| Role | Can Do |
|------|--------|
| **Admin** | Grant/revoke all roles |
| **Manufacturer** | Register new products |
| **Distributor** | Update status, transfer products |
| **Retailer** | Update status, transfer products |
| **Regulator** | View all data (read-only access) |

The deployer account (#0) is automatically granted admin + manufacturer roles.

---

## License

MIT
