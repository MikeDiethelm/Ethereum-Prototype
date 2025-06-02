/* test/ImplantLot721.test.ts
   --------------------------------------------------------------
   Unit-Tests für den ImplantLot721-Smart-Contract
   – decken den gesamten Happy Path + wichtige Fehlerfälle ab
   -------------------------------------------------------------- */

import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("ImplantLot721", () => {
  /** Fixture erzeugt frischen State für jeden Test-Case */
  async function deployFixture() {
    const [admin, manufacturer, qc, distributor, stranger] =
      await ethers.getSigners();

    // Contract deployen (Admin-Adresse im Konstruktor)
    const Fac = await ethers.getContractFactory("ImplantLot721");
    const nft = await Fac.deploy(admin.address);
    await nft.waitForDeployment();

    // Rollen vergeben
    await nft
      .connect(admin)
      .grantRole(await nft.MANUFACTURER_ROLE(), manufacturer.address);
    await nft
      .connect(admin)
      .grantRole(await nft.QC_ROLE(), qc.address);

    return { nft, admin, manufacturer, qc, distributor, stranger };
  }

  /* ---------------------------------------------------------- */

  it("Mint ➜ QS ➜ Transfer – Happy Path", async () => {
    const { nft, manufacturer, qc, distributor } = await loadFixture(
      deployFixture
    );

    // 1️⃣ Mint
    await nft
      .connect(manufacturer)
      .safeMint(manufacturer.address, 1001, "ipfs://cid/lot.json");
    expect(await nft.ownerOf(1001)).to.equal(manufacturer.address);

    // 2️⃣ Produktions-Step
    await nft
      .connect(manufacturer)
      .addStep(1001, "Tiefziehen", true, "OK");
    expect((await nft.getSteps(1001)).length).to.equal(1);

    // 3️⃣ QS-Freigabe
    await nft.connect(qc).closeLot(1001);
    expect(await nft.getStatus(1001)).to.equal(2); // Abgeschlossen

    // 4️⃣ Transfer
    await nft
      .connect(manufacturer)
    ["safeTransferFrom(address,address,uint256)"](
      manufacturer.address,
      distributor.address,
      1001
    );
    expect(await nft.ownerOf(1001)).to.equal(distributor.address);

    // 5️⃣ Audit-Trail
    const transfers = await nft.getTransfers(1001);
    expect(transfers.length).to.equal(2); // Mint + Weitergabe
    expect(transfers[1].from).to.equal(manufacturer.address);
    expect(transfers[1].to).to.equal(distributor.address);
  });

  /* ---------------------------------------------------------- */

  it("verhindert Transfer vor QS-Freigabe", async () => {
    const { nft, manufacturer, distributor } = await loadFixture(
      deployFixture
    );

    await nft
      .connect(manufacturer)
      .safeMint(manufacturer.address, 2000, "ipfs://x");

    await expect(
      nft
        .connect(manufacturer)
      ["safeTransferFrom(address,address,uint256)"](
        manufacturer.address,
        distributor.address,
        2000
      )
    ).to.be.revertedWith("Transfer nur nach QS-Freigabe");
  });

  /* ---------------------------------------------------------- */

  it("blockiert nicht autorisierte Aufrufe (AccessControl)", async () => {
    const { nft, stranger } = await loadFixture(deployFixture);

    await expect(
      nft.connect(stranger).safeMint(stranger.address, 3000, "ipfs://x")
    ).to.be.revertedWithCustomError(
      nft,
      "AccessControlUnauthorizedAccount"
    );

    // DEFAULT_ADMIN_ROLE prüfen
    const defaultAdmin = await nft.DEFAULT_ADMIN_ROLE();
    expect(
      await nft.hasRole(defaultAdmin, stranger.address)
    ).to.equal(false);
  });

  /* ---------------------------------------------------------- */

  it("wechselt in Status ‚Ausschuss‘ wenn Produktions-Step fehlschlägt", async () => {
    const { nft, manufacturer } = await loadFixture(deployFixture);

    await nft
      .connect(manufacturer)
      .safeMint(manufacturer.address, 4000, "ipfs://x");

    await nft
      .connect(manufacturer)
      .addStep(4000, "Vermessen", false, "Toleranz überschritten");

    expect(await nft.getStatus(4000)).to.equal(1); // Ausschuss
  });
  /* ---------------------------------------------------------- */
  it("verhindert Transfer im Status Ausschuss", async () => {
    const { nft, manufacturer, distributor } = await loadFixture(deployFixture);

    // Ausschuss-Los anlegen
    await nft.connect(manufacturer).safeMint(manufacturer, 6000, "ipfs://x");
    await nft.connect(manufacturer).addStep(6000, "Kontrolle", false, "Fehler");

    // QS darf nicht mehr freigeben
    await expect(nft.closeLot(6000)).to.be.revertedWith("Wrong state");

    // Transfer blockiert
    await expect(
      nft.connect(manufacturer)
      ["safeTransferFrom(address,address,uint256)"](manufacturer, distributor, 6000)
    ).to.be.revertedWith("Transfer nur nach QS-Freigabe");
  });
  /* ---------------------------------------------------------- */
  it("verhindert addStep sobald Lot abgeschlossen ist", async () => {
    const { nft, manufacturer, qc } = await loadFixture(deployFixture);

    await nft.connect(manufacturer).safeMint(manufacturer, 7000, "ipfs://x");
    await nft.connect(qc).closeLot(7000);                       // Status = Abgeschlossen

    await expect(
      nft.connect(manufacturer).addStep(7000, "Nacharbeit", true, "")
    ).to.be.revertedWith("Lot locked");
  });
});
