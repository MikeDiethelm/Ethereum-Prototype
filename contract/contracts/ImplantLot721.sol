// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ImplantLot721 is ERC721URIStorage, AccessControl {
    /* ---------- Rollen ---------- */
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant QC_ROLE = keccak256("QC_ROLE");

    /* ---------- Status & Historie ---------- */
    enum Status {
        InProduktion,
        Ausschuss,
        Abgeschlossen,
        Reparatur
    }

    struct Step {
        string name;
        uint256 timestamp;
        bool bestanden;
        bytes32 bemerkungHash;
    }

    struct TransferRec {
        address from;
        address to;
        uint256 timestamp;
    }

    struct LotData {
        Status status;
        Step[] history;
        TransferRec[] transfers;
    }

    mapping(uint256 => LotData) private _lotInfo;

    /* ---------- Events ---------- */
    event LotRejected(uint256 indexed lotId, address indexed qc, string note);
    event LotReturned(uint256 indexed lotId, address indexed qc, string note);

    /* ---------- Konstruktor ---------- */
    constructor(address admin) ERC721("ImplantProductionNFT", "IPNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANUFACTURER_ROLE, admin);
        _grantRole(QC_ROLE, admin);
    }

    /* ---------- Mint ---------- */
    function safeMint(
        address to,
        uint256 id,
        string calldata uri
    ) external onlyRole(MANUFACTURER_ROLE) {
        _safeMint(to, id);
        _setTokenURI(id, uri);

        LotData storage lot = _lotInfo[id];
        lot.status = Status.InProduktion;
        lot.transfers.push(
            TransferRec({from: address(0), to: to, timestamp: block.timestamp})
        );
    }

    function transferByRole(address to, uint256 tokenId) external {
        address from = ownerOf(tokenId);

        require(
            _lotInfo[tokenId].status == Status.Abgeschlossen,
            "Transfer nur nach QS-Freigabe"
        );

        require(
            isApprovedOrOwner(msg.sender, tokenId) ||
                hasRole(QC_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Nicht berechtigt, Transfer auszufuehren"
        );

        _safeTransfer(from, to, tokenId, "");
    }

    /* ---------- Produktionsschritt ---------- */
    function addStep(
        uint256 id,
        string calldata n,
        bool ok,
        string calldata note
    ) external onlyRole(MANUFACTURER_ROLE) {
        LotData storage lot = _lotInfo[id];
        require(
            lot.status == Status.InProduktion || lot.status == Status.Reparatur,
            "Lot locked"
        );

        bytes32 noteHash = keccak256(abi.encodePacked(note));

        lot.history.push(
            Step({
                name: n,
                timestamp: block.timestamp,
                bestanden: ok,
                bemerkungHash: noteHash
            })
        );

        if (!ok) {
            lot.status = Status.Ausschuss;
        }
    }

    /* ---------- QS-Freigabe ---------- */
    function closeLot(uint256 id) external onlyRole(QC_ROLE) {
        LotData storage lot = _lotInfo[id];

        require(
            lot.status == Status.InProduktion || lot.status == Status.Reparatur,
            "Wrong state"
        );

        // Wenn vorher "Zurueck an Hersteller", muss ein neuer Schritt erfolgt sein
        if (lot.status == Status.Reparatur) {
            require(lot.history.length >= 2, "Nicht genug Historie");

            Step memory lastStep = lot.history[lot.history.length - 1];
            Step memory secondLastStep = lot.history[lot.history.length - 2];

            // Sicherstellen, dass ein neuer Schritt nach Rückversand existiert
            require(
                keccak256(bytes(secondLastStep.name)) ==
                    keccak256("Zurueck an Hersteller") &&
                    keccak256(bytes(lastStep.name)) !=
                    keccak256("Zurueck an Hersteller"),
                "Kein neuer Schritt nach Rueckversand"
            );
        }

        lot.status = Status.Abgeschlossen;
    }

    /* ---------- QS-Ablehnung ---------- */
    function rejectLot(
        uint256 id,
        string calldata note
    ) external onlyRole(QC_ROLE) {
        LotData storage lot = _lotInfo[id];
        require(
            lot.status == Status.InProduktion || lot.status == Status.Reparatur,
            "Wrong state"
        );

        bytes32 noteHash = keccak256(abi.encodePacked(note));

        lot.history.push(
            Step({
                name: "QS-Ablehnung",
                timestamp: block.timestamp,
                bestanden: false,
                bemerkungHash: noteHash
            })
        );
        lot.status = Status.Ausschuss;

        emit LotRejected(id, _msgSender(), note);
    }

    /* ---------- Zurück an Hersteller ---------- */
    function returnToManufacturer(
        uint256 id,
        string calldata note
    ) external onlyRole(QC_ROLE) {
        LotData storage lot = _lotInfo[id];
        require(
            lot.status == Status.InProduktion || lot.status == Status.Reparatur,
            "Wrong state"
        );

        bytes32 noteHash = keccak256(abi.encodePacked(note));

        lot.history.push(
            Step({
                name: "Zurueck an Hersteller",
                timestamp: block.timestamp,
                bestanden: false,
                bemerkungHash: noteHash
            })
        );
        lot.status = Status.Reparatur;

        emit LotReturned(id, _msgSender(), note);
    }

    /* ---------- Erweiterte Zugriffsprüfung ---------- */
    function isApprovedOrOwner(
        address spender,
        uint256 tokenId
    ) public view returns (bool) {
        address owner = _ownerOf(tokenId);
        return (spender == owner ||
            getApproved(tokenId) == spender ||
            isApprovedForAll(owner, spender) ||
            hasRole(QC_ROLE, spender));
    }

    /* ---------- Transfer-Hook ---------- */
    function _update(
        address to,
        uint256 id,
        address auth
    ) internal override(ERC721) returns (address from) {
        address ownerBefore = _ownerOf(id);
        if (ownerBefore != address(0) && to != address(0)) {
            require(
                _lotInfo[id].status == Status.Abgeschlossen,
                "Transfer nur nach QS-Freigabe"
            );
            require(
                isApprovedOrOwner(auth, id) ||
                    hasRole(QC_ROLE, auth) ||
                    hasRole(DEFAULT_ADMIN_ROLE, auth),
                "Nicht berechtigt, Transfer auszufuehren"
            );
        }

        from = super._update(to, id, auth);

        if (from != address(0)) {
            _lotInfo[id].transfers.push(
                TransferRec({from: from, to: to, timestamp: block.timestamp})
            );
        }
    }

    /* ---------- Read ---------- */
    function getStatus(uint256 id) external view returns (Status) {
        return _lotInfo[id].status;
    }

    function getSteps(uint256 id) external view returns (Step[] memory) {
        return _lotInfo[id].history;
    }

    function getTransfers(
        uint256 id
    ) external view returns (TransferRec[] memory) {
        return _lotInfo[id].transfers;
    }

    /* ---------- ERC-165 ---------- */
    function supportsInterface(
        bytes4 i
    ) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(i);
    }
}
