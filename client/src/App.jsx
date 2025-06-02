import React, { useState, useEffect } from "react";
import ConnectWalletButton from "./components/ConnectWalletButton";
import ContractInfo from "./components/ContractInfo";
import ContractActions from "./components/ContractActions";
import LotHistory from "./components/LotHistory";
import TransferHistory from "./components/TransferHistory";
import NFTPreview from "./components/NFTPreview";
import RoleManager from "./components/RoleManager";
import {
    requestAccount,
    hasRole,
    initialize,
    onLotRejected,
    offLotRejected,
    onLotReturned,
    offLotReturned
} from "./utils/contractService";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
    const [account, setAccount] = useState(null);
    const [role, setRole] = useState(null);

    // Initial connect
    useEffect(() => {
        (async () => {
            await initialize();
            setAccount(await requestAccount());
        })();
    }, []);

    // Account-Wechsel listener
    useEffect(() => {
        const handler = (accs) => setAccount(accs[0] ?? null);
        window.ethereum?.on("accountsChanged", handler);
        return () => window.ethereum?.removeListener("accountsChanged", handler);
    }, []);

    // Rollen setzen
    useEffect(() => {
        if (!account) return;
        (async () => {
            await initialize();
            const isAdmin = await hasRole("DEFAULT_ADMIN_ROLE", account);
            const isManu = await hasRole("MANUFACTURER_ROLE", account);
            const isQC = await hasRole("QC_ROLE", account);
            setRole(
                isAdmin ? "Admin" :
                    isManu ? "Hersteller" :
                        isQC ? "Qualitätssicherung" : "Gast"
            );
        })();
    }, [account]);

    // Benachrichtigung: Lot abgelehnt
    useEffect(() => {
        const notify = ({ lotId, note }) =>
            toast.error(`Lot ${lotId} abgelehnt – ${note}`);
        onLotRejected(notify);
        return () => offLotRejected();
    }, []);

    // Benachrichtigung: Lot zurück an Hersteller
    useEffect(() => {
        const notify = ({ lotId, note }) =>
            toast.info(`Lot ${lotId} zurück an Hersteller – ${note}`);
        onLotReturned(notify);
        return () => offLotReturned();
    }, []);

    // Render
    return (
        <div className="app">
            <ToastContainer />
            {!account ? (
                <ConnectWalletButton setAccount={setAccount} />
            ) : (
                <div className="contract-interactions">
                    <p>Angemeldet als: <strong>{role || "..."}</strong></p>

                    {["Hersteller", "Qualitätssicherung", "Admin"].includes(role) && (
                        <>
                            <ContractInfo account={account} />
                            <ContractActions role={role} />
                        </>
                    )}

                    {["Hersteller", "Admin"].includes(role) && <RoleManager />}
                    {["Hersteller", "Qualitätssicherung", "Admin"].includes(role) && (
                        <>
                            <LotHistory />
                            <TransferHistory />
                            <NFTPreview />
                        </>
                    )}

                    {role === "Gast" && <p>Keine Berechtigungen für diesen Contract.</p>}
                </div>
            )}
        </div>
    );
}

export default App;
