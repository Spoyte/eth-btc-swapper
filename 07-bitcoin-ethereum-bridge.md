# Bitcoin-Ethereum Cross-Chain Swap

## 🎯 Target Prize
**1inch - Non-EVM Extensions for Cross-chain Swap ($12,000)**

## 📝 Project Description
A trustless bridge enabling swaps between Bitcoin and Ethereum using 1inch Fusion+ protocol. Users can swap BTC for ETH (or ERC-20 tokens) directly without wrapping, using atomic swaps with hashlock and timelock mechanisms.

## 🔧 Technical Implementation
- **Core Tech**: 1inch Fusion+ with Bitcoin HTLC
- **Bitcoin Side**: P2SH scripts with hashlocks
- **Ethereum Side**: Fusion+ resolver contracts
- **Features**:
  - Native BTC to ETH swaps
  - Atomic swap guarantees
  - No wrapped tokens needed
  - Integration with 1inch aggregation

## 💡 Why It's Easy to Build
1. HTLC pattern is well-documented
2. Bitcoin script examples available
3. 1inch provides Fusion+ SDK
4. Can start with testnet coins

## 🚀 MVP Features
- Basic BTC-ETH swap flow
- Hashlock/timelock implementation
- Simple web interface
- Testnet demonstration

## 📦 Required Tools
- 1inch Fusion+ SDK
- Bitcoin Core/bitcoinjs-lib
- Solidity for Ethereum contracts
- Next.js frontend

## ⏱️ Time Estimate
- Bitcoin Scripts: 8-10 hours
- Ethereum Contracts: 6-8 hours
- Integration: 6-8 hours
- **Total**: 20-26 hours 