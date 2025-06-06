import React, { useState } from "react";
import { requestAccount } from "../utils/contractService";

function ConnectWalletButton({ setAccount }) {
    const [error, setError] = useState(null);

    const connectWallet = async () => {
        try {
            const account = await requestAccount();
            setAccount(account);
            setError(null);
        } catch (err) {
            console.error("Wallet-Verbindung fehlgeschlagen:", err);
            setError("⚠️ Bitte öffne MetaMask und bestätige den Zugriff.");
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <p>🔒 Noch nicht verbunden mit MetaMask</p>
            <button onClick={connectWallet} style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}>
                🔑 Wallet verbinden
            </button>
            {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
        </div>
    );
}

export default ConnectWalletButton;
