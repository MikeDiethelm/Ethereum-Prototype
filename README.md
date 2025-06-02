# 🦴 ImplantLot721 – Ethereum NFT Produktionsnachverfolgung

Ein Ethereum-DApp-Prototyp zur fälschungssicheren Verwaltung von Implantat-Produktionschargen mittels ERC-721 NFTs. Entwickelt im Rahmen einer Bachelorarbeit an der ZHAW.

---

## ⚙️ Features

- ✅ ERC-721 NFT mit Produktionshistorie & Metadaten
- ✅ Hersteller & QS-Rollen (AccessControl mit `grantRole`)
- ✅ Produktionsschritte dokumentieren
- ✅ Statusanzeige: `InProduktion`, `Ausschuss`, `Abgeschlossen`
- ✅ Live-Verbindung via MetaMask (Web3)
- ✅ Zuweisung von Rollen direkt per Web-GUI
- ✅ NFT-Ansicht mit `tokenURI`-Vorschau (Name, Bild, Beschreibung)
- ✅ Produktions- & Transferhistorie als Tabelle
- ✅ Integration ins ZHAW-Testnetz (Chain-ID `24888`)
- ✅ Auto-Deployment: schreibt ABI & Adresse direkt ins Frontend (`constants.js`)

---

## 🧱 Projektstruktur

```bash
Ethereum-Prototype/
├── contract/                  # Hardhat-Projekt für Smart Contracts
│   ├── contracts/
│   │   └── ImplantLot721.sol         # Der ERC-721 NFT Contract
│   ├── scripts/
│   │   └── deploy.ts                 # Deployment inkl. Export ins Frontend
│   ├── test/
│   │   └── ImplantLot721.ts          # Unit Tests
│   ├── constants.ts                  # RPC & PRIVATE_KEY für ZHAW-Testnetz
│   ├── hardhat.config.ts
│   └── ...
│
├── client/                    # React-Frontend für Interaktion mit dem Contract
│   ├── src/
│   │   ├── components/              # UI-Komponenten
│   │   │   ├── ConnectWalletButton.jsx
│   │   │   ├── ContractActions.jsx
│   │   │   ├── ContractInfo.jsx
│   │   │   ├── LotHistory.jsx
│   │   │   ├── NFTPreview.jsx
│   │   │   ├── RoleManager.jsx
│   │   │   └── TransferHistory.jsx
│   │   ├── utils/
│   │   │   ├── contractService.js     # Contract-Funktionen (mint, grantRole, etc.)
│   │   │   └── constants.js           # ✨ Automatisch generiert beim Deployment
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── ...
│
├── README.md                 # ← Dieses Dokument

## 🚀 Setup & Deployment

---

### 🔧 Voraussetzungen

- **Node.js** (empfohlen: LTS-Version, **nicht** v21)
- **MetaMask** (Browser-Erweiterung)
- **Zugang zum ZHAW-Testnetz:**
  - **RPC:** `http://185.48.228.49:8545/`
  - **Chain ID:** `24888`
  - Test-Account mit ETH

---

### 🔌 Contract deployen

```bash
cd contract
npx hardhat compile
npx hardhat run scripts/deploy.ts --network zhaw

## 🚀 Setup & Deployment

### 🔧 Voraussetzungen

| Tool / Service | Version / URL |
|----------------|---------------|
| **Node.js**    | LTS (empfohlen), **nicht** v21 |
| **MetaMask**   | Browser-Erweiterung |
| **ZHAW-Testnetz** | RPC `http://185.48.228.49:8545/`  ·  Chain-ID `24888` |
| Test-Account   | Mit etwas ETH (Faucet / Transfer) |

---

### 🔌 Contract deployen

```bash
cd contract
npx hardhat compile
npx hardhat run scripts/deploy.ts --network zhaw

### 📦 Ergebnis nach dem Deploy

- Contract-Adresse **und** ABI werden **automatisch** nach  
  `client/src/utils/constants.js` geschrieben.  
- 💡 **Achtung:** Diese Datei wird bei jedem Deploy **überschrieben**!

---

### 💻 Frontend starten

```bash
cd client
npm install
npm run dev     # oder: npm start

➡️ Im Browser öffnen: http://localhost:3000

## ✅ Workflow-Beispiel

| Schritt | Aktion |
|--------:|--------|
| **1️⃣** | **Wallet verbinden**  
MetaMask-Popup bestätigen |
| **2️⃣** | **NFT erstellen**  
• Lot-ID: `1001`  
• Token-URI: `https://example.com/metadata/1001.json`  
→ **Mint NFT** |
| **3️⃣** | **Produktionsschritt hinzufügen**  
• Schrittname: `Reinigung`  
• Bemerkung: `mit Ultraschall`  
• ✅ „bestanden“ aktivieren  
→ **Schritt hinzufügen** |
| **4️⃣** | **Lot abschließen**  
(nur mit Rolle `QC_ROLE`) |
| **5️⃣** | **Transfers & Historie** im UI einsehen |
| **6️⃣** | **NFT-Metadaten anzeigen**  
über hinterlegte `tokenURI`-Vorschau (Name, Beschreibung, Bild) |

---

## 🛠 Rollenzuweisung (Frontend)

1. Trage die Rolle ein:
   - `MANUFACTURER_ROLE`
   - `QC_ROLE`
2. Zieladresse angeben (z. B. `0xAbc123…`)
3. → **„Rolle vergeben“** klicken

---

## 🧪 Smart-Contract Tests (optional)

```bash
cd contract
npx hardhat test
