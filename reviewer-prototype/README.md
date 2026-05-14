# Reviewer Prototype

This folder contains an additive reviewer-response prototype for the manuscript revision. It does not replace the original production-oriented contract in `contracts/Match.sol`.

## Contents

- `contracts/BloodMatchingReviewerRevision.sol`: extended smart contract with phenotype-aware matching, consent logging, hemovigilance reporting, and special-case governance logging.
- `scripts/runReviewerPrototype.js`: local demo script that compiles, deploys, exercises the contract, and saves result artifacts.
- `results/reviewer-prototype-results.json`: machine-readable output from the latest demo run.
- `results/reviewer-prototype-results.html`: visual summary of the latest demo run.

## Run

```bash
npm install
npm run demo
```

The demo writes fresh output into the `results/` folder each time it runs.
