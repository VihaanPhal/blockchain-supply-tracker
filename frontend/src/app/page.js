'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import styles from "./page.module.css";

// ========== Contract ABIs ==========
const registryAbi = [
  "function registerProduct(address to, string ipfsCid, string tokenURI, string initialStatus) returns (uint256)",
  "function updateStatus(uint256 tokenId, string newStatus)",
  "function getProductInfo(uint256 tokenId) view returns (address, string, string, string)",
  "function status(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
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

// ========== SVG Icons ==========
const Icons = {
  Blockchain: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><rect x="9" y="16" width="6" height="6" rx="1"/><path d="M6 13l3 3M15 6l-3-3M18 13l-3 3M9 6l3-3"/>
    </svg>
  ),
  Wallet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  ),
  Package: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>
    </svg>
  ),
  Truck: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Factory: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  History: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>
    </svg>
  )
};

// ========== Toast Notification Component ==========
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const IconComponent = type === 'success' ? Icons.CheckCircle :
                        type === 'error' ? Icons.AlertCircle : Icons.Info;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <IconComponent />
      <span>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>
        <Icons.X />
      </button>
    </div>
  );
}

// ========== Status Badge Component ==========
function StatusBadge({ status }) {
  const statusLower = status?.toLowerCase() || '';
  let badgeClass = styles.badgeCreated;

  if (statusLower.includes('raw')) badgeClass = styles.badgeRaw;
  else if (statusLower.includes('packed')) badgeClass = styles.badgePacked;
  else if (statusLower.includes('transit')) badgeClass = styles.badgeInTransit;
  else if (statusLower.includes('delivered')) badgeClass = styles.badgeDelivered;

  return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
}

// ========== Main Component ==========
export default function Home() {
  const [account, setAccount] = useState("");
  const [toasts, setToasts] = useState([]);
  const [productInfo, setProductInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [activeTab, setActiveTab] = useState('register');
  const [loading, setLoading] = useState({});
  const [currentStatus, setCurrentStatus] = useState('');

  // Form refs
  const registerFormRef = useRef(null);
  const controllerFormRef = useRef(null);
  const statusFormRef = useRef(null);
  const eventFormRef = useRef(null);
  const lookupFormRef = useRef(null);

  const ready = useMemo(() => Boolean(signer && addresses.registry), [signer]);

  // Toast management
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Wallet connection
  const ensureWallet = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is required. Please install it first.");
    }
    const nextProvider = new ethers.BrowserProvider(window.ethereum);
    const network = await nextProvider.getNetwork();
    if (expectedChainId && Number(network.chainId) !== expectedChainId) {
      addToast(`Wrong network! Please switch to Chain ID ${expectedChainId}`, 'warning');
    }
    const nextSigner = await nextProvider.getSigner();
    setProvider(nextProvider);
    setSigner(nextSigner);
    setAccount(await nextSigner.getAddress());
    return { nextProvider, nextSigner };
  };

  const connectWallet = async () => {
    try {
      setLoading(prev => ({ ...prev, wallet: true }));
      await ensureWallet();
      addToast("Wallet connected successfully!", 'success');
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
  };

  // Contract getters
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

  // Helper to extract token ID from receipt
  const getTokenIdFromReceipt = (receipt, contractAddress) => {
    const iface = new ethers.Interface(registryAbi);
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
        try {
          const parsed = iface.parseLog({ topics: log.topics, data: log.data });
          if (parsed && parsed.name === 'Transfer') {
            return parsed.args.tokenId.toString();
          }
        } catch (e) {
          // Not a Transfer event, continue
        }
      }
    }
    return null;
  };

  // Form handlers
  const handleRegister = async (event) => {
    event.preventDefault();
    const form = registerFormRef.current;
    const data = new FormData(form);

    try {
      setLoading(prev => ({ ...prev, register: true }));
      const registry = getRegistry();
      const tx = await registry.registerProduct(
        data.get("to"),
        data.get("cid"),
        data.get("tokenURI"),
        data.get("initialStatus")
      );
      addToast("Transaction submitted. Waiting for confirmation...", 'info');
      const receipt = await tx.wait();
      const tokenId = getTokenIdFromReceipt(receipt, addresses.registry);
      addToast(`Product registered successfully! Token ID: #${tokenId}`, 'success');
      form.reset();
      setCurrentStatus(data.get("initialStatus"));
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, register: false }));
    }
  };

  const handleControllerFlow = async (event) => {
    event.preventDefault();
    const form = controllerFormRef.current;
    const data = new FormData(form);

    try {
      setLoading(prev => ({ ...prev, controller: true }));
      const controller = getController();
      const tx = await controller.registerAndLog(
        data.get("controllerTo"),
        data.get("controllerCid"),
        data.get("controllerUri"),
        data.get("controllerStatus")
      );
      addToast("Controller flow submitted...", 'info');
      const receipt = await tx.wait();
      const tokenId = getTokenIdFromReceipt(receipt, addresses.registry);
      addToast(`Product registered with provenance! Token ID: #${tokenId}`, 'success');
      form.reset();
      setCurrentStatus(data.get("controllerStatus"));
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, controller: false }));
    }
  };

  const handleUpdateStatus = async (event) => {
    event.preventDefault();
    const form = statusFormRef.current;
    const data = new FormData(form);

    try {
      setLoading(prev => ({ ...prev, status: true }));
      const registry = getRegistry();
      const tx = await registry.updateStatus(data.get("statusTokenId"), data.get("newStatus"));
      addToast("Updating status...", 'info');
      await tx.wait();
      addToast("Status updated successfully!", 'success');
      setCurrentStatus(data.get("newStatus"));
      form.reset();
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, status: false }));
    }
  };

  const handleAddEvent = async (event) => {
    event.preventDefault();
    const form = eventFormRef.current;
    const data = new FormData(form);

    try {
      setLoading(prev => ({ ...prev, event: true }));
      const provenance = getProvenance();
      const tx = await provenance.addEvent(
        data.get("eventTokenId"),
        data.get("action"),
        data.get("eventCid")
      );
      addToast("Adding provenance entry...", 'info');
      await tx.wait();
      addToast("Provenance entry saved!", 'success');
      form.reset();
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, event: false }));
    }
  };

  const handleLookup = async (event) => {
    event.preventDefault();
    const tokenId = new FormData(lookupFormRef.current).get("lookupTokenId");

    try {
      setLoading(prev => ({ ...prev, lookup: true }));
      const registry = getRegistry(true);
      const info = await registry.getProductInfo(tokenId);
      setProductInfo({
        owner: info[0],
        tokenURI: info[1],
        cid: info[2],
        status: info[3]
      });
      setCurrentStatus(info[3]);

      const provenance = getProvenance(true);
      const count = Number(await provenance.getHistoryCount(tokenId));
      const events = [];
      for (let i = 0; i < count; i++) {
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
      addToast(`Found product #${tokenId} with ${count} history entries`, 'success');
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
      setProductInfo(null);
      setHistory([]);
    } finally {
      setLoading(prev => ({ ...prev, lookup: false }));
    }
  };

  // Get status step for visual
  const getStatusStep = () => {
    const s = currentStatus?.toLowerCase() || '';
    if (s.includes('delivered')) return 4;
    if (s.includes('transit')) return 3;
    if (s.includes('packed')) return 2;
    if (s.includes('raw') || s.includes('created')) return 1;
    return 0;
  };

  return (
    <div className={styles.page}>
      {/* Toast Notifications */}
      <div className={styles.statusContainer}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <main className={styles.main}>
        {/* Header with Wallet */}
        <header className={styles.header}>
          <button
            className={`${styles.walletBtn} ${account ? styles.connected : ''}`}
            onClick={connectWallet}
            disabled={loading.wallet}
          >
            {loading.wallet ? (
              <div className={styles.spinner} />
            ) : (
              <Icons.Wallet />
            )}
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
          </button>
        </header>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroIcon}>
            <Icons.Blockchain />
          </div>
          <h1>Supply Chain Tracker</h1>
          <p>Track product provenance on the blockchain with immutable records and complete transparency</p>
        </section>

        {/* Supply Chain Flow Visual */}
        <div className={styles.supplyChainFlow}>
          <div className={`${styles.flowStep} ${getStatusStep() >= 1 ? styles.active : ''}`}>
            <div className={styles.flowIcon}><Icons.Factory /></div>
            <span className={styles.flowLabel}>Raw</span>
          </div>
          <span className={styles.flowArrow}><Icons.ArrowRight /></span>
          <div className={`${styles.flowStep} ${getStatusStep() >= 2 ? styles.active : ''}`}>
            <div className={styles.flowIcon}><Icons.Package /></div>
            <span className={styles.flowLabel}>Packed</span>
          </div>
          <span className={styles.flowArrow}><Icons.ArrowRight /></span>
          <div className={`${styles.flowStep} ${getStatusStep() >= 3 ? styles.active : ''}`}>
            <div className={styles.flowIcon}><Icons.Truck /></div>
            <span className={styles.flowLabel}>In Transit</span>
          </div>
          <span className={styles.flowArrow}><Icons.ArrowRight /></span>
          <div className={`${styles.flowStep} ${getStatusStep() >= 4 ? styles.active : ''}`}>
            <div className={styles.flowIcon}><Icons.CheckCircle /></div>
            <span className={styles.flowLabel}>Delivered</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'register' ? styles.active : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <Icons.Plus /> Register
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'track' ? styles.active : ''}`}
            onClick={() => setActiveTab('track')}
          >
            <Icons.RefreshCw /> Update
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'lookup' ? styles.active : ''}`}
            onClick={() => setActiveTab('lookup')}
          >
            <Icons.Search /> Lookup
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Register Tab */}
          {activeTab === 'register' && (
            <section className={styles.grid}>
              <form ref={registerFormRef} className={styles.card} onSubmit={handleRegister}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.blue}`}>
                    <Icons.Package />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Register Product</h2>
                    <p className={styles.cardDesc}>Mint a new product as an NFT</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Recipient Address</label>
                  <input
                    className={styles.input}
                    name="to"
                    placeholder="0x..."
                    defaultValue={account}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>IPFS CID</label>
                  <input
                    className={styles.input}
                    name="cid"
                    placeholder="bafy..."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Token URI</label>
                  <input
                    className={styles.input}
                    name="tokenURI"
                    placeholder="ipfs://..."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Initial Status</label>
                  <select className={styles.select} name="initialStatus" required>
                    <option value="RAW">RAW - Just manufactured</option>
                    <option value="PACKED">PACKED - Ready for shipping</option>
                    <option value="IN_TRANSIT">IN_TRANSIT - On the way</option>
                    <option value="DELIVERED">DELIVERED - Received</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={!ready || loading.register}
                >
                  {loading.register ? <div className={styles.spinner} /> : <Icons.Plus />}
                  {loading.register ? 'Minting...' : 'Mint Product NFT'}
                </button>
              </form>

              <form ref={controllerFormRef} className={styles.card} onSubmit={handleControllerFlow}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.purple}`}>
                    <Icons.Zap />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Quick Register</h2>
                    <p className={styles.cardDesc}>Mint + add provenance in one transaction</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Recipient Address</label>
                  <input
                    className={styles.input}
                    name="controllerTo"
                    placeholder="0x..."
                    defaultValue={account}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>IPFS CID</label>
                  <input
                    className={styles.input}
                    name="controllerCid"
                    placeholder="bafy..."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Token URI</label>
                  <input
                    className={styles.input}
                    name="controllerUri"
                    placeholder="ipfs://..."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Initial Status</label>
                  <select className={styles.select} name="controllerStatus" required>
                    <option value="CREATED">CREATED - New product</option>
                    <option value="RAW">RAW - Just manufactured</option>
                    <option value="PACKED">PACKED - Ready for shipping</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnSuccess}`}
                  disabled={!ready || !addresses.controller || loading.controller}
                >
                  {loading.controller ? <div className={styles.spinner} /> : <Icons.Zap />}
                  {loading.controller ? 'Processing...' : 'Quick Register'}
                </button>
              </form>
            </section>
          )}

          {/* Track/Update Tab */}
          {activeTab === 'track' && (
            <section className={styles.grid}>
              <form ref={statusFormRef} className={styles.card} onSubmit={handleUpdateStatus}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.orange}`}>
                    <Icons.RefreshCw />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Update Status</h2>
                    <p className={styles.cardDesc}>Change product status in the supply chain</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Token ID</label>
                  <input
                    className={styles.input}
                    name="statusTokenId"
                    type="number"
                    min="1"
                    placeholder="Enter token ID"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>New Status</label>
                  <select className={styles.select} name="newStatus" required>
                    <option value="RAW">RAW - Just manufactured</option>
                    <option value="PACKED">PACKED - Ready for shipping</option>
                    <option value="IN_TRANSIT">IN_TRANSIT - On the way</option>
                    <option value="DELIVERED">DELIVERED - Received</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={!ready || loading.status}
                >
                  {loading.status ? <div className={styles.spinner} /> : <Icons.RefreshCw />}
                  {loading.status ? 'Updating...' : 'Update Status'}
                </button>
              </form>

              <form ref={eventFormRef} className={styles.card} onSubmit={handleAddEvent}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.green}`}>
                    <Icons.FileText />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Add Provenance Event</h2>
                    <p className={styles.cardDesc}>Record an action in the audit trail</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Token ID</label>
                  <input
                    className={styles.input}
                    name="eventTokenId"
                    type="number"
                    min="1"
                    placeholder="Enter token ID"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Action</label>
                  <select className={styles.select} name="action" required>
                    <option value="INSPECTED">INSPECTED - Quality check</option>
                    <option value="SHIPPED">SHIPPED - Sent out</option>
                    <option value="RECEIVED">RECEIVED - Arrived</option>
                    <option value="STORED">STORED - In warehouse</option>
                    <option value="CERTIFIED">CERTIFIED - Verified authentic</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>IPFS CID (Document)</label>
                  <input
                    className={styles.input}
                    name="eventCid"
                    placeholder="bafy... (optional)"
                  />
                </div>

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnSuccess}`}
                  disabled={!ready || loading.event}
                >
                  {loading.event ? <div className={styles.spinner} /> : <Icons.Plus />}
                  {loading.event ? 'Adding...' : 'Add Event'}
                </button>
              </form>
            </section>
          )}

          {/* Lookup Tab */}
          {activeTab === 'lookup' && (
            <section className={styles.grid}>
              <form ref={lookupFormRef} className={styles.card} onSubmit={handleLookup}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.blue}`}>
                    <Icons.Search />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Lookup Product</h2>
                    <p className={styles.cardDesc}>View product details and history</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Token ID</label>
                  <input
                    className={styles.input}
                    name="lookupTokenId"
                    type="number"
                    min="1"
                    placeholder="Enter token ID to lookup"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={!provider || loading.lookup}
                >
                  {loading.lookup ? <div className={styles.spinner} /> : <Icons.Search />}
                  {loading.lookup ? 'Fetching...' : 'Fetch Product Data'}
                </button>

                {productInfo && (
                  <div className={styles.productInfo}>
                    <div className={styles.productInfoRow}>
                      <span className={styles.productInfoLabel}>Status</span>
                      <StatusBadge status={productInfo.status} />
                    </div>
                    <div className={styles.productInfoRow}>
                      <span className={styles.productInfoLabel}>Owner</span>
                      <span className={`${styles.productInfoValue} ${styles.address}`}>
                        {productInfo.owner}
                      </span>
                    </div>
                    <div className={styles.productInfoRow}>
                      <span className={styles.productInfoLabel}>Token URI</span>
                      <span className={styles.productInfoValue}>{productInfo.tokenURI}</span>
                    </div>
                    <div className={styles.productInfoRow}>
                      <span className={styles.productInfoLabel}>IPFS CID</span>
                      <span className={styles.productInfoValue}>{productInfo.cid}</span>
                    </div>
                  </div>
                )}
              </form>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIcon} ${styles.purple}`}>
                    <Icons.History />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Provenance History</h2>
                    <p className={styles.cardDesc}>Complete audit trail</p>
                  </div>
                </div>

                {history.length > 0 ? (
                  <div className={styles.timeline}>
                    {history.map((entry) => (
                      <div key={`${entry.index}-${entry.timestamp}`} className={styles.timelineItem}>
                        <div className={styles.timelineDot}>
                          <Icons.CheckCircle />
                        </div>
                        <div className={styles.timelineDate}>
                          {new Date(entry.timestamp * 1000).toLocaleString()}
                        </div>
                        <div className={styles.timelineAction}>{entry.action}</div>
                        <div className={styles.timelineDetails}>
                          <span className={styles.timelineAddress}>By: {entry.by.slice(0, 10)}...{entry.by.slice(-8)}</span>
                          {entry.cid && <span>CID: {entry.cid}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <Icons.History />
                    <p>No history yet. Lookup a product to see its provenance.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
