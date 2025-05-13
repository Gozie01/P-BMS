# P-BMS: Blockchain-Based Blood Matching System

P-BMS is a decentralized smart contract solution for managing blood donations and matching processes on the blockchain. It automates donor registration, secure blood type matching, FIFO-based queue management, intelligent expiration handling, and real-time inventory tracking while ensuring transparency, security, and privacy.

---

## 🚀 Features

* **Donor Registration:** Secure, blockchain-logged donor identity with address verification.
* **Unique Blood Bag Tracking:** Hash-based code using timestamp and serial number.
* **FIFO Queue Management:** Matches blood bags based on entry order and compatibility.
* **Expiration Handling:** Automatically removes expired blood units.
* **Tamper-Proof Matching:** Only compatible blood types are matched using smart contract logic.
* **Gas-Optimized Donation Logic:** Donation operations use minimal gas.
* **IPFS Integration (Future Work):** Supports decentralized file storage for large data.
* **Built on PureChain:** Zero gas-fee blockchain optimized for medical IoT.

---

## 📊 Performance Metrics

From a test simulation of 1500 transactions (1000 donations and 500 matches):

* ✅ **Success Rate:** 100%
* ⚡ **Average Latency:** 1.76 seconds
* 📉 **Latency Jitter:** 0.54 seconds
* ⛽ **Avg. Gas (Donation):** 124,927 units
* 🔥 **Avg. Gas (Match):** 3,000,000 units
* 📈 **Throughput (TPS):** 0.57 transactions/second

---

## 🔧 Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/p-bms.git
cd p-bms
```

2. Install dependencies:

```bash
npm install
```

3. Compile the contract:

```bash
npx hardhat compile
```

4. Deploy to PureChain:

```bash
npx hardhat run scripts/deploy.js --network purechain
```

---

## 📂 Project Structure

```
contracts/
  └── BloodMatching.sol      # Main smart contract
scripts/
  └── deploy.js              # Deployment script
  └── simulate.js          # simulation script
artifacts/                   # Compiled output
test/                     # Exported CSVs and plots
  └── simulate.js
```

---

## 📁 Sample Output Files

* `b2ms_metrics.csv` – Logs of gas usage, latency
* `gas_usage_boxplot.png`, `latency_line_plot.png`, `tps_bar_chart.png` – Performance visuals

---

## 🔒 Privacy and Security

* Donor identity hidden (no plaintext names)
* Blood types hashed and tracked via code
* Immutable and auditable blockchain history

---

## 🔮 Future Work

* IPFS-based off-chain data storage
* Mobile app integration for field agents and hospitals
* Machine Learning-based demand forecasting

---

## 🧠 License

MIT License. See `LICENSE` file for details.

---

## 👥 Authors

* Chigozie – Blockchain Developer
* Jonathan, Saviour AND   D-S Kim – Co-author

For academic citations, refer to our [paper](link-to-publication).

---

## 📬 Contact

For contributions, questions, or feedback: 📧 [cnnadiekwe01@gmail.com](mailto:cnnadiekwe01@gmail.com)

# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
