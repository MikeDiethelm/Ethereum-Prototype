import { BrowserProvider, Contract, ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./constants";

/* ---------- globale Instanzen ---------- */
let provider = null;
let signer = null;
let contract = null;

/* ---------- Konstanten ---------- */
const ZERO_HASH = ethers.ZeroHash;           // 0x000…000  (Admin-Rolle)

/* ---------- Init – holt IMMER den aktuell ausgewählten Signer ---------- */
export const initialize = async () => {
    if (typeof window.ethereum === "undefined") {
        throw new Error("Bitte MetaMask installieren!");
    }

    // Provider nur einmal erstellen
    if (!provider) {
        provider = new BrowserProvider(window.ethereum);
    }

    // aktuellen Signer abholen (abhängig vom ausgewählten Wallet-Konto)
    signer = await provider.getSigner();

    // Contract neu verbinden oder anlegen
    if (!contract) {
        contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    } else {
        contract = contract.connect(signer);      // Signer-Switch
    }
};

/* ---------- Accounts ---------- */
export const requestAccount = async () => {
    await initialize();
    const accounts = await provider.send("eth_requestAccounts", []);
    return accounts[0];
};

/* ---------- Helper ---------- */
const toRoleHash = (roleName) =>
    roleName === "DEFAULT_ADMIN_ROLE"
        ? ZERO_HASH
        : ethers.keccak256(ethers.toUtf8Bytes(roleName));

/* ---------- Contract-Aktionen ---------- */

// Mint
export const mintLot = async (toAddress, lotId, uri) => {
    await initialize();
    const tx = await contract.safeMint(toAddress, lotId, uri);
    await tx.wait();
};

// Status
export const getLotStatus = async (lotId) => {
    await initialize();
    const status = await contract.getStatus(lotId);
    return ["InProduktion", "Ausschuss", "Abgeschlossen"][status];
};

// Produktionsschritt
export const addStep = async (lotId, name, bestanden, bemerkung) => {
    await initialize();
    const tx = await contract.addStep(lotId, name, bestanden, bemerkung);
    await tx.wait();
};

// Abschließen
export const closeLot = async (lotId) => {
    await initialize();
    const tx = await contract.closeLot(lotId);
    await tx.wait();
};

// Rolle vergeben
export const grantRole = async (roleName, address) => {
    await initialize();
    const roleHash = toRoleHash(roleName);
    const tx = await contract.grantRole(roleHash, address);
    await tx.wait();
};

// Rollen-Prüfung
export const hasRole = async (roleName, address) => {
    await initialize();
    const roleHash = toRoleHash(roleName);
    return contract.hasRole(roleHash, address);
};

/* ---------- History-Helper ---------- */
export const getSteps = async (lotId) => {
    await initialize();
    const steps = await contract.getSteps(Number(lotId));
    return steps.map((s) => ({
        name: s.name,
        timestamp: new Date(Number(s.timestamp) * 1000).toLocaleString(),
        bestanden: s.bestanden,
        bemerkung: s.bemerkung,
    }));
};

export const getTransfers = async (lotId) => {
    await initialize();
    const transfers = await contract.getTransfers(Number(lotId));
    return transfers.map((t) => ({
        from: t.from,
        to: t.to,
        timestamp: new Date(Number(t.timestamp) * 1000).toLocaleString(),
    }));
};

// Transfer-Funktion
export const transferNFT = async (from, to, tokenId) => {
    await initialize();
    const tx = await contract["safeTransferFrom(address,address,uint256)"](from, to, tokenId);
    await tx.wait();
};

// Metadaten
export const fetchNFTMetadata = async (uri) => {
    const res = await fetch(uri);
    if (!res.ok) throw new Error("Fehler beim Abrufen der Metadaten");
    return res.json();
};

/* ---------- Ergänzung: rejectLot ---------- */
export const rejectLot = async (lotId, bemerkung) => {
    await initialize();
    const tx = await contract.rejectLot(lotId, bemerkung);
    await tx.wait();
};

/* ---------- Ergänzung: Event-Listener ---------- */
export const onLotRejected = async (handler) => {
    await initialize(); // ← sicherstellen, dass contract vorhanden ist
    contract.on("LotRejected", (lotId, qc, note, event) => {
        handler({
            lotId: Number(lotId),
            qc,
            note,
            txHash: event.log.transactionHash
        });
    });
};

export const offLotRejected = async () => {
    await initialize();
    contract.removeAllListeners("LotRejected");
};


// Reparatur zurück an Hersteller senden
export const returnToManufacturer = async (lotId, bemerkung) => {
    await initialize();
    const tx = await contract.returnToManufacturer(lotId, bemerkung);
    await tx.wait();
};

// Event-Listener für Reparatur-Rückgabe
export const onLotReturned = (handler) => {
    if (contract) {
        contract.on("LotReturned", (lotId, qc, note, event) => {
            handler({
                lotId: Number(lotId),
                qc,
                note,
                txHash: event.log.transactionHash
            });
        });
    }
};

export const offLotReturned = () => {
    if (contract) {
        contract.removeAllListeners("LotReturned");
    }
};
