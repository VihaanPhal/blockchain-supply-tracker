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

// ========== Icons ==========
const Icons = {
  Cube: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Wallet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  ),
  Package: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>
    </svg>
  ),
  Truck: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Factory: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  )
};

// ========== Toast Component ==========
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = type === 'success' ? Icons.CheckCircle :
               type === 'error' ? Icons.AlertCircle : Icons.Info;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.toastIcon}><Icon /></span>
      <span className={styles.toastMessage}>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>
        <Icons.X />
      </button>
    </div>
  );
}

// ========== Status Badge ==========
function StatusBadge({ status }) {
  const s = status?.toLowerCase() || '';
  let cls = styles.badgeCreated;
  if (s.includes('raw')) cls = styles.badgeRaw;
  else if (s.includes('packed')) cls = styles.badgePacked;
  else if (s.includes('transit')) cls = styles.badgeInTransit;
  else if (s.includes('delivered')) cls = styles.badgeDelivered;
  return <span className={`${styles.badge} ${cls}`}>{status}</span>;
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

  const registerFormRef = useRef(null);
  const controllerFormRef = useRef(null);
  const statusFormRef = useRef(null);
  const eventFormRef = useRef(null);
  const lookupFormRef = useRef(null);

  const ready = useMemo(() => Boolean(signer && addresses.registry), [signer]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ensureWallet = async () => {
    if (!window.ethereum) throw new Error("MetaMask required");
    const p = new ethers.BrowserProvider(window.ethereum);
    const network = await p.getNetwork();
    if (expectedChainId && Number(network.chainId) !== expectedChainId) {
      addToast(`Switch to Chain ID ${expectedChainId}`, 'warning');
    }
    const s = await p.getSigner();
    setProvider(p);
    setSigner(s);
    setAccount(await s.getAddress());
    return { p, s };
  };

  const connectWallet = async () => {
    try {
      setLoading(prev => ({ ...prev, wallet: true }));
      await ensureWallet();
      addToast("Connected", 'success');
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
  };

  const getRegistry = (readOnly = false) => {
    const runner = signer ?? (!readOnly ? null : provider);
    if (!runner) throw new Error("Connect wallet first");
    return new ethers.Contract(addresses.registry, registryAbi, runner);
  };

  const getProvenance = (readOnly = false) => {
    const runner = signer ?? (!readOnly ? null : provider);
    if (!runner) throw new Error("Connect wallet first");
    return new ethers.Contract(addresses.provenance, provenanceAbi, runner);
  };

  const getController = () => {
    if (!signer) throw new Error("Connect wallet first");
    return new ethers.Contract(addresses.controller, controllerAbi, signer);
  };

  const getTokenIdFromReceipt = (receipt, contractAddress) => {
    const iface = new ethers.Interface(registryAbi);
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
        try {
          const parsed = iface.parseLog({ topics: log.topics, data: log.data });
          if (parsed?.name === 'Transfer') return parsed.args.tokenId.toString();
        } catch {}
      }
    }
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const form = registerFormRef.current;
    const data = new FormData(form);
    try {
      setLoading(prev => ({ ...prev, register: true }));
      const registry = getRegistry();
      const tx = await registry.registerProduct(
        data.get("to"), data.get("cid"), data.get("tokenURI"), data.get("initialStatus")
      );
      addToast("Confirming...", 'info');
      const receipt = await tx.wait();
      const tokenId = getTokenIdFromReceipt(receipt, addresses.registry);
      addToast(`Minted Token #${tokenId}`, 'success');
      form.reset();
      setCurrentStatus(data.get("initialStatus"));
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, register: false }));
    }
  };

  const handleControllerFlow = async (e) => {
    e.preventDefault();
    const form = controllerFormRef.current;
    const data = new FormData(form);
    try {
      setLoading(prev => ({ ...prev, controller: true }));
      const controller = getController();
      const tx = await controller.registerAndLog(
        data.get("controllerTo"), data.get("controllerCid"), data.get("controllerUri"), data.get("controllerStatus")
      );
      addToast("Confirming...", 'info');
      const receipt = await tx.wait();
      const tokenId = getTokenIdFromReceipt(receipt, addresses.registry);
      addToast(`Minted Token #${tokenId}`, 'success');
      form.reset();
      setCurrentStatus(data.get("controllerStatus"));
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, controller: false }));
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    const form = statusFormRef.current;
    const data = new FormData(form);
    try {
      setLoading(prev => ({ ...prev, status: true }));
      const registry = getRegistry();
      const tx = await registry.updateStatus(data.get("statusTokenId"), data.get("newStatus"));
      addToast("Updating...", 'info');
      await tx.wait();
      addToast("Status updated", 'success');
      setCurrentStatus(data.get("newStatus"));
      form.reset();
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, status: false }));
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    const form = eventFormRef.current;
    const data = new FormData(form);
    try {
      setLoading(prev => ({ ...prev, event: true }));
      const provenance = getProvenance();
      const tx = await provenance.addEvent(data.get("eventTokenId"), data.get("action"), data.get("eventCid"));
      addToast("Adding event...", 'info');
      await tx.wait();
      addToast("Event recorded", 'success');
      form.reset();
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, event: false }));
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    const tokenId = new FormData(lookupFormRef.current).get("lookupTokenId");
    try {
      setLoading(prev => ({ ...prev, lookup: true }));
      const registry = getRegistry(true);
      const info = await registry.getProductInfo(tokenId);
      setProductInfo({ owner: info[0], tokenURI: info[1], cid: info[2], status: info[3] });
      setCurrentStatus(info[3]);

      const provenance = getProvenance(true);
      const count = Number(await provenance.getHistoryCount(tokenId));
      const events = [];
      for (let i = 0; i < count; i++) {
        const entry = await provenance.getHistoryEntry(tokenId, i);
        events.push({ index: i, by: entry[0], action: entry[1], cid: entry[2], timestamp: Number(entry[3]) });
      }
      setHistory(events);
      addToast(`Found ${count} events`, 'success');
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
      setProductInfo(null);
      setHistory([]);
    } finally {
      setLoading(prev => ({ ...prev, lookup: false }));
    }
  };

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
      <div className={styles.statusContainer}>
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <Icons.Cube />
            <span>Supply Chain</span>
          </div>
          <button
            className={`${styles.walletBtn} ${account ? styles.connected : ''}`}
            onClick={connectWallet}
            disabled={loading.wallet}
          >
            {loading.wallet ? <div className={styles.spinner} /> : <Icons.Wallet />}
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect"}
          </button>
        </header>

        <section className={styles.hero}>
          <h1>Supply Chain Tracker</h1>
          <p>Track products on the blockchain with immutable provenance records</p>
        </section>

        <div className={styles.supplyChainFlow}>
          <div className={`${styles.flowStep} ${getStatusStep() >= 1 ? styles.active : ''}`}>
            <div className={styles.flowIcon}><Icons.Factory /></div>
            <span className={styles.flowLabel}>Raw</span>
          </div>
          <span className={styles.flowArrow}><Icons.ArrowRight /></span>
          <div className={`${styles.flowStep} ${getStatusStep() >= 2 ? styles.activeBlue : ''}`}>
            <div className={styles.flowIcon}><Icons.Package /></div>
            <span className={styles.flowLabel}>Packed</span>
          </div>
          <span className={styles.flowArrow}><Icons.ArrowRight /></span>
          <div className={`${styles.flowStep} ${getStatusStep() >= 3 ? styles.activeAmber : ''}`}>
            <div className={styles.flowIcon}><Icons.Truck /></div>
            <span className={styles.flowLabel}>Transit</span>
          </div>
          <span className={styles.flowArrow}><Icons.ArrowRight /></span>
          <div className={`${styles.flowStep} ${getStatusStep() >= 4 ? styles.activeGreen : ''}`}>
            <div className={styles.flowIcon}><Icons.Check /></div>
            <span className={styles.flowLabel}>Delivered</span>
          </div>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'register' ? styles.active : ''}`} onClick={() => setActiveTab('register')}>
            <Icons.Plus /> Register
          </button>
          <button className={`${styles.tab} ${activeTab === 'track' ? styles.active : ''}`} onClick={() => setActiveTab('track')}>
            <Icons.RefreshCw /> Update
          </button>
          <button className={`${styles.tab} ${activeTab === 'lookup' ? styles.active : ''}`} onClick={() => setActiveTab('lookup')}>
            <Icons.Search /> Lookup
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'register' && (
            <section className={styles.grid}>
              <form ref={registerFormRef} className={styles.card} onSubmit={handleRegister}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}><Icons.Package /></div>
                  <div>
                    <h2 className={styles.cardTitle}>Register Product</h2>
                    <p className={styles.cardDesc}>Mint a new product NFT</p>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Recipient</label>
                  <input className={styles.input} name="to" placeholder="0x..." defaultValue={account} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>IPFS CID</label>
                  <input className={styles.input} name="cid" placeholder="bafy..." required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Token URI</label>
                  <input className={styles.input} name="tokenURI" placeholder="ipfs://..." required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Initial Status</label>
                  <select className={styles.select} name="initialStatus" required>
                    <option value="RAW">RAW</option>
                    <option value="PACKED">PACKED</option>
                    <option value="IN_TRANSIT">IN_TRANSIT</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!ready || loading.register}>
                  {loading.register ? <div className={styles.spinner} /> : 'Mint NFT'}
                </button>
              </form>

              <form ref={controllerFormRef} className={styles.card} onSubmit={handleControllerFlow}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}><Icons.Zap /></div>
                  <div>
                    <h2 className={styles.cardTitle}>Quick Register</h2>
                    <p className={styles.cardDesc}>Mint + log provenance</p>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Recipient</label>
                  <input className={styles.input} name="controllerTo" placeholder="0x..." defaultValue={account} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>IPFS CID</label>
                  <input className={styles.input} name="controllerCid" placeholder="bafy..." required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Token URI</label>
                  <input className={styles.input} name="controllerUri" placeholder="ipfs://..." required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Initial Status</label>
                  <select className={styles.select} name="controllerStatus" required>
                    <option value="CREATED">CREATED</option>
                    <option value="RAW">RAW</option>
                    <option value="PACKED">PACKED</option>
                  </select>
                </div>
                <button type="submit" className={`${styles.btn} ${styles.btnSecondary}`} disabled={!ready || loading.controller}>
                  {loading.controller ? <div className={styles.spinner} /> : 'Quick Register'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'track' && (
            <section className={styles.grid}>
              <form ref={statusFormRef} className={styles.card} onSubmit={handleUpdateStatus}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}><Icons.RefreshCw /></div>
                  <div>
                    <h2 className={styles.cardTitle}>Update Status</h2>
                    <p className={styles.cardDesc}>Change product status</p>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Token ID</label>
                  <input className={styles.input} name="statusTokenId" type="number" min="1" placeholder="1" required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>New Status</label>
                  <select className={styles.select} name="newStatus" required>
                    <option value="RAW">RAW</option>
                    <option value="PACKED">PACKED</option>
                    <option value="IN_TRANSIT">IN_TRANSIT</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!ready || loading.status}>
                  {loading.status ? <div className={styles.spinner} /> : 'Update'}
                </button>
              </form>

              <form ref={eventFormRef} className={styles.card} onSubmit={handleAddEvent}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}><Icons.FileText /></div>
                  <div>
                    <h2 className={styles.cardTitle}>Add Event</h2>
                    <p className={styles.cardDesc}>Record to audit trail</p>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Token ID</label>
                  <input className={styles.input} name="eventTokenId" type="number" min="1" placeholder="1" required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Action</label>
                  <select className={styles.select} name="action" required>
                    <option value="INSPECTED">INSPECTED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="STORED">STORED</option>
                    <option value="CERTIFIED">CERTIFIED</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>IPFS CID (optional)</label>
                  <input className={styles.input} name="eventCid" placeholder="bafy..." />
                </div>
                <button type="submit" className={`${styles.btn} ${styles.btnSecondary}`} disabled={!ready || loading.event}>
                  {loading.event ? <div className={styles.spinner} /> : 'Add Event'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'lookup' && (
            <section className={styles.grid}>
              <form ref={lookupFormRef} className={styles.card} onSubmit={handleLookup}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}><Icons.Search /></div>
                  <div>
                    <h2 className={styles.cardTitle}>Lookup Product</h2>
                    <p className={styles.cardDesc}>View details and history</p>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Token ID</label>
                  <input className={styles.input} name="lookupTokenId" type="number" min="1" placeholder="1" required />
                </div>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!provider || loading.lookup}>
                  {loading.lookup ? <div className={styles.spinner} /> : 'Fetch'}
                </button>

                {productInfo && (
                  <div className={styles.productInfo}>
                    <div className={styles.productInfoRow}>
                      <span className={styles.productInfoLabel}>Status</span>
                      <StatusBadge status={productInfo.status} />
                    </div>
                    <div className={styles.productInfoRow}>
                      <span className={styles.productInfoLabel}>Owner</span>
                      <span className={`${styles.productInfoValue} ${styles.mono}`}>{productInfo.owner}</span>
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
                  <div className={styles.cardIcon}><Icons.Clock /></div>
                  <div>
                    <h2 className={styles.cardTitle}>History</h2>
                    <p className={styles.cardDesc}>Provenance timeline</p>
                  </div>
                </div>

                {history.length > 0 ? (
                  <div className={styles.timeline}>
                    {history.map((entry) => (
                      <div key={`${entry.index}-${entry.timestamp}`} className={styles.timelineItem}>
                        <div className={styles.timelineDot} />
                        <div className={styles.timelineContent}>
                          <div className={styles.timelineAction}>{entry.action}</div>
                          <div className={styles.timelineDate}>
                            {new Date(entry.timestamp * 1000).toLocaleString()}
                          </div>
                          <div className={styles.timelineMeta}>
                            {entry.by.slice(0, 10)}...{entry.by.slice(-8)}
                            {entry.cid && ` · ${entry.cid.slice(0, 12)}...`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <Icons.Clock />
                    <p>No history yet</p>
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
