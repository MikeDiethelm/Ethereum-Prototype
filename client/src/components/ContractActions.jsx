import React, { useState, useEffect } from "react";
import {
    mintLot,
    getLotStatus,
    addStep,
    closeLot,
    transferNFT,
    rejectLot,
    requestAccount,
    returnToManufacturer
} from "../utils/contractService";
import { toast } from "react-toastify";

function ContractActions({ role }) {
    const [lotId, setLotId] = useState("");
    const [uri, setUri] = useState("");
    const [status, setStatus] = useState("");

    const [stepName, setStepName] = useState("");
    const [stepNote, setStepNote] = useState("");
    const [stepOK, setStepOK] = useState(true);

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [transferId, setTransferId] = useState("");

    const [rejectNote, setRejectNote] = useState(""); // ✅ NEU

    useEffect(() => {
        const fetchStatus = async () => {
            if (!lotId) return setStatus("");
            try {
                setStatus(await getLotStatus(lotId));
            } catch (e) {
                console.error("Status-Abruf fehlgeschlagen:", e);
                setStatus("unbekannt");
            }
        };
        fetchStatus();
    }, [lotId]);

    const handleMint = async () => {
        try {
            const currentAccount = await requestAccount();
            await mintLot(currentAccount, lotId, uri);
            toast.success("NFT erfolgreich gemintet!");
        } catch (e) {
            toast.error("Mint fehlgeschlagen: " + e.message);
        }
    };

    const handleStep = async () => {
        try {
            await addStep(lotId, stepName, stepOK, stepNote);
            toast.success("Schritt hinzugefügt.");
        } catch (e) {
            toast.error("Fehler beim Hinzufügen: " + e.message);
        }
    };

    const handleClose = async () => {
        try {
            await closeLot(lotId);
            toast.success("Lot abgeschlossen.");
        } catch (e) {
            toast.error("Fehler beim Abschließen: " + e.message);
        }
    };

    const handleReject = async () => {
        try {
            await rejectLot(lotId, rejectNote);
            toast.warn("Lot wurde abgelehnt!");
        } catch (e) {
            toast.error("Fehler beim Ablehnen: " + e.message);
        }
    };

    const handleTransfer = async () => {
        try {
            await transferNFT(from, to, transferId);
            toast.success("Transfer erfolgreich!");
        } catch (e) {
            toast.error("Fehler beim Transfer: " + e.message);
        }
    };

    const handleReturn = async () => {
        try {
            await returnToManufacturer(lotId, rejectNote);
            toast.info("Lot zur Reparatur zurückgegeben.");
        } catch (e) {
            toast.error("Fehler beim Zurückgeben: " + e.message);
        }
    };

    const isTransferAllowed =
        ["Hersteller", "Qualitätssicherung", "Admin"].includes(role) &&
        status === "Abgeschlossen";

    return (
        <div className="actions">
            <h2>Interaktion mit Contract</h2>

            {/* Mint */}
            <input
                placeholder="Lot ID"
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
            />
            <input
                placeholder="Token URI (z. B. https://...)"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
            />
            <button
                onClick={handleMint}
                disabled={!["Hersteller", "Admin"].includes(role)}
                title={
                    !["Hersteller", "Admin"].includes(role)
                        ? "Nur Hersteller oder Admin dürfen minten"
                        : ""
                }
            >
                Mint NFT
            </button>
            {!["Hersteller", "Admin"].includes(role) && (
                <p style={{ color: "gray", fontSize: "0.9em" }}>
                    🔒 Nur Hersteller oder Admin dürfen NFTs minten.
                </p>
            )}

            {status && <p>Status: {status}</p>}

            <hr />

            {/* Produktionsschritt */}
            <h3>Produktionsschritt</h3>
            <input
                placeholder="Schrittname"
                value={stepName}
                onChange={(e) => setStepName(e.target.value)}
            />
            <input
                placeholder="Bemerkung"
                value={stepNote}
                onChange={(e) => setStepNote(e.target.value)}
            />
            <label>
                <input
                    type="checkbox"
                    checked={stepOK}
                    onChange={() => setStepOK(!stepOK)}
                />
                Schritt bestanden
            </label>
            <button
                onClick={handleStep}
                disabled={!["Hersteller", "Admin"].includes(role)}
                title={
                    !["Hersteller", "Admin"].includes(role)
                        ? "Nur Hersteller oder Admin dürfen Produktionsschritte hinzufügen"
                        : ""
                }
            >
                Schritt hinzufügen
            </button>
            {!["Hersteller", "Admin"].includes(role) && (
                <p style={{ color: "gray", fontSize: "0.9em" }}>
                    🔒 Nur Hersteller oder Admin dürfen Produktionsschritte hinzufügen.
                </p>
            )}

            <hr />

            {/* Lot abschließen */}
            <button
                onClick={handleClose}
                disabled={!["Qualitätssicherung", "Admin"].includes(role)}
                title={
                    !["Qualitätssicherung", "Admin"].includes(role)
                        ? "Nur für Qualitätssicherung oder Admin"
                        : ""
                }
            >
                Lot abschließen
            </button>
            {!["Qualitätssicherung", "Admin"].includes(role) && (
                <p style={{ color: "gray", fontSize: "0.9em" }}>
                    🔒 Diese Aktion ist nur für Qualitätssicherung oder Admin verfügbar.
                </p>
            )}

            {/* Lot ablehnen */}
            <div style={{ marginTop: "1em" }}>
                <input
                    placeholder="Ablehnungsgrund"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                />
                <button
                    onClick={handleReject}
                    disabled={!["Qualitätssicherung", "Admin"].includes(role)}
                    title="Lot wird in den Status 'Ausschuss' gesetzt"
                >
                    Lot ablehnen
                </button>
                <button
                    onClick={handleReturn}
                    disabled={!["Qualitätssicherung", "Admin"].includes(role)}
                    title="Lot wird zur Reparatur freigegeben"
                >
                    Lot zurück an Hersteller
                </button>

            </div>

            <hr />

            {/* Transfer */}
            <h3>Transfer NFT</h3>
            <input
                placeholder="Von (from)"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
            />
            <input
                placeholder="Nach (to)"
                value={to}
                onChange={(e) => setTo(e.target.value)}
            />
            <input
                placeholder="Token ID"
                value={transferId}
                onChange={(e) => setTransferId(e.target.value)}
            />
            <button
                onClick={handleTransfer}
                disabled={!isTransferAllowed}
                title={
                    !isTransferAllowed
                        ? "Transfer nur erlaubt, wenn Status 'Abgeschlossen' und passende Rolle"
                        : ""
                }
            >
                NFT übertragen
            </button>
            {!isTransferAllowed && (
                <p style={{ color: "gray", fontSize: "0.9em" }}>
                    🔒 Transfer nur möglich, wenn das Lot abgeschlossen ist und du berechtigt bist.
                </p>
            )}
        </div>
    );
}

export default ContractActions;
