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

const STORAGE_KEY = 'supply-chain-tokens';

// ========== Helper Functions ==========
const generateCID = (name) => {
  const hash = btoa(name + Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  return `bafy${hash}`;
};

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
function StatusBadge({ status, small }) {
  const s = status?.toLowerCase() || '';
  let cls = styles.badgeCreated;
  if (s.includes('raw')) cls = styles.badgeRaw;
  else if (s.includes('packed')) cls = styles.badgePacked;
  else if (s.includes('transit')) cls = styles.badgeInTransit;
  else if (s.includes('delivered')) cls = styles.badgeDelivered;
  return <span className={`${styles.badge} ${cls} ${small ? styles.badgeSmall : ''}`}>{status}</span>;
}

// ========== New Product Slide Over ==========
function NewProductSlideOver({ isOpen, onClose, account, onMint, loading }) {
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = formRef.current;
    const data = new FormData(form);
    const name = data.get("productName");
    const description = data.get("description") || "";

    // Generate CID and Token URI from product name
    const cid = generateCID(name);
    const tokenURI = `ipfs://${cid}`;

    const success = await onMint({
      to: data.get("to"),
      name,
      description,
      cid,
      tokenURI,
      initialStatus: data.get("initialStatus")
    });
    if (success) {
      form.reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose} />
      <div className={styles.slideOver}>
        <div className={styles.slideOverHeader}>
          <h2 className={styles.slideOverTitle}>New Product</h2>
          <button className={styles.slideOverClose} onClick={onClose}>
            <Icons.X />
          </button>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className={styles.slideOverContent}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Product Name</label>
            <input className={styles.input} name="productName" placeholder="e.g., iPhone 15 Pro" required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Description (optional)</label>
            <input className={styles.input} name="description" placeholder="e.g., 256GB Space Black" />
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
          <div className={styles.formGroup}>
            <label className={styles.label}>Recipient Address</label>
            <input className={styles.input} name="to" placeholder="0x..." defaultValue={account} required />
          </div>
          <div className={styles.slideOverFooter} style={{ padding: 0, border: 'none', marginTop: 24 }}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading}>
              {loading ? <div className={styles.spinner} /> : 'Mint Product NFT'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ========== Main Component ==========
export default function Home() {
  const [account, setAccount] = useState("");
  const [toasts, setToasts] = useState([]);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [loading, setLoading] = useState({});

  // Token management
  const [tokens, setTokens] = useState([]);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [history, setHistory] = useState([]);
  const [showNewProduct, setShowNewProduct] = useState(false);

  const statusFormRef = useRef(null);
  const eventFormRef = useRef(null);

  const ready = useMemo(() => Boolean(signer && addresses.registry), [signer]);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTokens(parsed);
      } catch {}
    }
  }, []);

  // Save tokens to localStorage when they change
  useEffect(() => {
    if (tokens.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    }
  }, [tokens]);

  // Fetch token data when selected
  useEffect(() => {
    if (selectedTokenId && provider) {
      fetchTokenData(selectedTokenId);
    }
  }, [selectedTokenId, provider]);

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

  const handleMint = async ({ to, name, description, cid, tokenURI, initialStatus }) => {
    try {
      setLoading(prev => ({ ...prev, mint: true }));
      const registry = getRegistry();
      const tx = await registry.registerProduct(to, cid, tokenURI, initialStatus);
      addToast("Confirming...", 'info');
      const receipt = await tx.wait();
      const tokenId = getTokenIdFromReceipt(receipt, addresses.registry);

      if (tokenId) {
        const newToken = {
          id: tokenId,
          name,
          description,
          cid,
          status: initialStatus,
          createdAt: Date.now()
        };
        setTokens(prev => [newToken, ...prev]);
        setSelectedTokenId(tokenId);
        addToast(`Minted "${name}" · CID: ${cid.slice(0, 20)}...`, 'success');
        return true;
      }
      return false;
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, mint: false }));
    }
  };

  const fetchTokenData = async (tokenId) => {
    try {
      setLoading(prev => ({ ...prev, fetch: true }));
      const registry = getRegistry(true);
      const info = await registry.getProductInfo(tokenId);
      setTokenData({
        owner: info[0],
        tokenURI: info[1],
        cid: info[2],
        status: info[3]
      });

      // Update token in list with latest status
      setTokens(prev => prev.map(t =>
        t.id === tokenId ? { ...t, status: info[3] } : t
      ));

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
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
      setTokenData(null);
      setHistory([]);
    } finally {
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    const form = statusFormRef.current;
    const data = new FormData(form);
    try {
      setLoading(prev => ({ ...prev, status: true }));
      const registry = getRegistry();
      const tx = await registry.updateStatus(selectedTokenId, data.get("newStatus"));
      addToast("Updating...", 'info');
      await tx.wait();
      addToast("Status updated", 'success');

      // Refresh token data
      await fetchTokenData(selectedTokenId);
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
      const tx = await provenance.addEvent(selectedTokenId, data.get("action"), data.get("eventCid") || "");
      addToast("Adding event...", 'info');
      await tx.wait();
      addToast("Event recorded", 'success');

      // Refresh token data
      await fetchTokenData(selectedTokenId);
      form.reset();
    } catch (error) {
      addToast(error.shortMessage || error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, event: false }));
    }
  };

  const getStatusStep = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('delivered')) return 4;
    if (s.includes('transit')) return 3;
    if (s.includes('packed')) return 2;
    if (s.includes('raw') || s.includes('created')) return 1;
    return 0;
  };

  const currentStep = tokenData ? getStatusStep(tokenData.status) : 0;
  const selectedToken = tokens.find(t => t.id === selectedTokenId);

  return (
    <div className={styles.dashboard}>
      {/* Toast Container */}
      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <Icons.Cube />
            <span>Supply Chain Tracker</span>
          </div>
          <button
            className={styles.newProductBtn}
            onClick={() => setShowNewProduct(true)}
            disabled={!ready}
          >
            <Icons.Plus />
            New Product
          </button>
        </div>

        <div className={styles.sidebarContent}>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>Products</div>
            <div className={styles.tokenList}>
              {tokens.length === 0 ? (
                <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No products yet
                </div>
              ) : (
                tokens.map(token => (
                  <div
                    key={token.id}
                    className={`${styles.tokenItem} ${selectedTokenId === token.id ? styles.active : ''}`}
                    onClick={() => setSelectedTokenId(token.id)}
                  >
                    <span className={styles.tokenId}>{token.name || `Token #${token.id}`}</span>
                    <span className={styles.tokenMeta}>
                      <StatusBadge status={token.status} small />
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <button
            className={`${styles.walletBtn} ${account ? styles.connected : ''}`}
            onClick={connectWallet}
            disabled={loading.wallet}
          >
            {loading.wallet ? <div className={styles.spinner} /> : <Icons.Wallet />}
            {account ? (
              <span className={styles.walletAddress}>
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            ) : (
              "Connect Wallet"
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <h1 className={styles.mainTitle}>
            {selectedToken ? (selectedToken.name || `Token #${selectedTokenId}`) : 'Dashboard'}
          </h1>
        </div>

        <div className={styles.mainContent}>
          {!selectedTokenId ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icons.Package />
              </div>
              <h2 className={styles.emptyTitle}>No product selected</h2>
              <p className={styles.emptyDesc}>Select a product from the sidebar or create a new one</p>
              <button
                className={styles.emptyBtn}
                onClick={() => setShowNewProduct(true)}
                disabled={!ready}
              >
                <Icons.Plus />
                New Product
              </button>
            </div>
          ) : loading.fetch && !tokenData ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner} style={{ width: 24, height: 24 }} />
            </div>
          ) : tokenData ? (
            <div className={styles.tokenDetail}>
              {/* Token Header */}
              <div className={styles.tokenHeader}>
                <div className={styles.tokenHeaderInfo}>
                  <h2 className={styles.tokenHeaderId}>
                    {selectedToken?.name || `Token #${selectedTokenId}`}
                    <StatusBadge status={tokenData.status} />
                  </h2>
                  <div className={styles.tokenHeaderMeta}>
                    <div className={styles.tokenMetaItem}>
                      <span className={styles.tokenMetaLabel}>Token ID</span>
                      <span className={`${styles.tokenMetaValue} ${styles.mono}`}>
                        #{selectedTokenId}
                      </span>
                    </div>
                    {selectedToken?.description && (
                      <div className={styles.tokenMetaItem}>
                        <span className={styles.tokenMetaLabel}>Description</span>
                        <span className={styles.tokenMetaValue}>
                          {selectedToken.description}
                        </span>
                      </div>
                    )}
                    <div className={styles.tokenMetaItem}>
                      <span className={styles.tokenMetaLabel}>Owner</span>
                      <span className={`${styles.tokenMetaValue} ${styles.mono}`}>
                        {tokenData.owner.slice(0, 10)}...{tokenData.owner.slice(-8)}
                      </span>
                    </div>
                    <div className={styles.tokenMetaItem}>
                      <span className={styles.tokenMetaLabel}>IPFS CID</span>
                      <span className={`${styles.tokenMetaValue} ${styles.mono}`}>
                        {selectedToken?.cid || tokenData.cid.slice(0, 20)}...
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Track */}
              <div className={styles.progressSection}>
                <h3 className={styles.sectionTitle}>Supply Chain Progress</h3>
                <div className={styles.progressTrack}>
                  <div className={`${styles.progressStep} ${currentStep >= 1 ? styles.completed : ''} ${currentStep === 1 ? styles.current : ''}`}>
                    <div className={styles.progressIcon}><Icons.Factory /></div>
                    <span className={styles.progressLabel}>Raw</span>
                  </div>
                  <div className={`${styles.progressLine} ${currentStep >= 2 ? styles.completed : ''}`} />
                  <div className={`${styles.progressStep} ${currentStep >= 2 ? styles.completed : ''} ${currentStep === 2 ? styles.current : ''}`}>
                    <div className={styles.progressIcon}><Icons.Package /></div>
                    <span className={styles.progressLabel}>Packed</span>
                  </div>
                  <div className={`${styles.progressLine} ${currentStep >= 3 ? styles.completed : ''}`} />
                  <div className={`${styles.progressStep} ${currentStep >= 3 ? styles.completed : ''} ${currentStep === 3 ? styles.current : ''}`}>
                    <div className={styles.progressIcon}><Icons.Truck /></div>
                    <span className={styles.progressLabel}>In Transit</span>
                  </div>
                  <div className={`${styles.progressLine} ${currentStep >= 4 ? styles.completed : ''}`} />
                  <div className={`${styles.progressStep} ${currentStep >= 4 ? styles.completed : ''} ${currentStep === 4 ? styles.current : ''}`}>
                    <div className={styles.progressIcon}><Icons.Check /></div>
                    <span className={styles.progressLabel}>Delivered</span>
                  </div>
                </div>
              </div>

              {/* Actions Grid */}
              <div className={styles.contentGrid}>
                {/* Update Status Card */}
                <form ref={statusFormRef} className={styles.card} onSubmit={handleUpdateStatus}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}><Icons.RefreshCw /></div>
                    <div>
                      <h3 className={styles.cardTitle}>Update Status</h3>
                      <p className={styles.cardDesc}>Change product status</p>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Token ID</label>
                    <input
                      className={styles.input}
                      value={selectedTokenId}
                      disabled
                    />
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
                    {loading.status ? <div className={styles.spinner} /> : 'Update Status'}
                  </button>
                </form>

                {/* Add Event Card */}
                <form ref={eventFormRef} className={styles.card} onSubmit={handleAddEvent}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}><Icons.FileText /></div>
                    <div>
                      <h3 className={styles.cardTitle}>Add Event</h3>
                      <p className={styles.cardDesc}>Record to audit trail</p>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Token ID</label>
                    <input
                      className={styles.input}
                      value={selectedTokenId}
                      disabled
                    />
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

                {/* History Card */}
                <div className={styles.card} style={{ gridColumn: 'span 2' }}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}><Icons.Clock /></div>
                    <div>
                      <h3 className={styles.cardTitle}>Provenance History</h3>
                      <p className={styles.cardDesc}>Immutable audit trail</p>
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
                    <div className={styles.timelineEmpty}>
                      No events recorded yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* New Product Slide Over */}
      <NewProductSlideOver
        isOpen={showNewProduct}
        onClose={() => setShowNewProduct(false)}
        account={account}
        onMint={handleMint}
        loading={loading.mint}
      />
    </div>
  );
}
