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
        string bemerkung;
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

        lot.history.push(
            Step({
                name: n,
                timestamp: block.timestamp,
                bestanden: ok,
                bemerkung: note
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

        lot.history.push(
            Step({
                name: "QS-Ablehnung",
                timestamp: block.timestamp,
                bestanden: false,
                bemerkung: note
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

        lot.history.push(
            Step({
                name: "Zurueck an Hersteller",
                timestamp: block.timestamp,
                bestanden: false,
                bemerkung: note
            })
        );
        lot.status = Status.Reparatur;

        emit LotReturned(id, _msgSender(), note);
    }

    /* ---------- Transfer-Hook ---------- */
    function _update(
        address to,
        uint256 id,
        address auth
    ) internal override(ERC721) returns (address from) {
        // Vor dem Transfer QS-Freigabe prüfen
        address ownerBefore = _ownerOf(id);
        if (ownerBefore != address(0) && to != address(0)) {
            require(
                _lotInfo[id].status == Status.Abgeschlossen,
                "Transfer nur nach QS-Freigabe"
            );
        }

        // Standard-Update ausführen
        from = super._update(to, id, auth);

        // Nach Transfer loggen
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
