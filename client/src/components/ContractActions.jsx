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
import { uploadToIPFS } from "../utils/ipfsService"; // ✅ NEU
import { toast } from "react-toastify";

function ContractActions({ role }) {
    const [lotId, setLotId] = useState("");
    const [status, setStatus] = useState("");
    const [imageFile, setImageFile] = useState(null); // ✅ NEU

    const [stepName, setStepName] = useState("");
    const [stepNote, setStepNote] = useState("");
    const [stepOK, setStepOK] = useState(true);

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [transferId, setTransferId] = useState("");

    const [rejectNote, setRejectNote] = useState("");

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
            if (!imageFile) {
                toast.error("Bitte ein Bild auswählen.");
                return;
            }

            const tokenUri = await uploadToIPFS(
                `Implantat Lot ${lotId}`,
                "Ein medizinisches Implantat mit vollständiger Produktionshistorie.",
                imageFile
            );

            const currentAccount = await requestAccount();
            await mintLot(currentAccount, lotId, tokenUri);
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

    const handleReturn = async () => {
        try {
            await returnToManufacturer(lotId, rejectNote);
            toast.info("Lot zur Reparatur zurückgegeben.");
        } catch (e) {
            toast.error("Fehler beim Zurückgeben: " + e.message);
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
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
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
            >
                Schritt hinzufügen
            </button>

            <hr />

            {/* Lot abschließen */}
            <button
                onClick={handleClose}
                disabled={!["Qualitätssicherung", "Admin"].includes(role)}
            >
                Lot abschließen
            </button>

            {/* Lot ablehnen / zurück */}
            <div style={{ marginTop: "1em" }}>
                <input
                    placeholder="Ablehnungsgrund"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                />
                <button
                    onClick={handleReject}
                    disabled={!["Qualitätssicherung", "Admin"].includes(role)}
                >
                    Lot ablehnen
                </button>
                <button
                    onClick={handleReturn}
                    disabled={!["Qualitätssicherung", "Admin"].includes(role)}
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
