'use client';

import { useMemo, useState } from "react";
import { ethers } from "ethers";
import styles from "./page.module.css";

const registryAbi = [
  "function registerProduct(address to, string ipfsCid, string tokenURI, string initialStatus) returns (uint256)",
  "function updateStatus(uint256 tokenId, string newStatus)",
  "function getProductInfo(uint256 tokenId) view returns (address, string, string, string)",
  "function status(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)"
];

const provenanceAbi = [
  "function addEvent(uint256 tokenId, string action, string ipfsCid)",
  "function getHistoryCount(uint256 tokenId) view returns (uint256)",
  "function getHistoryEntry(uint256 tokenId, uint256 index) view returns (address,string,string,uint256)"
];

const controllerAbi = [
  "function registerAndLog(address to, string ipfsCid, string tokenURI, string initialStatus)"
];

const addresses = {
  registry: process.env.NEXT_PUBLIC_PRODUCT_REGISTRY_ADDRESS ?? "",
  provenance: process.env.NEXT_PUBLIC_PROVENANCE_TRACKER_ADDRESS ?? "",
  controller: process.env.NEXT_PUBLIC_SUPPLY_CHAIN_CONTROLLER_ADDRESS ?? ""
};

const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);

export default function Home() {
  const [account, setAccount] = useState("");
  const [chainWarning, setChainWarning] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [productInfo, setProductInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const ready = useMemo(() => Boolean(signer && addresses.registry), [signer]);

  const ensureWallet = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask (or another EIP-1193 wallet) is required.");
    }
    const nextProvider = new ethers.BrowserProvider(window.ethereum);
    const network = await nextProvider.getNetwork();
    if (expectedChainId && Number(network.chainId) !== expectedChainId) {
      setChainWarning(
        `Connected to chain ${network.chainId}. Switch to chain ID ${expectedChainId} (Hardhat local or Sepolia).`
      );
    } else {
      setChainWarning("");
    }
    const nextSigner = await nextProvider.getSigner();
    setProvider(nextProvider);
    setSigner(nextSigner);
    setAccount(await nextSigner.getAddress());
    return { nextProvider, nextSigner };
  };

  const connectWallet = async () => {
    try {
      await ensureWallet();
      setStatusMessage("Wallet connected.");
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const getRegistry = (readOnly = false) => {
    const runner = signer ?? (!readOnly ? null : provider);
    if (!runner) throw new Error("Connect wallet first.");
    if (!addresses.registry) throw new Error("ProductRegistry address missing.");
    return new ethers.Contract(addresses.registry, registryAbi, runner);
  };

  const getProvenance = (readOnly = false) => {
    const runner = signer ?? (!readOnly ? null : provider);
    if (!runner) throw new Error("Connect wallet first.");
    if (!addresses.provenance) throw new Error("ProvenanceTracker address missing.");
    return new ethers.Contract(addresses.provenance, provenanceAbi, runner);
  };

  const getController = () => {
    if (!signer) throw new Error("Connect wallet first.");
    return new ethers.Contract(addresses.controller, controllerAbi, signer);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const to = data.get("to");
    const ipfsCid = data.get("cid");
    const tokenURI = data.get("tokenURI");
    const initialStatus = data.get("initialStatus");

    try {
      const registry = getRegistry();
      const tx = await registry.registerProduct(to, ipfsCid, tokenURI, initialStatus);
      setStatusMessage("Submitting transaction...");
      const receipt = await tx.wait();
      setStatusMessage(`Product registered in tx ${receipt.hash}`);
      event.currentTarget.reset();
    } catch (error) {
      setStatusMessage(error.shortMessage || error.message);
    }
  };

  const handleControllerFlow = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const to = data.get("controllerTo");
    const cid = data.get("controllerCid");
    const uri = data.get("controllerUri");
    const initialStatus = data.get("controllerStatus");
    try {
      const controller = getController();
      const tx = await controller.registerAndLog(to, cid, uri, initialStatus);
      setStatusMessage("Controller flow submitted...");
      await tx.wait();
      setStatusMessage("Controller flow confirmed.");
      event.currentTarget.reset();
    } catch (error) {
      setStatusMessage(error.shortMessage || error.message);
    }
  };

  const handleUpdateStatus = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const tokenId = data.get("statusTokenId");
    const newStatus = data.get("newStatus");
    try {
      const registry = getRegistry();
      const tx = await registry.updateStatus(tokenId, newStatus);
      setStatusMessage("Updating status...");
      await tx.wait();
      setStatusMessage("Status updated.");
      event.currentTarget.reset();
    } catch (error) {
      setStatusMessage(error.shortMessage || error.message);
    }
  };

  const handleAddEvent = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const tokenId = data.get("eventTokenId");
    const action = data.get("action");
    const cid = data.get("eventCid");
    try {
      const provenance = getProvenance();
      const tx = await provenance.addEvent(tokenId, action, cid);
      setStatusMessage("Adding provenance entry...");
      await tx.wait();
      setStatusMessage("Provenance entry saved.");
      event.currentTarget.reset();
    } catch (error) {
      setStatusMessage(error.shortMessage || error.message);
    }
  };

  const handleLookup = async (event) => {
    event.preventDefault();
    const tokenId = new FormData(event.currentTarget).get("lookupTokenId");

    try {
      const registry = getRegistry(true);
      const info = await registry.getProductInfo(tokenId);
      setProductInfo({
        owner: info[0],
        tokenURI: info[1],
        cid: info[2],
        status: info[3]
      });

      const provenance = getProvenance(true);
      const count = Number(await provenance.getHistoryCount(tokenId));
      const events = [];
      for (let i = 0; i < count; i += 1) {
        const entry = await provenance.getHistoryEntry(tokenId, i);
        events.push({
          index: i,
          by: entry[0],
          action: entry[1],
          cid: entry[2],
          timestamp: Number(entry[3])
        });
      }
      setHistory(events);
    } catch (error) {
      setStatusMessage(error.shortMessage || error.message);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>Blockchain Supply Tracker</h1>
            <p>Interact with the deployed contracts from your browser.</p>
          </div>
          <button type="button" onClick={connectWallet}>
            {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
          </button>
        </header>

        {chainWarning && <p className={styles.warning}>{chainWarning}</p>}
        {statusMessage && <p className={styles.status}>{statusMessage}</p>}

        <section className={styles.grid}>
          <form className={styles.card} onSubmit={handleRegister}>
            <h2>Register Product</h2>
            <label>
              Recipient Address
              <input name="to" placeholder="0x..." defaultValue={account} required />
            </label>
            <label>
              IPFS CID
              <input name="cid" placeholder="bafy..." required />
            </label>
            <label>
              Token URI
              <input name="tokenURI" placeholder="ipfs://..." required />
            </label>
            <label>
              Initial Status
              <input name="initialStatus" placeholder="RAW / PACKED / IN_TRANSIT" required />
            </label>
            <button type="submit" disabled={!ready}>
              Mint Product NFT
            </button>
          </form>

          <form className={styles.card} onSubmit={handleControllerFlow}>
            <h2>Controller Flow</h2>
            <p className={styles.help}>
              Calls the SupplyChainController to mint + append an initial provenance entry in one go.
            </p>
            <label>
              Recipient Address
              <input name="controllerTo" placeholder="0x..." defaultValue={account} required />
            </label>
            <label>
              IPFS CID
              <input name="controllerCid" placeholder="bafy..." required />
            </label>
            <label>
              Token URI
              <input name="controllerUri" placeholder="ipfs://..." required />
            </label>
            <label>
              Initial Status
              <input name="controllerStatus" placeholder="CREATED" required />
            </label>
            <button type="submit" disabled={!ready || !addresses.controller}>
              Run Controller Flow
            </button>
          </form>

          <form className={styles.card} onSubmit={handleUpdateStatus}>
            <h2>Update Status</h2>
            <label>
              Token ID
              <input name="statusTokenId" type="number" min="1" required />
            </label>
            <label>
              New Status
              <input name="newStatus" placeholder="IN_TRANSIT / DELIVERED" required />
            </label>
            <button type="submit" disabled={!ready}>
              Update
            </button>
          </form>

          <form className={styles.card} onSubmit={handleAddEvent}>
            <h2>Add Provenance Event</h2>
            <label>
              Token ID
              <input name="eventTokenId" type="number" min="1" required />
            </label>
            <label>
              Action
              <input name="action" placeholder="INSPECTED / SHIPPED" required />
            </label>
            <label>
              IPFS CID
              <input name="eventCid" placeholder="bafy..." required />
            </label>
            <button type="submit" disabled={!ready}>
              Add Event
            </button>
          </form>

          <form className={styles.card} onSubmit={handleLookup}>
            <h2>Lookup Product</h2>
            <label>
              Token ID
              <input name="lookupTokenId" type="number" min="1" required />
            </label>
            <button type="submit" disabled={!provider}>
              Fetch Data
            </button>
            {productInfo && (
              <div className={styles.result}>
                <strong>Owner:</strong> {productInfo.owner}
                <strong>Status:</strong> {productInfo.status}
                <strong>Token URI:</strong> {productInfo.tokenURI}
                <strong>IPFS CID:</strong> {productInfo.cid}
              </div>
            )}
          </form>

          {history.length > 0 && (
            <div className={styles.card}>
              <h2>Provenance History</h2>
              <ul className={styles.history}>
                {history.map((entry) => (
                  <li key={`${entry.index}-${entry.timestamp}`}>
                    <span>{new Date(entry.timestamp * 1000).toLocaleString()}</span>
                    <span>{entry.action}</span>
                    <span>{entry.by}</span>
                    <span>{entry.cid}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
