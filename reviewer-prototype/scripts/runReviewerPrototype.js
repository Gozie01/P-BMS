const fs = require("fs");
const path = require("path");
const solc = require("solc");
const ganache = require("ganache");
const { ethers } = require("ethers");

const CONTRACT_NAME = "BloodMatchingReviewerRevision";
const CONTRACT_FILE = "BloodMatchingReviewerRevision.sol";
const RESULTS_DIR = path.join(__dirname, "..", "results");

function hashText(value) {
  return ethers.keccak256(ethers.toUtf8Bytes(value));
}

function compileContract() {
  const contractPath = path.join(__dirname, "..", "contracts", CONTRACT_FILE);
  const source = fs.readFileSync(contractPath, "utf8");
  const input = {
    language: "Solidity",
    sources: {
      [CONTRACT_FILE]: {
        content: source,
      },
    },
    settings: {
      evmVersion: "paris",
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((entry) => entry.severity === "error");
  if (errors.length > 0) {
    throw new Error(errors.map((entry) => entry.formattedMessage).join("\n"));
  }

  const artifact = output.contracts[CONTRACT_FILE][CONTRACT_NAME];
  return {
    abi: artifact.abi,
    bytecode: artifact.evm.bytecode.object,
  };
}

function buildHtmlReport(results) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reviewer Prototype Results</title>
  <style>
    :root {
      --bg: #f5efe4;
      --panel: rgba(255, 252, 247, 0.9);
      --ink: #1e2430;
      --muted: #5d6778;
      --line: rgba(30, 36, 48, 0.12);
      --accent: #0d8a72;
      --accent-2: #d96c3f;
      --accent-3: #2b5fb3;
      --good: #1f8f52;
      --warn: #bf5f2f;
      --hero: linear-gradient(135deg, rgba(13, 138, 114, 0.18), rgba(217, 108, 63, 0.18));
      --shadow: 0 18px 50px rgba(39, 44, 55, 0.12);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(217, 108, 63, 0.18), transparent 34%),
        radial-gradient(circle at top right, rgba(43, 95, 179, 0.16), transparent 30%),
        linear-gradient(180deg, #f7f1e7 0%, #f4eee3 100%);
    }

    .wrap {
      width: min(1140px, calc(100vw - 32px));
      margin: 32px auto 48px;
    }

    .hero {
      background: var(--hero);
      border: 1px solid var(--line);
      border-radius: 28px;
      padding: 32px;
      box-shadow: var(--shadow);
      overflow: hidden;
      position: relative;
    }

    .hero::after {
      content: "";
      position: absolute;
      width: 280px;
      height: 280px;
      right: -90px;
      top: -120px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.35);
    }

    h1, h2, h3, p {
      margin: 0;
    }

    .eyebrow {
      display: inline-block;
      margin-bottom: 12px;
      padding: 7px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid var(--line);
      color: var(--accent-3);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hero h1 {
      font-size: clamp(2rem, 5vw, 3.7rem);
      line-height: 1.03;
      max-width: 750px;
      margin-bottom: 12px;
    }

    .hero p {
      max-width: 760px;
      color: var(--muted);
      font-size: 1.05rem;
      line-height: 1.6;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-top: 24px;
    }

    .metric,
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 22px;
      box-shadow: var(--shadow);
    }

    .metric {
      padding: 18px 20px;
    }

    .metric .label {
      color: var(--muted);
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    .metric .value {
      font-size: 2rem;
      font-weight: bold;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 18px;
      margin-top: 24px;
    }

    .panel {
      padding: 22px;
    }

    .panel h2 {
      font-size: 1.25rem;
      margin-bottom: 10px;
    }

    .panel .sub {
      color: var(--muted);
      line-height: 1.55;
      margin-bottom: 18px;
    }

    .kv {
      display: grid;
      gap: 10px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: start;
      padding-bottom: 10px;
      border-bottom: 1px dashed var(--line);
    }

    .row:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .k {
      color: var(--muted);
      min-width: 120px;
    }

    .v {
      text-align: right;
      word-break: break-word;
      max-width: 65%;
    }

    .pill {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 0.84rem;
      font-weight: bold;
      border: 1px solid transparent;
    }

    .good {
      background: rgba(31, 143, 82, 0.12);
      color: var(--good);
      border-color: rgba(31, 143, 82, 0.22);
    }

    .warn {
      background: rgba(191, 95, 47, 0.12);
      color: var(--warn);
      border-color: rgba(191, 95, 47, 0.22);
    }

    .accent {
      background: rgba(43, 95, 179, 0.12);
      color: var(--accent-3);
      border-color: rgba(43, 95, 179, 0.22);
    }

    .match-banner {
      margin-top: 18px;
      padding: 18px;
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(13, 138, 114, 0.12), rgba(43, 95, 179, 0.1));
      border: 1px solid var(--line);
    }

    .bags {
      display: grid;
      gap: 12px;
      margin-top: 14px;
    }

    .bag {
      padding: 16px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.66);
      border: 1px solid var(--line);
    }

    code {
      font-family: "Consolas", "Courier New", monospace;
      font-size: 0.85rem;
      background: rgba(30, 36, 48, 0.06);
      padding: 2px 6px;
      border-radius: 6px;
    }

    pre {
      margin: 16px 0 0;
      padding: 16px;
      border-radius: 18px;
      background: #1e2430;
      color: #eef2f7;
      overflow: auto;
      font-size: 0.82rem;
      line-height: 1.5;
    }

    @media (max-width: 700px) {
      .hero,
      .panel,
      .metric {
        border-radius: 20px;
      }

      .row {
        display: block;
      }

      .v {
        max-width: 100%;
        margin-top: 4px;
        text-align: left;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <div class="eyebrow">Reviewer 1 Experimental Support</div>
      <h1>Clinical-extensibility prototype for blockchain blood matching</h1>
      <p>
        This visualization summarizes the prototype run that added phenotype-aware matching,
        donor consent auditability, hemovigilance reporting, and partial support for special-case transfusion governance.
      </p>
      <div class="metrics">
        <div class="metric">
          <div class="label">Total Donations</div>
          <div class="value">${results.summary.totalDonations}</div>
        </div>
        <div class="metric">
          <div class="label">Inventory Before Match</div>
          <div class="value">${results.matching.bankTotalBeforeMatch}</div>
        </div>
        <div class="metric">
          <div class="label">Inventory After Match</div>
          <div class="value">${results.matching.bankTotalAfterMatch}</div>
        </div>
        <div class="metric">
          <div class="label">Hemovigilance Entries</div>
          <div class="value">${results.hemovigilance.reactionCount}</div>
        </div>
      </div>
    </section>

    <section class="grid">
      <article class="panel">
        <h2>Consent and Counselling</h2>
        <p class="sub">Pre-donation governance is captured as an auditable on-chain record.</p>
        <div class="kv">
          <div class="row"><div class="k">Status</div><div class="v"><span class="pill good">${results.consent.exists ? "Recorded" : "Missing"}</span></div></div>
          <div class="row"><div class="k">Counselling</div><div class="v"><span class="pill accent">${results.consent.counsellingAcknowledged ? "Acknowledged" : "Not acknowledged"}</span></div></div>
          <div class="row"><div class="k">Donor Hash</div><div class="v"><code>${results.consent.donorHash}</code></div></div>
          <div class="row"><div class="k">Consent Version</div><div class="v"><code>${results.consent.consentVersionHash}</code></div></div>
          <div class="row"><div class="k">Timestamp</div><div class="v">${results.consent.consentRecordedAt}</div></div>
        </div>
      </article>

      <article class="panel">
        <h2>Phenotype-Aware Matching</h2>
        <p class="sub">The revised matcher selected a compatible unit that also satisfied the requested rare phenotype.</p>
        <div class="kv">
          <div class="row"><div class="k">Recipient Type</div><div class="v">${results.matching.recipientLabel}</div></div>
          <div class="row"><div class="k">Requested Phenotype</div><div class="v"><span class="pill warn">${results.matching.requestedPhenotype}</span></div></div>
          <div class="row"><div class="k">Preview Outcome</div><div class="v">${results.matching.preview.message}</div></div>
          <div class="row"><div class="k">Matched Donor Type</div><div class="v">${results.matching.emittedMatch.donorLabel}</div></div>
          <div class="row"><div class="k">Matched Phenotype</div><div class="v">${results.matching.emittedMatch.phenotype}</div></div>
        </div>
        <div class="match-banner">
          <strong>Key result:</strong> an <strong>${results.matching.recipientLabel}</strong> request with phenotype
          <strong>${results.matching.requestedPhenotype}</strong> matched the donated
          <strong>${results.matching.emittedMatch.donorLabel}</strong> unit instead of the available non-matching phenotype unit.
        </div>
      </article>

      <article class="panel">
        <h2>Hemovigilance Trace</h2>
        <p class="sub">A post-transfusion adverse event was immutably linked to the matched blood unit.</p>
        <div class="kv">
          <div class="row"><div class="k">Reaction Count</div><div class="v">${results.hemovigilance.reactionCount}</div></div>
          <div class="row"><div class="k">Reaction Type</div><div class="v">${results.hemovigilance.latestReaction.reactionType}</div></div>
          <div class="row"><div class="k">Severity</div><div class="v"><span class="pill warn">${results.hemovigilance.latestReaction.severityLabel}</span></div></div>
          <div class="row"><div class="k">Clinician Hash</div><div class="v"><code>${results.hemovigilance.latestReaction.clinicianIdHash}</code></div></div>
          <div class="row"><div class="k">Notes</div><div class="v">${results.hemovigilance.latestReaction.notes}</div></div>
        </div>
      </article>

      <article class="panel">
        <h2>Special-Case Governance</h2>
        <p class="sub">Instead of claiming full crossmatch automation, the prototype logs emergency/manual-review scenarios for traceability.</p>
        <div class="kv">
          <div class="row"><div class="k">Entries</div><div class="v">${results.specialCase.specialCaseCount}</div></div>
          <div class="row"><div class="k">Emergency Override</div><div class="v"><span class="pill ${results.specialCase.latestSpecialCase.emergencyOverride ? "warn" : "accent"}">${results.specialCase.latestSpecialCase.emergencyOverride}</span></div></div>
          <div class="row"><div class="k">Scenario</div><div class="v">${results.specialCase.latestSpecialCase.scenario}</div></div>
          <div class="row"><div class="k">Reviewer Hash</div><div class="v"><code>${results.specialCase.latestSpecialCase.reviewerIdHash}</code></div></div>
        </div>
      </article>
    </section>

    <section class="panel" style="margin-top: 24px;">
      <h2>Donation Snapshot</h2>
      <p class="sub">Both experimental blood units are shown below, including phenotype metadata and post-match availability.</p>
      <div class="bags">
        <div class="bag">
          <strong>Donation 1</strong>
          <div class="kv" style="margin-top: 12px;">
            <div class="row"><div class="k">Blood Type</div><div class="v">${results.donations.firstBag.bloodTypeLabel}</div></div>
            <div class="row"><div class="k">Phenotype</div><div class="v">${results.donations.firstBag.phenotype}</div></div>
            <div class="row"><div class="k">Available After Match</div><div class="v"><span class="pill ${results.donations.firstBag.availableAfterMatching ? "good" : "warn"}">${results.donations.firstBag.availableAfterMatching}</span></div></div>
            <div class="row"><div class="k">Bag Code</div><div class="v"><code>${results.donations.firstBag.code}</code></div></div>
          </div>
        </div>
        <div class="bag">
          <strong>Donation 2</strong>
          <div class="kv" style="margin-top: 12px;">
            <div class="row"><div class="k">Blood Type</div><div class="v">${results.donations.secondBag.bloodTypeLabel}</div></div>
            <div class="row"><div class="k">Phenotype</div><div class="v">${results.donations.secondBag.phenotype}</div></div>
            <div class="row"><div class="k">Available After Match</div><div class="v"><span class="pill ${results.donations.secondBag.availableAfterMatching ? "good" : "warn"}">${results.donations.secondBag.availableAfterMatching}</span></div></div>
            <div class="row"><div class="k">Bag Code</div><div class="v"><code>${results.donations.secondBag.code}</code></div></div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel" style="margin-top: 24px;">
      <h2>Raw JSON</h2>
      <p class="sub">This block mirrors the saved machine-readable output for manuscript tables or appendix material.</p>
      <pre>${JSON.stringify(results, null, 2)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>
    </section>
  </div>
</body>
</html>`;
}

function getEventArgs(receipt, contractInterface, eventName) {
  for (const log of receipt.logs) {
    try {
      const parsed = contractInterface.parseLog(log);
      if (parsed && parsed.name === eventName) {
        return parsed.args;
      }
    } catch (error) {
      // Ignore logs from other contracts or unparsable entries.
    }
  }
  throw new Error(`Event ${eventName} not found in receipt`);
}

async function main() {
  const { abi, bytecode } = compileContract();
  const ganacheProvider = ganache.provider({
    logging: { quiet: true },
    wallet: { totalAccounts: 5 },
    chain: { chainId: 1337 },
  });

  const provider = new ethers.BrowserProvider(ganacheProvider);
  const donorOne = await provider.getSigner(0);
  const donorTwo = await provider.getSigner(1);
  const clinician = await provider.getSigner(2);

  const factory = new ethers.ContractFactory(abi, bytecode, donorOne);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const bloodType = {
    Ap: 0,
    An: 1,
    Bp: 2,
    Bn: 3,
    ABp: 4,
    ABn: 5,
    Op: 6,
    On: 7,
  };
  const bloodTypeLabels = {
    0: "A+",
    1: "A-",
    2: "B+",
    3: "B-",
    4: "AB+",
    5: "AB-",
    6: "O+",
    7: "O-",
  };

  const severity = {
    Low: 0,
    Moderate: 1,
    High: 2,
    Critical: 3,
  };
  const severityLabels = {
    0: "Low",
    1: "Moderate",
    2: "High",
    3: "Critical",
  };

  const commonPhenotype = "K+ Jk(a+)";
  const rarePhenotype = "K- Fy(a-)";

  const donorOneHash = hashText("donor-one");
  const donorTwoHash = hashText("donor-two");
  const consentVersion = hashText("consent-v2.1");
  const clinicianHash = hashText("clinician-17");
  const reviewerHash = hashText("transfusion-board");

  await (await contract.connect(donorOne).registerDonor(donorOneHash)).wait();
  await (await contract.connect(donorOne).recordConsent(consentVersion, true)).wait();

  await (await contract.connect(donorTwo).registerDonor(donorTwoHash)).wait();
  await (await contract.connect(donorTwo).recordConsent(consentVersion, true)).wait();

  const donateOneReceipt = await (
    await contract.connect(donorOne).updateDonationWithPhenotype(bloodType.Ap, commonPhenotype)
  ).wait();
  const donateOneEvent = getEventArgs(donateOneReceipt, contract.interface, "BloodDonated");
  const firstBagCode = donateOneEvent.code;

  const donateTwoReceipt = await (
    await contract.connect(donorTwo).updateDonationWithPhenotype(bloodType.On, rarePhenotype)
  ).wait();
  const donateTwoEvent = getEventArgs(donateTwoReceipt, contract.interface, "BloodDonated");
  const secondBagCode = donateTwoEvent.code;

  const bankTotalBeforeMatch = await contract.viewBankTotal();
  const phenotypePreview = await contract.compareBloodWithPhenotype.staticCall(
    bloodType.Ap,
    rarePhenotype
  );

  const matchReceipt = await (
    await contract.compareBloodWithPhenotype(bloodType.Ap, rarePhenotype)
  ).wait();
  const matchEvent = getEventArgs(matchReceipt, contract.interface, "BloodMatched");
  const matchedCode = matchEvent.code;

  await (
    await contract
      .connect(clinician)
      .reportReaction(
        matchedCode,
        clinicianHash,
        "Febrile non-hemolytic transfusion reaction",
        severity.High,
        "Reaction trace logged for post-transfusion monitoring."
      )
  ).wait();

  await (
    await contract
      .connect(clinician)
      .flagSpecialHandling(
        matchedCode,
        reviewerHash,
        "Emergency release logged for manual transfusion review.",
        true
      )
  ).wait();

  const bankTotalAfterMatch = await contract.viewBankTotal();
  const totalSpent = await contract.viewTotalSpent();
  const consentSnapshot = await contract.viewConsent(await donorOne.getAddress());
  const firstDonation = await contract.viewDonationMetadata(firstBagCode);
  const secondDonation = await contract.viewDonationMetadata(secondBagCode);
  const latestReaction = await contract.viewLatestReaction(matchedCode);
  const reactionCount = await contract.viewReactionCount(matchedCode);
  const specialCaseCount = await contract.viewSpecialCaseCount(matchedCode);
  const latestSpecialCase = await contract.viewLatestSpecialCase(matchedCode);
  const results = {
    contractAddress,
    summary: {
      totalDonations: 2,
      totalSpent: totalSpent.toString(),
    },
    consent: {
      donorHash: consentSnapshot[0],
      consentVersionHash: consentSnapshot[1],
      counsellingAcknowledged: consentSnapshot[2],
      consentRecordedAt: consentSnapshot[3].toString(),
      exists: consentSnapshot[4],
    },
    donations: {
      firstBag: {
        code: firstBagCode,
        bloodType: Number(firstDonation[0]),
        bloodTypeLabel: bloodTypeLabels[Number(firstDonation[0])],
        donatedAt: firstDonation[1].toString(),
        serialNumber: firstDonation[2].toString(),
        phenotype: firstDonation[3],
        donor: firstDonation[4],
        availableAfterMatching: firstDonation[5],
      },
      secondBag: {
        code: secondBagCode,
        bloodType: Number(secondDonation[0]),
        bloodTypeLabel: bloodTypeLabels[Number(secondDonation[0])],
        donatedAt: secondDonation[1].toString(),
        serialNumber: secondDonation[2].toString(),
        phenotype: secondDonation[3],
        donor: secondDonation[4],
        availableAfterMatching: secondDonation[5],
      },
    },
    matching: {
      recipientType: bloodType.Ap,
      recipientLabel: bloodTypeLabels[bloodType.Ap],
      requestedPhenotype: rarePhenotype,
      bankTotalBeforeMatch: bankTotalBeforeMatch.toString(),
      bankTotalAfterMatch: bankTotalAfterMatch.toString(),
      preview: {
        matchedCode: phenotypePreview[0],
        message: phenotypePreview[1],
        phenotype: phenotypePreview[2],
      },
      emittedMatch: {
        recipientType: Number(matchEvent.recipient),
        recipientLabel: bloodTypeLabels[Number(matchEvent.recipient)],
        donorType: Number(matchEvent.donor),
        donorLabel: bloodTypeLabels[Number(matchEvent.donor)],
        matchedCode,
        phenotype: matchEvent.phenotype,
      },
    },
    hemovigilance: {
      reactionCount: reactionCount.toString(),
      latestReaction: {
        clinicianIdHash: latestReaction[0],
        reactionType: latestReaction[1],
        severity: Number(latestReaction[2]),
        severityLabel: severityLabels[Number(latestReaction[2])],
        reportedAt: latestReaction[3].toString(),
        notes: latestReaction[4],
      },
    },
    specialCase: {
      specialCaseCount: specialCaseCount.toString(),
      latestSpecialCase: {
        reviewerIdHash: latestSpecialCase[0],
        scenario: latestSpecialCase[1],
        emergencyOverride: latestSpecialCase[2],
        loggedAt: latestSpecialCase[3].toString(),
      },
    },
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(RESULTS_DIR, "reviewer-prototype-results.json"),
    JSON.stringify(results, null, 2)
  );
  fs.writeFileSync(
    path.join(RESULTS_DIR, "reviewer-prototype-results.html"),
    buildHtmlReport(results)
  );

  console.log("Reviewer prototype deployed at:", contractAddress);
  console.log("Saved JSON:", path.join(RESULTS_DIR, "reviewer-prototype-results.json"));
  console.log("Saved HTML:", path.join(RESULTS_DIR, "reviewer-prototype-results.html"));
  console.log("");
  console.log("Experimental results");
  console.log("--------------------");
  console.log("1. Consent logging");
  console.log(JSON.stringify(results.consent, null, 2));
  console.log("");
  console.log("2. Rare phenotype-aware donation records");
  console.log(JSON.stringify(results.donations, null, 2));
  console.log("");
  console.log("3. Phenotype-aware matching outcome");
  console.log(JSON.stringify(results.matching, null, 2));
  console.log("");
  console.log("4. Hemovigilance trace");
  console.log(JSON.stringify(results.hemovigilance, null, 2));
  console.log("");
  console.log("5. Partial support for special transfusion situations");
  console.log(JSON.stringify(results.specialCase, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
