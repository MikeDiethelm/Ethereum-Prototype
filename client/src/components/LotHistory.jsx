import React, { useState } from "react";
import { getSteps } from "../utils/contractService";
import { toast } from "react-toastify";
import { AuditReportButton } from "./AuditReport";
import { keccak256, toUtf8Bytes } from "ethers";

function LotHistory({ role }) {
    const [lotId, setLotId] = useState("");
    const [steps, setSteps] = useState([]);

    const fetchHistory = async () => {
        try {
            const result = await getSteps(lotId);

            const stepsWithNotes = result.map((step) => {
                const noteKey = `note-${lotId}-${step.name}`;
                const localNote = localStorage.getItem(noteKey) ?? "";
                const calculatedHash = keccak256(toUtf8Bytes(localNote));
                const verified = calculatedHash === step.bemerkungHash;

                return {
                    ...step,
                    bemerkung: localNote,
                    bemerkungHashOffchain: calculatedHash,
                    verified,
                };
            });


            setSteps(stepsWithNotes);
        } catch (err) {
            console.error("Fehler beim Laden der Historie:", err);
            toast.error(`Fehler beim Laden der Historie: ${err.message}`);
        }
    };

    const verifyRemarks = () => {
        let mismatches = [];

        steps.forEach((step, index) => {
            const klartext = step.bemerkung ?? "";
            try {
                const calculatedHash = keccak256(toUtf8Bytes(klartext));
                if (calculatedHash !== step.bemerkungHash) {
                    mismatches.push({ index, step });
                }
            } catch (err) {
                console.warn("Hashing-Fehler bei Schritt", index, err);
                mismatches.push({ index, step, error: err });
            }
        });

        if (mismatches.length === 0) {
            toast.success("Alle Bemerkungen sind verifiziert.");
        } else {
            toast.error(`${mismatches.length} Hash-Abweichung(en) entdeckt.`);
            console.warn("Abweichungen gefunden:", mismatches);
        }
    };

    return (
        <div className="lot-history">
            <h3>Produktionshistorie</h3>
            <input
                placeholder="Lot-ID"
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
            />
            <button onClick={fetchHistory}>Historie laden</button>

            {steps.length > 0 && (
                <>
                    <table border="1" style={{ marginTop: "1rem" }}>
                        <thead>
                            <tr>
                                <th>Schritt</th>
                                <th>Zeit</th>
                                <th>Bestanden</th>
                                <th>Bemerkung</th>
                                <th>Hash (OnChain)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {steps.map((step, index) => (
                                <tr key={index}>
                                    <td>{step.name}</td>
                                    <td>{step.timestamp}</td>
                                    <td>{step.bestanden ? "✅" : "❌"}</td>
                                    <td>{step.bemerkung}</td>
                                    <td style={{ fontFamily: "monospace", fontSize: "0.8em" }}>
                                        {step.bemerkungHash}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ marginTop: "1rem" }}>
                        <AuditReportButton lotId={lotId} steps={steps} />
                    </div>

                    {["Admin", "Qualitätssicherung"].includes(role) && (
                        <div style={{ marginTop: "1rem" }}>
                            <button onClick={verifyRemarks}>Bemerkung verifizieren</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default LotHistory;
