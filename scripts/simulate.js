// scripts/simulate.js
const hre = require("hardhat");

async function main() {
  const [donor] = await hre.ethers.getSigners();
  const BloodMatching = await hre.ethers.getContractFactory("BloodMatching");
  const blood = await BloodMatching.attach("0x6d12d28A5A27cf4Fa1862F933f410e80896aC939"); // Replace with deployed address

  // Register donor if not already
  console.log("Registering donor...");
  const tx1 = await blood.registerDonor();
  await tx1.wait();
  console.log("Donor registered:", donor.address);

  // Simulate multiple donations
  console.log("Simulating blood donations...");
  for (let i = 0; i < 10; i++) {
    const bloodType = i % 8; // Cycle through all 8 blood types
    const tx = await blood.updateDonation(bloodType);
    const receipt = await tx.wait();
    console.log(`Donated type ${bloodType} | Tx Gas Used: ${receipt.gasUsed}`);
  }

  // Simulate multiple matching attempts
  console.log("Simulating blood matching...");
  for (let i = 0; i < 5; i++) {
    const recipientType = i % 8;
    const tx = await blood.compareBlood(recipientType);
    const receipt = await tx.wait();
    console.log(`Match attempt for recipient type ${recipientType} | Gas Used: ${receipt.gasUsed}`);
  }

  // View totals
  const total = await blood.viewTotal();
  const bank = await blood.viewBankTotal();
  const spent = await blood.viewTotalSpent();
  console.log(`Total Donated: ${total}`);
  console.log(`Bank Inventory: ${bank}`);
  console.log(`Total Spent: ${spent}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
