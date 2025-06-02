import React, { useState } from "react";
import { fetchNFTMetadata, getTokenURI } from "../utils/contractService";
import { toast } from "react-toastify";

function NFTPreview() {
    const [uri, setUri] = useState("");
    const [meta, setMeta] = useState(null);
    const [tokenId, setTokenId] = useState("");

    const fetchMetadata = async () => {
        try {
            const data = await fetchNFTMetadata(uri);
            setMeta(data);
        } catch (err) {
            toast.error("Fehler beim Laden der Metadaten.");
        }
    };

    const fetchFromTokenId = async () => {
        try {
            const fetchedUri = await getTokenURI(tokenId);
            const data = await fetchNFTMetadata(fetchedUri);
            setMeta(data);
            setUri(fetchedUri); // optional anzeigen
        } catch (err) {
            toast.error("Fehler beim Laden über Token ID.");
        }
    };

    return (
        <div className="nft-preview">
            <h3>NFT Metadaten anzeigen</h3>

            <input
                placeholder="Token URI (z. B. https://ipfs...)"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
            />
            <button onClick={fetchMetadata}>Anzeigen</button>

            <div style={{ marginTop: "1rem" }}>
                <input
                    placeholder="Token ID"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                />
                <button onClick={fetchFromTokenId}>
                    Per Token ID anzeigen
                </button>
            </div>

            {meta && (
                <div style={{ marginTop: "1rem" }}>
                    <p><strong>Name:</strong> {meta.name}</p>
                    <p><strong>Beschreibung:</strong> {meta.description}</p>
                    {meta.image && (
                        <img src={meta.image} alt="NFT" style={{ maxWidth: "200px" }} />
                    )}
                </div>
            )}
        </div>
    );
}

export default NFTPreview;
