import React, { useState } from "react";
import { getTransfers } from "../utils/contractService";
import { toast } from "react-toastify";

function TransferHistory() {
    const [lotId, setLotId] = useState("");
    const [transfers, setTransfers] = useState([]);

    const fetchTransfers = async () => {
        try {
            const result = await getTransfers(lotId);
            setTransfers(result);
        } catch (err) {
            toast.error("Fehler beim Laden der Transfers.");
        }
    };

    return (
        <div className="transfer-history">
            <h3>Transferhistorie</h3>
            <input
                placeholder="Lot-ID"
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
            />
            <button onClick={fetchTransfers}>Transfers laden</button>

            {transfers.length > 0 && (
                <table border="1" style={{ marginTop: "1rem" }}>
                    <thead>
                        <tr>
                            <th>Von</th>
                            <th>Nach</th>
                            <th>Zeit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfers.map((t, index) => (
                            <tr key={index}>
                                <td>{t.from}</td>
                                <td>{t.to}</td>
                                <td>{t.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default TransferHistory;
