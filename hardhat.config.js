require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    purechain: {
      url: "http://43.200.53.250:8548",
      chainId: 900520900520,
      accounts: [
        "349a7978d8e29fa3dd929b3b8800649cda550148ecd5fafed00fb7a25d4d306d"
      ]
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};