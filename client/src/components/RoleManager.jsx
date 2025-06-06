import React, { useState } from "react";
import { grantRole } from "../utils/contractService";
import { toast } from "react-toastify";

/* ---------- feste Rollenliste ---------- */
const ROLES = [
    { label: "Admin", value: "DEFAULT_ADMIN_ROLE" },
    { label: "Manufacturer", value: "MANUFACTURER_ROLE" },
    { label: "Qualitätssicherung", value: "QC_ROLE" },
];

function RoleManager() {
    const [role, setRole] = useState(ROLES[1].value);
    const [target, setTarget] = useState("");

    const handleGrant = async () => {
        try {
            await grantRole(role, target);
            toast.success(`Rolle '${role}' an ${target} vergeben`);
        } catch (err) {
            toast.error("Fehler: " + err.message);
        }
    };

    return (
        <div className="role-manager">
            <h3>Rollenvergabe</h3>

            <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                ))}
            </select>

            <input
                placeholder="Zieladresse (0x...)"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
            />

            <button onClick={handleGrant} disabled={!target}>
                Rolle vergeben
            </button>
        </div>
    );
}

export default RoleManager;
