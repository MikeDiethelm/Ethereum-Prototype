/* test/ImplantLot721.test.ts
   --------------------------------------------------------------
   Unit-Tests für ImplantLot721
   -------------------------------------------------------------- */

import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("ImplantLot721", () => {
  /* ---------- gemeinsame Fixture ---------- */
  async function deployFixture() {
    const [admin, manufacturer, qc, distributor, stranger] =
      await ethers.getSigners();

    const Fac = await ethers.getContractFactory("ImplantLot721");
    const nft = await Fac.deploy(admin.address);
    await nft.waitForDeployment();

    await nft.connect(admin)
      .grantRole(await nft.MANUFACTURER_ROLE(), manufacturer.address);
    await nft.connect(admin)
      .grantRole(await nft.QC_ROLE(), qc.address);

    return { nft, admin, manufacturer, qc, distributor, stranger };
  }

  /* ---------- 1 Happy Path ---------- */
  it("Mint ➜ 2 Steps ➜ QS-Close ➜ Transfer (Happy Path)", async () => {
    const { nft, manufacturer, qc, distributor } = await loadFixture(deployFixture);

    /* 1 Mint */
    await nft.connect(manufacturer)
      .safeMint(manufacturer.address, 1001, "ipfs://cid/lot.json");

    /* 2 zwei erfolgreiche Steps */
    await nft.connect(manufacturer).addStep(1001, "t1", true, "note-1");
    await nft.connect(manufacturer).addStep(1001, "t2", true, "note-2");

    /* 3 QS-Freigabe */
    await nft.connect(qc).closeLot(1001);

    /* 4 Transfer durch Owner */
    await nft.connect(manufacturer)
    ["safeTransferFrom(address,address,uint256)"](
      manufacturer.address, distributor.address, 1001);

    /* 5 Audit-Trail prüfen */
    const transfers = await nft.getTransfers(1001);
    expect(transfers.length).to.equal(2);
    expect(transfers[1].from).to.equal(manufacturer.address);
    expect(transfers[1].to).to.equal(distributor.address);
  });

  /* ---------- 2 Transfer vor Freigabe blockiert ---------- */
  it("verhindert Transfer vor QS-Freigabe", async () => {
    const { nft, manufacturer, distributor } = await loadFixture(deployFixture);

    await nft.connect(manufacturer)
      .safeMint(manufacturer.address, 2000, "ipfs://x");

    await expect(
      nft.connect(manufacturer)
      ["safeTransferFrom(address,address,uint256)"](
        manufacturer.address, distributor.address, 2000)
    ).to.be.revertedWith("Transfer nur nach QS-Freigabe");
  });

  /* ---------- 3 Access-Control ---------- */
  it("blockiert nicht autorisierte Aufrufe", async () => {
    const { nft, stranger } = await loadFixture(deployFixture);

    await expect(
      nft.connect(stranger).safeMint(stranger.address, 3000, "ipfs://x")
    ).to.be.revertedWithCustomError(nft, "AccessControlUnauthorizedAccount");
  });

  /* ---------- 4 Ausschuss wenn Step fehlschlägt ---------- */
  it("setzt Status Ausschuss bei fehlgeschlagenem Step", async () => {
    const { nft, manufacturer } = await loadFixture(deployFixture);

    await nft.connect(manufacturer).safeMint(manufacturer.address, 4000, "ipfs://x");
    await nft.connect(manufacturer).addStep(4000, "fail", false, "overspec");

    expect(await nft.getStatus(4000)).to.equal(1 /* Ausschuss */);
  });

  /* ---------- 5 Rückversand → neuer Step erforderlich ---------- */
  it("erfordert Reparatur-Step vor endgültigem QS-Abschluss", async () => {
    const { nft, manufacturer, qc } = await loadFixture(deployFixture);

    await nft.connect(manufacturer).safeMint(manufacturer, 5000, "ipfs://x");
    await nft.connect(qc).returnToManufacturer(5000, "kaputt");
    expect(await nft.getStatus(5000)).to.equal(3 /* Reparatur */);

    /* neuer Step nach Reparatur */
    await nft.connect(manufacturer).addStep(5000, "rework", true, "fixed");
    await nft.connect(qc).closeLot(5000);

    expect(await nft.getStatus(5000)).to.equal(2 /* Abgeschlossen */);
  });

  /* ---------- 6 kein addStep nach endgültigem Abschluss ---------- */
  it("verhindert addStep nach Abschluss", async () => {
    const { nft, manufacturer, qc } = await loadFixture(deployFixture);

    await nft.connect(manufacturer).safeMint(manufacturer, 6000, "ipfs://x");
    await nft.connect(qc).closeLot(6000);

    await expect(
      nft.connect(manufacturer).addStep(6000, "late", true, "")
    ).to.be.revertedWith("Lot locked");
  });

  /* 7 Unerlaubter QC-Transfer ohne Approval -------------------------------- */
  it("QC-Transfer ohne Approval revertiert", async () => {
    const { nft, manufacturer, qc } = await loadFixture(deployFixture);
    await nft.connect(manufacturer).safeMint(manufacturer, 7000, "ipfs://x");
    await nft.connect(qc).closeLot(7000);                 // freigeben

    await expect(
      nft.connect(qc)["safeTransferFrom(address,address,uint256)"](
        manufacturer.address, qc.address, 7000)
    ).to.be.revertedWithCustomError(nft, "ERC721InsufficientApproval");
  });
  /* 8 Owner approved → QC darf transferieren ------------------------------- */
  it("QC darf nach Approval durch Owner transferieren", async () => {
    const { nft, manufacturer, qc } = await loadFixture(deployFixture);
    await nft.connect(manufacturer).safeMint(manufacturer, 7100, "ipfs://x");
    await nft.connect(qc).closeLot(7100);

    await nft.connect(manufacturer)
      .setApprovalForAll(qc.address, true);               // oder approve(…)

    await nft.connect(qc)["safeTransferFrom(address,address,uint256)"](
      manufacturer.address, qc.address, 7100);

    expect(await nft.ownerOf(7100)).to.equal(qc.address);
  });
});
