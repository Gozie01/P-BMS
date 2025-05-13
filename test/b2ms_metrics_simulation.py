# b2ms_metrics_simulation.py
import time
import csv
import json
import matplotlib.pyplot as plt
import pandas as pd
from web3 import Web3
from statistics import mean, stdev

# === Configuration ===
RPC_URL = "http://43.200.53.250:8548"
PRIVATE_KEY = "0x349a7978d8e29fa3dd929b3b8800649cda550148ecd5fafed00fb7a25d4d306d"
ACCOUNT_ADDRESS = "0xb1A9863558dA00Cc94Bf89ce6c0FB5e74F400771"
CONTRACT_ADDRESS = "0x6d12d28A5A27cf4Fa1862F933f410e80896aC939"
ABI_PATH = "../artifacts/contracts/Match.sol/BloodMatching.json"

# === Web3 Setup ===
w3 = Web3(Web3.HTTPProvider(RPC_URL))
with open(ABI_PATH) as f:
    artifact = json.load(f)
    abi = artifact["abi"]

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)

# === Metric Containers ===
metrics = []

# === Utilities ===
def send_txn(fn, *args):
    nonce = w3.eth.get_transaction_count(ACCOUNT_ADDRESS)
    txn = fn(*args).build_transaction({
        'from': ACCOUNT_ADDRESS,
        'nonce': nonce,
        'gas': 3000000,
        'gasPrice': 0
    })
    signed = w3.eth.account.sign_transaction(txn, private_key=PRIVATE_KEY)
    start = time.time()
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    end = time.time()
    return receipt.gasUsed, end - start, receipt.status

# === Metric Simulation ===
def simulate(n_donations=1000, n_matches=500):
    global total_time_start
    total_time_start = time.time()
    for i in range(n_donations):
        gas, latency, status = send_txn(contract.functions.updateDonation, i % 8)
        metrics.append({"Type": "Donation", "GasUsed": gas, "LatencySec": round(latency, 3), "Status": status})
        print(f"Donation {i+1}: Gas={gas}, Latency={latency:.2f}s, Status={status}")

    for j in range(n_matches):
        gas, latency, status = send_txn(contract.functions.compareBlood, j % 8)
        metrics.append({"Type": "Match", "GasUsed": gas, "LatencySec": round(latency, 3), "Status": status})
        print(f"Matching {j+1}: Gas={gas}, Latency={latency:.2f}s, Status={status}")
    global total_time_end
    total_time_end = time.time()

# === Output and Summary ===
def summarize_metrics():
    df = pd.DataFrame(metrics)
    total_txns = len(df)
    total_duration = total_time_end - total_time_start
    tps = round(total_txns / total_duration, 2)

    print("\n--- Summary ---")
    print(df.groupby("Type")["GasUsed"].mean().round(0))
    print("Latency (s):")
    print("  Avg:", round(df["LatencySec"].mean(), 2))
    print("  Std Dev:", round(df["LatencySec"].std(), 2))
    print(f"Total Time: {total_duration:.2f} seconds for {total_txns} transactions")
    print(f"Throughput (TPS): {tps}")

    df.to_csv("b2ms_metrics.csv", index=False)
    print("Metrics exported to b2ms_metrics.csv")

    # === Plots ===
    # Gas Boxplot
    plt.figure(figsize=(6, 4))
    df.boxplot(column="GasUsed", by="Type")
    plt.title("Gas Used by Transaction Type")
    plt.suptitle("")
    plt.xlabel("Type")
    plt.ylabel("Gas Units")
    plt.tight_layout()
    plt.savefig("gas_usage_boxplot.png")
    plt.show()

    # Latency Line Plot
    plt.figure(figsize=(8, 4))
    df[df["Type"] == "Donation"]["LatencySec"].reset_index(drop=True).plot(label="Donation", marker="o")
    df[df["Type"] == "Match"]["LatencySec"].reset_index(drop=True).plot(label="Match", marker="s")
    plt.title("Transaction Latency by Type")
    plt.xlabel("Transaction Index")
    plt.ylabel("Latency (seconds)")
    plt.legend()
    plt.tight_layout()
    plt.grid(True)
    plt.savefig("latency_line_plot.png")
    plt.show()

    # Latency Boxplot
    plt.figure(figsize=(6, 4))
    df.boxplot(column="LatencySec", by="Type")
    plt.title("Latency by Transaction Type")
    plt.suptitle("")
    plt.xlabel("Type")
    plt.ylabel("Latency (s)")
    plt.tight_layout()
    plt.savefig("latency_boxplot.png")
    plt.show()

    # TPS Bar Chart
    plt.figure(figsize=(5, 3))
    plt.bar(["TPS"], [tps], color="skyblue")
    plt.title("Transactions Per Second")
    plt.ylabel("TPS")
    plt.ylim(0, max(10, tps + 1))
    plt.grid(True, axis='y')
    plt.tight_layout()
    plt.savefig("tps_bar_chart.png")
    plt.show()

# === Run Everything ===
if __name__ == "__main__":
    simulate(n_donations=1000, n_matches=500)
    summarize_metrics()
