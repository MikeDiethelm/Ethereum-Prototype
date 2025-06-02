import { NFTStorage, File } from "nft.storage";
import { NFT_STORAGE_API_KEY } from "./constants";
console.log("NFT_STORAGE_API_KEY:", NFT_STORAGE_API_KEY);


export const uploadToIPFS = async (name, description, imageFile) => {
    if (!NFT_STORAGE_API_KEY) {
        throw new Error("NFT_STORAGE_API_KEY ist nicht gesetzt!");
    }

    const client = new NFTStorage({ token: NFT_STORAGE_API_KEY });

    const metadata = await client.store({
        name,
        description,
        image: new File([imageFile], imageFile.name, { type: imageFile.type }),
    });

    return metadata.url; // z. B. ipfs://bafy... -> vom Contract als URI verwenden
};
