import React, { useState } from "react";
import { getSteps } from "../utils/contractService";
import { toast } from "react-toastify";

function LotHistory() {
    const [lotId, setLotId] = useState("");
    const [steps, setSteps] = useState([]);

    const fetchHistory = async () => {
        try {
            const result = await getSteps(lotId);
            setSteps(result);
        } catch (err) {
            console.error("Fehler beim Laden der Historie:", err);
            toast.error(`Fehler beim Laden der Historie: ${err.message}`);
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
                <table border="1" style={{ marginTop: "1rem" }}>
                    <thead>
                        <tr>
                            <th>Schritt</th>
                            <th>Zeit</th>
                            <th>Bestanden</th>
                            <th>Bemerkung</th>
                        </tr>
                    </thead>
                    <tbody>
                        {steps.map((step, index) => (
                            <tr key={index}>
                                <td>{step.name}</td>
                                <td>{step.timestamp}</td>
                                <td>{step.bestanden ? "✅" : "❌"}</td>
                                <td>{step.bemerkung}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default LotHistory;
