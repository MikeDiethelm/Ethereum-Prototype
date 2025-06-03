````markdown
# 🦴 ImplantLot721 – Blockchain-basierte Produktions­nachverfolgung

Ein leichtgewichtiger **Ethereum-DApp-Prototyp** zur fälschungs­sicheren Verwaltung von Implantat-Losen.  
Entstanden im Rahmen der Bachelor­arbeit an der ZHAW (School of Engineering).

---

## ⚙️ Funktionsumfang

| Kategorie | Feature |
|-----------|---------|
| NFT / Contract       | ERC-721-Token pro Produktionslos • Rollenbasiertes Access Control (`MANUFACTURER`, `QC`, `ADMIN`) |
| Produktions­historie  | Schritt-Hash on-chain (keine Klartextdaten) • Klartext-Bemerkungen off-chain (Browser-Storage / DB) |
| QS-Workflow          | `closeLot`, `rejectLot`, `returnToManufacturer` inkl. Hash-Verifizierung im UI |
| Frontend             | React + ethers.js • MetaMask-Login • Rollenverwaltung, Tabellen (Steps & Transfers), PDF-Audit-Export |
| Tests                | Hardhat + solidity-coverage (aktuell ≈ 83 % Stmts / 65 % Branch) |

---

## 🧱 Projektstruktur

Ethereum-Prototype
├─ client/                       # React-App
│  ├─ public/                    # statische Assets
│  ├─ src/
│  │  ├─ components/             # UI-Bausteine
│  │  │  ├─ AuditReport.jsx
│  │  │  ├─ ConnectWalletButton.jsx
│  │  │  ├─ ContractActions.jsx
│  │  │  ├─ ContractInfo.jsx
│  │  │  ├─ LotHistory.jsx
│  │  │  ├─ NFTPreview.jsx
│  │  │  ├─ RoleManager.jsx
│  │  │  └─ TransferHistory.jsx
│  │  ├─ utils/
│  │  │  ├─ contractService.js   # Call-Wrapper (ethers.js)
│  │  │  └─ constants.js         # ⚠️ wird beim Deploy überschrieben
│  │  ├─ App.jsx
│  │  ├─ App.css
│  │  ├─ index.js
│  │  └─ index.css
│  ├─ package.json               # Frontend-Dependencies
│  └─ README.md                  # (optional projektspezifisch)
│
└─ contract/                     # Hardhat-Workspace
   ├─ contracts/
   │  └─ ImplantLot721.sol       # ERC-721-Smart-Contract
   ├─ scripts/
   │  └─ deploy.ts               # Deployment + ABI/Addr-Export → client
   ├─ test/
   │  └─ ImplantLot721.ts        # TypeScript-Unit- & Coverage-Tests
   ├─ artifacts/                 # Build-Artefakte (autogen)
   ├─ cache/                     # Hardhat-Cache (autogen)
   ├─ coverage/                  # solidity-coverage HTML/JSON
   ├─ ignition/                  # (Hardhat Ignition Boilerplate)
   ├─ typechain-types/           # Typings für Ethers v6
   ├─ constants.ts               # RPC / Private-Key Konfig
   ├─ hardhat.config.ts
   ├─ .solcover.js               # Coverage-Konfiguration
   ├─ package.json               # Contract-Dependencies
   └─ README.md                  # (optional Contract-Readme)

````

---

## 🚀 Setup & Deployment

### 1 | Voraussetzungen

| Tool / Dienst     | Version / Info                                      |
| ----------------- | --------------------------------------------------- |
| **Node.js**       | LTS (>=18, <21)                                     |
| **MetaMask**      | aktuelle Browser-Extension                          |
| **ZHAW-Testnetz** | RPC `http://185.48.228.49:8545/` • Chain-ID `24888` |
| **ETH-Faucet**    | Test-ETH für deinen Account                         |

---

### 2 | Smart Contract deployen

```bash
cd contract
npm install          # einmalig
npx hardhat compile
npx hardhat run scripts/deploy.ts --network zhaw
```

* **Adresse** und **ABI** werden automatisch nach
  `client/src/utils/constants.js` geschrieben (Überschreibt die Datei!).

---

### 3 | Frontend starten

```bash
cd ../client
npm install          # einmalig
npm start          
# Browser: http://localhost:3000
```

---

## ✅ Schnelltest-Workflow

| #   | Aktion                                                        | Rolle                      |
| --- | ------------------------------------------------------------- | -------------------------- |
| 1️⃣ | Wallet verbinden                                              | –                          |
| 2️⃣ | **Mint NFT** · Lot ID `1001`, URI `ipfs://…`                  | MANUFACTURER               |
| 3️⃣ | Produktions­schritt `Reinigung`, Bemerkung „Ultraschall“ ✓ ok | MANUFACTURER               |
| 4️⃣ | **Lot abschließen**                                           | QC                         |
| 5️⃣ | Transfer zu Distributor                                       | OWNER / QC (nach Approval) |
| 6️⃣ | Historie & PDF-Audit via UI exportieren                       | alle                       |

---

## 🛠 Rollen via UI vergeben

1. Rolle auswählen (`MANUFACTURER_ROLE`, `QC_ROLE` …)
2. Zieladresse (0x…) eingeben
3. „**Rolle vergeben**“

---

## 🧪 Tests & Coverage

```bash
cd contract
npx hardhat test                # Unit-Tests (8 passing)
npx hardhat coverage            # Sol-Coverage Report
```

Beispiel Output:

```
ImplantLot721
  ✓ Mint → Steps → Close → Transfer  (64ms)
  ✓ verhindert Transfer vor QS-Freigabe
  …
  All files  (82.9 % Stmts / 64.6 % Branch / 75 % Funcs / 82.9 % Lines)
```

---

## 🔐 Sicherheits­notizen des Prototyps

Der Contract läuft derzeit auf einem **nicht öffentlich gerouteten Hardhat-Node**.
On-chain werden **nur Hashes & Statuscodes** gespeichert – Klartext-Daten verbleiben off-chain (Browser-Storage oder später DB / IPFS).
Jede schreibende Funktion prüft die zugewiesenen Rollen (OpenZeppelin `AccessControl`).
Ohne Rolle → reines **Read-Only**.

---

## 📄 Lizenz

MIT – siehe `LICENSE`
Smart-Contract basiert auf OpenZeppelin v5.0.

---

> **Hinweis**
> Dies ist ein Proof-of-Concept. Vor einem produktiven Einsatz sind Hardening, Security-Audit sowie MDR / FDA-konforme Validierung erforderlich.
