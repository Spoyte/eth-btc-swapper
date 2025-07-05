# Quick Reference Guide - Bitcoin-Ethereum Cross-Chain Swap

## 🚀 Getting Started

### Installation & Setup
```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Core Dependencies
```javascript
// Smart Contract
const { ethers } = require('ethers');

// Bitcoin
const BitcoinWallet = require('./bitcoin/wallet');
const BitcoinHTLC = require('./bitcoin/htlc');

// Coordinator
const SwapCoordinator = require('./coordinator/SwapCoordinator');
const StateManager = require('./coordinator/StateManager');
```

---

## 📋 Essential API Calls

### 1. Create a Swap
```javascript
const coordinator = new SwapCoordinator(config);

const swapResult = await coordinator.initiateBTCToETHSwap({
  btcAmount: 0.001,                    // BTC to send
  ethAmount: 0.1,                      // ETH to receive
  ethTokenAddress: '0xEee...eE',       // ETH address
  userBtcAddress: 'tb1q...',           // Your BTC address
  userEthAddress: '0x742d...',         // Your ETH address
  lockTime: Date.now() + 86400000      // 24 hours timeout
});

// Returns: { swapId, btcHtlcAddress, secretHash, lockTime, ethQuote }
```

### 2. Check Swap Status
```javascript
const status = await coordinator.getSwapStatus(swapId);
// Returns: { status, btcSide, ethSide, createdAt, expiresAt }
```

### 3. Complete Swap
```javascript
const result = await coordinator.completeBTCToETHSwap(swapId, bitcoinTxId);
// Returns: { swapId, status: 'completed', btcTxId, ethTxHash, secret }
```

---

## 🔗 Smart Contract Interface

### Key Functions
```solidity
// Initiate swap
function initiateSwap(
    bytes32 swapId,
    address tokenOut,
    uint256 amountOut,
    bytes32 secretHash,
    uint256 lockTime
) external;

// Complete swap
function completeSwap(
    bytes32 swapId,
    bytes32 secret,
    bytes calldata bitcoinTxProof,
    bytes32[] calldata merkleProof
) external;

// Get swap details
function getSwapOrder(bytes32 swapId) 
    external view returns (SwapOrder memory);
```

---

## ₿ Bitcoin Utilities

### Generate Bitcoin Wallet
```javascript
const wallet = new BitcoinWallet('testnet');
const keyPair = wallet.generateKeyPair();
// Returns: { privateKey, publicKey, address, keyPair }
```

### Create HTLC
```javascript
const htlc = new BitcoinHTLC('testnet');
const { secret, hash } = htlc.generateSecret();

const htlcOutput = htlc.createHTLCOutput(
  hash,                    // Secret hash
  recipientAddress,        // Who can claim
  refundAddress,          // Who gets refund
  lockTime,               // Timeout block
  amountSatoshis          // Amount in sats
);
// Returns: { script, address, amount, lockTime, hash }
```

### Monitor Bitcoin Address
```javascript
const stopMonitoring = wallet.monitorAddress(address, (tx) => {
  console.log('New transaction:', tx);
});
// Call stopMonitoring() to stop
```

---

## 🎛️ State Management

### Save & Retrieve Swap State
```javascript
const stateManager = new StateManager();

// Save state
await stateManager.saveSwapState(swapId, swapState);

// Get state
const state = await stateManager.getSwapState(swapId);

// Get user history
const history = await stateManager.getUserSwapHistory(userAddress);
```

### Get Statistics
```javascript
const stats = await stateManager.getSwapStatistics();
// Returns: { total, byStatus, totalVolume, averageCompletionTime, successRate }
```

---

## ⚛️ React Components

### Swap Interface
```jsx
import SwapInterface from './components/SwapInterface';

<SwapInterface 
  userAddress={address}
  onSwapCreated={(swapData) => {
    console.log('Swap created:', swapData);
  }}
/>
```

### Basic Swap Page
```jsx
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  
  return (
    <div>
      {isConnected ? (
        <SwapInterface userAddress={address} />
      ) : (
        <ConnectButton />
      )}
    </div>
  );
}
```

---

## 🔧 Configuration Templates

### Basic Config
```javascript
const config = {
  bitcoinNetwork: 'testnet',
  ethereumNetwork: 'sepolia',
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL,
  fusionResolverAddress: process.env.FUSION_RESOLVER_ADDRESS,
  privateKey: process.env.PRIVATE_KEY,
  oneinchApiKey: process.env.ONEINCH_API_KEY
};
```

### Environment Variables
```env
# Required
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0x...
ONEINCH_API_KEY=your_api_key
FUSION_RESOLVER_ADDRESS=0x...

# Optional
BITCOIN_NETWORK=testnet
BITCOIN_RPC_URL=http://localhost:18332
```

---

## 🚨 Error Handling

### Common Patterns
```javascript
try {
  const result = await coordinator.initiateBTCToETHSwap(params);
} catch (error) {
  switch (error.message) {
    case 'Insufficient funds':
      // Handle insufficient funds
      break;
    case 'Invalid quote':
      // Handle quote error
      break;
    default:
      console.error('Unexpected error:', error);
  }
}
```

### Status Checks
```javascript
const status = await coordinator.getSwapStatus(swapId);

switch (status.status) {
  case 'initiated':
    // Waiting for Bitcoin transaction
    break;
  case 'completed':
    // Swap successful
    break;
  case 'expired':
    // Need to refund
    break;
  case 'refunded':
    // Already refunded
    break;
}
```

---

## 📊 Monitoring & Analytics

### Start Monitoring Service
```javascript
// Automatically handle timeouts
coordinator.startMonitoring();
```

### Export Data
```javascript
const filePath = await stateManager.exportSwapData({
  format: 'csv',              // or 'json'
  startDate: startTimestamp,
  endDate: endTimestamp,
  status: 'completed'         // optional filter
});
```

### Cleanup Old Swaps
```javascript
const cleanedCount = await stateManager.cleanupExpiredSwaps(
  30 * 24 * 60 * 60 * 1000  // 30 days in ms
);
```

---

## 🔍 Testing Helpers

### Mock Swap Data
```javascript
const mockSwapParams = {
  btcAmount: 0.001,
  ethAmount: 0.1,
  ethTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  userBtcAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
  userEthAddress: '0x742d35Cc6634C0532925a3b8D138dDbe29E7d7e3',
  lockTime: Date.now() + 86400000
};
```

### Test Bitcoin HTLC
```javascript
const htlc = new BitcoinHTLC('testnet');
const { secret, hash } = htlc.generateSecret();

// Verify hash
const crypto = require('crypto');
const expectedHash = crypto.createHash('sha256').update(secret).digest();
assert.equal(hash.toString('hex'), expectedHash.toString('hex'));
```

---

## 📱 Frontend Integration

### Wallet Connection
```jsx
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useNetwork } from 'wagmi';

function App() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  
  return (
    <div>
      <ConnectButton />
      {isConnected && <p>Connected: {address}</p>}
      {chain && <p>Network: {chain.name}</p>}
    </div>
  );
}
```

### API Integration
```javascript
// Fetch swap quote
const response = await fetch('/api/swaps/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ btcAmount: 0.001, ethAmount: 0.1 })
});
const quote = await response.json();

// Create swap
const response = await fetch('/api/swaps/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(swapParams)
});
const swap = await response.json();
```

---

## 🛠️ Deployment

### Deploy Contracts
```bash
# Deploy to testnet
npm run deploy:testnet

# Verify deployment
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

### Start Services
```bash
# Frontend development
npm run dev

# Production build
npm run build
npm run start
```

---

## 📚 Common Workflows

### Complete Swap Workflow
```javascript
// 1. Initialize
const coordinator = new SwapCoordinator(config);

// 2. Create swap
const swap = await coordinator.initiateBTCToETHSwap(params);
console.log('Send BTC to:', swap.btcHtlcAddress);

// 3. Monitor for Bitcoin transaction
// (User sends BTC to HTLC address)

// 4. Complete when Bitcoin is received
const completion = await coordinator.completeBTCToETHSwap(
  swap.swapId, 
  bitcoinTxId
);
console.log('Swap completed:', completion);
```

### Handle Timeout
```javascript
// Check if swap expired
const isExpired = await fusionResolver.isSwapExpired(swapId);

if (isExpired) {
  // Initiate refund
  const refund = await coordinator.handleSwapTimeout(swapId);
  console.log('Refund initiated:', refund);
}
```

---

## 💡 Best Practices

### Security
- Always validate user inputs
- Use testnet for development
- Store private keys securely
- Implement proper error handling

### Performance
- Cache swap states locally
- Use parallel API calls where possible
- Implement retry logic for network calls

### User Experience
- Show clear swap progress
- Provide HTLC address for easy copying
- Display estimated completion times
- Handle errors gracefully

---

## 🆘 Troubleshooting

### Common Issues

**"Swap already exists"**
```javascript
// Use unique swap IDs
const swapId = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(`${Date.now()}-${Math.random()}`)
);
```

**"Insufficient Bitcoin confirmations"**
```javascript
// Wait for more confirmations
await coordinator.waitForBitcoinConfirmations(txId, 6);
```

**"1inch quote failed"**
```javascript
// Check API key and network
const quote = await coordinator.get1inchQuote(tokenAddress, amount, userAddress);
```

### Debug Mode
```javascript
// Enable debug logging
process.env.DEBUG = 'swap:*';
const coordinator = new SwapCoordinator(config);
```

---

For complete details, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)