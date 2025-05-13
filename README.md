**P-BMS: Blockchain-Based Blood Matching System**

P-BMS is a decentralized smart contract solution for managing blood donations and matching processes on the blockchain. It automates donor registration, secure blood type matching, FIFO-based queue management, intelligent expiration handling, and real-time inventory tracking while ensuring transparency, security, and privacy.

**Features**

Donor Registration: Secure, blockchain-logged donor identity with address verification.

Unique Blood Bag Tracking: Hash-based code using timestamp and serial number.

FIFO Queue Management: Matches blood bags based on entry order and compatibility.

Expiration Handling: Automatically removes expired blood units.

Tamper-Proof Matching: Only compatible blood types are matched using smart contract logic.

Gas-Optimized Donation Logic: Donation operations use minimal gas.

IPFS Integration (Future Work): Supports decentralized file storage for large data.

Built on PureChain: Zero gas-fee blockchain optimized for medical IoT.


**Performance Metrics**

From a test simulation of 1500 transactions (1000 donations and 500 matches):

✅ Success Rate: 100%

⚡ Average Latency: 1.76 seconds

📉 Latency Jitter: 0.54 seconds

⛽ Avg. Gas (Donation): 124,927 units

🔥 Avg. Gas (Match): 3,000,000 units

📈 Throughput (TPS): 0.57 transactions/second



**Installation**

Clone the repository:

git clone https://github.com/yourusername/p-bms.git
cd p-bms

Install dependencies:

npm install

Compile the contract:

npx hardhat compile

Deploy to PureChain:

npx hardhat run scripts/deploy.js --network purechain



**Project Structure**

contracts/
  └── BloodMatching.sol      # Main smart contract
scripts/
  └── deploy.js              # Deployment script
  └── simulate.js          # simulation script
artifacts/                   # Compiled output
test/                     # Exported CSVs and plots
  └── b2ms_metrics_simulation.py  #simuate the process to generate the required metrics


**Sample Output Files**

b2ms_metrics.csv – Logs of gas usage, latency

gas_usage_boxplot.png, latency_line_plot.png, tps_bar_chart.png – Performance visuals


**Privacy and Security**

Donor identity hidden (no plaintext names)

Blood types hashed and tracked via code

Immutable and auditable blockchain history



**Future Work**

IPFS-based off-chain data storage

Mobile app integration for field agents and hospitals

Machine Learning-based demand forecasting



**Authors**

Chigozie – Blockchain Developer

Jonathan and Saviour – Co-author

For academic citations, refer to our paper.


**Contact**  

For contributions, questions, or feedback: 📧 [cnnadiekwe01@gmail.com](mailto:cnnadiekwe01@gmail.com)

