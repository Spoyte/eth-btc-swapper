# Bitcoin-Ethereum Cross-Chain Swap - API Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Smart Contract API](#smart-contract-api)
3. [Coordinator Service API](#coordinator-service-api)
4. [State Manager API](#state-manager-api)
5. [Bitcoin Utilities API](#bitcoin-utilities-api)
6. [Frontend Components API](#frontend-components-api)
7. [Deployment Scripts](#deployment-scripts)
8. [Usage Examples](#usage-examples)
9. [Configuration](#configuration)

## Project Overview

This project implements a trustless Bitcoin-Ethereum cross-chain swap using 1inch Fusion+ protocol. It enables users to swap native Bitcoin for Ethereum/ERC-20 tokens using Hash Time Lock Contracts (HTLC) and atomic swap mechanisms.

### Architecture Components
- **Smart Contracts**: Ethereum-side resolver for 1inch Fusion+ integration
- **Coordinator Service**: Orchestrates the swap process between Bitcoin and Ethereum
- **State Manager**: Manages swap state persistence and recovery
- **Bitcoin Utilities**: HTLC creation, wallet management, and transaction handling
- **Frontend Interface**: Next.js React application for user interaction

---

## Smart Contract API

### FusionResolver.sol

#### Contract Description
Custom resolver for 1inch Fusion+ to handle Bitcoin-Ethereum cross-chain swaps. Validates Bitcoin transaction proofs and executes Ethereum-side swaps.

#### Public Functions

##### `initiateSwap(bytes32 swapId, address tokenOut, uint256 amountOut, bytes32 bitcoinTxHash, bytes32 secretHash, uint256 lockTime)`
Initiates a cross-chain swap.

**Parameters:**
- `swapId`: Unique identifier for the swap
- `tokenOut`: Token to receive on Ethereum
- `amountOut`: Amount to receive
- `bitcoinTxHash`: Bitcoin transaction hash
- `secretHash`: Hash of the secret for HTLC
- `lockTime`: Bitcoin locktime for refund

**Events Emitted:**
- `SwapInitiated(bytes32 indexed swapId, address indexed user, address tokenOut, uint256 amountOut, bytes32 bitcoinTxHash, uint256 lockTime)`

**Example:**
```solidity
fusionResolver.initiateSwap(
    "0x1234...",                    // swapId
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH
    ethers.parseEther("0.1"),       // 0.1 ETH
    "0xabcd...",                    // Bitcoin tx hash
    "0x5678...",                    // secret hash
    1700000000                      // lock time
);
```

##### `completeSwap(bytes32 swapId, bytes32 secret, bytes calldata bitcoinTxProof, bytes32[] calldata merkleProof)`
Completes swap by providing Bitcoin transaction proof and secret.

**Parameters:**
- `swapId`: Unique identifier for the swap
- `secret`: The secret that unlocks the Bitcoin HTLC
- `bitcoinTxProof`: Proof of Bitcoin transaction
- `merkleProof`: Merkle proof for transaction inclusion

**Events Emitted:**
- `SwapCompleted(bytes32 indexed swapId, address indexed user, bytes32 secret, bytes32 bitcoinTxHash)`

##### `refundSwap(bytes32 swapId, string calldata reason)`
Refunds swap after timeout or with valid reason.

**Parameters:**
- `swapId`: Unique identifier for the swap
- `reason`: Reason for refund

**Events Emitted:**
- `SwapRefunded(bytes32 indexed swapId, address indexed user, string reason)`

##### `getSwapOrder(bytes32 swapId)` → `SwapOrder`
Returns swap order details.

**Returns:**
```solidity
struct SwapOrder {
    address user;
    address tokenOut;
    uint256 amountOut;
    bytes32 bitcoinTxHash;
    bytes32 secretHash;
    uint256 lockTime;
    uint256 createdAt;
    SwapStatus status;
}
```

##### `isSwapExpired(bytes32 swapId)` → `bool`
Checks if swap is expired.

#### Admin Functions

##### `addAuthorizedOracle(address oracle)`
Adds an authorized oracle for Bitcoin proof verification.

##### `removeAuthorizedOracle(address oracle)`
Removes an authorized oracle.

##### `submitBitcoinProof(bytes32 swapId, bytes32 bitcoinTxHash, uint256 confirmations, bool isValid)`
Oracle function to submit Bitcoin transaction proof.

---

## Coordinator Service API

### SwapCoordinator Class

#### Constructor
```javascript
new SwapCoordinator(config)
```

**Configuration Object:**
```javascript
{
  bitcoinNetwork: 'testnet',          // 'testnet' or 'mainnet'
  ethereumNetwork: 'sepolia',         // Ethereum network
  ethereumRpcUrl: 'https://...',      // Ethereum RPC URL
  fusionResolverAddress: '0x...',     // Contract address
  privateKey: '0x...',               // Private key for transactions
  oneinchApiKey: 'your_api_key',     // 1inch API key
  oneinchBaseUrl: 'https://api.1inch.dev'
}
```

#### Public Methods

##### `async initiateBTCToETHSwap(swapParams)`
Initiates a BTC to ETH/ERC20 swap.

**Parameters:**
```javascript
{
  btcAmount: 0.001,                   // BTC amount to swap
  ethTokenAddress: '0x...',           // Token address (ETH or ERC20)
  ethAmount: 0.1,                     // Expected ETH amount
  userBtcAddress: 'tb1q...',          // User's Bitcoin address
  userEthAddress: '0x...',            // User's Ethereum address
  lockTime: 1700000000                // Lock time in Unix timestamp
}
```

**Returns:**
```javascript
{
  swapId: '0x1234...',                // Unique swap identifier
  btcHtlcAddress: 'tb1q...',          // Bitcoin HTLC address
  secretHash: '0x5678...',            // Secret hash
  lockTime: 1700000000,               // Lock time
  ethQuote: {...}                     // 1inch quote details
}
```

**Example:**
```javascript
const coordinator = new SwapCoordinator(config);

const swapResult = await coordinator.initiateBTCToETHSwap({
  btcAmount: 0.001,
  ethTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  ethAmount: 0.1,
  userBtcAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
  userEthAddress: '0x742d35Cc6634C0532925a3b8D138dDbe29E7d7e3',
  lockTime: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
});
```

##### `async completeBTCToETHSwap(swapId, bitcoinTxId)`
Completes swap when Bitcoin HTLC is funded.

**Parameters:**
- `swapId` (string): Swap identifier
- `bitcoinTxId` (string): Bitcoin transaction ID

**Returns:**
```javascript
{
  swapId: '0x1234...',
  status: 'completed',
  btcTxId: 'abc123...',
  ethTxHash: '0x5678...',
  secret: '0x9abc...'
}
```

##### `async getSwapStatus(swapId)`
Gets current swap status.

**Returns:**
```javascript
{
  swapId: '0x1234...',
  status: 'initiated',                // 'initiated', 'completed', 'refunded', 'expired'
  btcSide: {...},                     // Bitcoin side details
  ethSide: {...},                     // Ethereum side details
  onChainStatus: 0,                   // On-chain status enum
  createdAt: 1700000000,              // Creation timestamp
  expiresAt: 1700086400,              // Expiration timestamp
  completedAt: null,                  // Completion timestamp
  refundedAt: null                    // Refund timestamp
}
```

##### `async handleSwapTimeout(swapId)`
Handles swap timeout and initiates refund.

**Returns:**
```javascript
{
  swapId: '0x1234...',
  status: 'refunded',
  ethRefundTxHash: '0x5678...'
}
```

##### `async get1inchQuote(tokenAddress, amount, userAddress)`
Gets 1inch quote for token swap.

**Returns:**
```javascript
{
  fromToken: {...},
  toToken: {...},
  fromTokenAmount: '1000000000000000000',
  toTokenAmount: '100000000000000000',
  protocols: [...],
  estimatedGas: 200000
}
```

##### `startMonitoring()`
Starts the swap monitoring service for automatic timeout handling.

---

## State Manager API

### StateManager Class

#### Constructor
```javascript
new StateManager(config)
```

**Configuration Object:**
```javascript
{
  dataDir: './data',                  // Data directory path
  backupDir: './data/backups',        // Backup directory path
  maxBackups: 10                      // Maximum number of backups per swap
}
```

#### Public Methods

##### `async saveSwapState(swapId, swapState)`
Saves swap state to persistent storage.

**Parameters:**
- `swapId` (string): Swap identifier
- `swapState` (object): Complete swap state object

##### `async getSwapState(swapId)`
Retrieves swap state from storage.

**Returns:** Swap state object or `null` if not found.

##### `async getActiveSwaps()`
Gets all active swaps (initiated or pending status).

**Returns:** Array of active swap states.

##### `async getSwapsByStatus(status)`
Gets swaps filtered by status.

**Parameters:**
- `status` (string): Status to filter by ('initiated', 'completed', 'refunded', 'expired')

**Returns:** Array of swap states with specified status.

##### `async getUserSwapHistory(userAddress)`
Gets swap history for a specific user.

**Parameters:**
- `userAddress` (string): User's address (Bitcoin or Ethereum)

**Returns:** Array of user's swap states, sorted by creation time.

##### `async getSwapStatistics()`
Gets comprehensive swap statistics.

**Returns:**
```javascript
{
  total: 42,                          // Total number of swaps
  byStatus: {                         // Count by status
    'initiated': 5,
    'completed': 30,
    'refunded': 5,
    'expired': 2
  },
  totalVolume: {                      // Total volume
    btc: 1.5,
    eth: 15.0
  },
  averageCompletionTime: 3600000,     // Average completion time in ms
  successRate: 85.7                   // Success rate percentage
}
```

##### `async exportSwapData(options)`
Exports swap data for analysis.

**Options:**
```javascript
{
  format: 'json',                     // 'json' or 'csv'
  startDate: 1700000000,              // Start date filter
  endDate: 1700086400,                // End date filter
  status: 'completed'                 // Status filter
}
```

**Returns:** Path to exported file.

##### `async cleanupExpiredSwaps(maxAge)`
Cleans up expired swaps older than specified age.

**Parameters:**
- `maxAge` (number): Maximum age in milliseconds (default: 30 days)

**Returns:** Number of cleaned up swaps.

---

## Bitcoin Utilities API

### BitcoinWallet Class

#### Constructor
```javascript
new BitcoinWallet(network, rpcConfig)
```

**Parameters:**
- `network` (string): 'testnet' or 'mainnet'
- `rpcConfig` (object, optional): Bitcoin RPC configuration

#### Public Methods

##### `generateKeyPair()`
Generates a new Bitcoin key pair.

**Returns:**
```javascript
{
  privateKey: 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy',
  publicKey: '025476c2e83188368da1ff3e292e7acafcdb3566bb0ad253f62fc70f07aeee6357',
  address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
  keyPair: ECPair                     // ECPair object
}
```

##### `importPrivateKey(privateKeyWIF)`
Imports private key from WIF format.

**Parameters:**
- `privateKeyWIF` (string): Private key in WIF format

**Returns:** Key pair object (same structure as `generateKeyPair()`)

##### `async getUTXOs(address)`
Gets UTXOs for an address.

**Returns:**
```javascript
[
  {
    txid: 'abc123...',
    vout: 0,
    value: 100000,                    // Value in satoshis
    confirmations: 6
  }
]
```

##### `async getTransaction(txid)`
Gets transaction details.

**Returns:** Transaction object with confirmations and other details.

##### `async createTransaction(utxos, outputs, changeAddress, feeRate)`
Creates a Bitcoin transaction.

**Parameters:**
- `utxos` (array): Input UTXOs
- `outputs` (array): Output addresses and amounts
- `changeAddress` (string): Change address
- `feeRate` (number): Fee rate in sat/vB

**Returns:** PSBT (Partially Signed Bitcoin Transaction) object.

##### `signTransaction(psbt, privateKeys)`
Signs a transaction.

**Parameters:**
- `psbt` (object): PSBT object
- `privateKeys` (array): Array of private keys in WIF format

**Returns:** Signed transaction object.

##### `async broadcastTransaction(txHex)`
Broadcasts transaction to the network.

**Parameters:**
- `txHex` (string): Transaction hex

**Returns:** Transaction ID.

##### `monitorAddress(address, callback)`
Monitors address for new transactions.

**Parameters:**
- `address` (string): Bitcoin address to monitor
- `callback` (function): Callback function for new transactions

**Returns:** Function to stop monitoring.

**Example:**
```javascript
const wallet = new BitcoinWallet('testnet');

// Generate new wallet
const keyPair = wallet.generateKeyPair();
console.log('Address:', keyPair.address);

// Get UTXOs
const utxos = await wallet.getUTXOs(keyPair.address);

// Create transaction
const outputs = [
  { address: 'tb1q...', value: 50000 }
];
const psbt = await wallet.createTransaction(utxos, outputs, keyPair.address);

// Sign and broadcast
const signedTx = wallet.signTransaction(psbt, [keyPair.privateKey]);
const txId = await wallet.broadcastTransaction(signedTx.toHex());
```

### BitcoinHTLC Class

#### Constructor
```javascript
new BitcoinHTLC(network)
```

#### Public Methods

##### `generateSecret()`
Generates a new secret and its hash.

**Returns:**
```javascript
{
  secret: Buffer,                     // 32-byte secret
  hash: Buffer                        // SHA256 hash of secret
}
```

##### `createHTLCScript(hash, recipientPubKey, refundPubKey, lockTime)`
Creates HTLC script.

**Parameters:**
- `hash` (Buffer): SHA256 hash of the secret
- `recipientPubKey` (Buffer): Recipient's public key
- `refundPubKey` (Buffer): Refund public key
- `lockTime` (number): Lock time in blocks

**Returns:** HTLC script Buffer.

##### `createP2SHAddress(script)`
Creates P2SH address from HTLC script.

**Returns:** P2SH address string.

##### `createHTLCOutput(hash, recipientAddress, refundAddress, lockTime, amount)`
Creates complete HTLC output.

**Returns:**
```javascript
{
  script: Buffer,                     // HTLC script
  address: 'tb1q...',                 // P2SH address
  amount: 100000,                     // Amount in satoshis
  lockTime: 800000,                   // Lock time
  hash: '5678...'                     // Hash hex string
}
```

##### `createClaimTransaction(htlcOutput, secret, recipientPrivateKey, destinationAddress, utxos)`
Creates transaction to claim HTLC funds with secret.

**Returns:** Signed transaction object.

##### `createRefundTransaction(htlcOutput, refundPrivateKey, refundAddress, utxos)`
Creates transaction to refund HTLC after timeout.

**Returns:** Signed transaction object.

##### `extractSecretFromTransaction(txHex, expectedHash)`
Extracts secret from a transaction that reveals it.

**Parameters:**
- `txHex` (string): Transaction hex
- `expectedHash` (Buffer): Expected hash of the secret

**Returns:** Secret Buffer or `null` if not found.

**Example:**
```javascript
const htlc = new BitcoinHTLC('testnet');

// Generate secret
const { secret, hash } = htlc.generateSecret();

// Create HTLC
const htlcOutput = htlc.createHTLCOutput(
  hash,
  'tb1qrecipient...',
  'tb1qrefund...',
  800000,  // lock time
  100000   // 0.001 BTC
);

console.log('Send Bitcoin to:', htlcOutput.address);

// Later, create claim transaction
const claimTx = htlc.createClaimTransaction(
  htlcOutput,
  secret,
  recipientPrivateKey,
  'tb1qdestination...',
  utxos
);
```

---

## Frontend Components API

### SwapInterface Component

#### Props
```javascript
{
  userAddress: string,                // User's Ethereum address
  onSwapCreated: function            // Callback when swap is created
}
```

#### Features
- Multi-step swap creation wizard
- Real-time quote fetching
- Form validation and error handling
- Progress tracking
- Bitcoin HTLC address generation

#### Usage
```jsx
import SwapInterface from '../components/SwapInterface';

<SwapInterface 
  userAddress="0x742d35Cc6634C0532925a3b8D138dDbe29E7d7e3"
  onSwapCreated={(swapData) => {
    console.log('Swap created:', swapData);
    // Handle swap creation
  }}
/>
```

### Header Component

#### Features
- Wallet connection button
- Navigation menu
- Project branding

#### Usage
```jsx
import Header from '../components/Header';

<Header />
```

### Home Page Component

#### Features
- Wallet connection management
- Tab-based interface (Swap/History)
- Network status display
- Feature showcase

#### State Management
```javascript
{
  activeTab: 'swap',                  // Current active tab
  swapHistory: [],                    // User's swap history
  address: '0x...',                   // Connected wallet address
  isConnected: boolean,               // Wallet connection status
  chain: object                       // Current network chain
}
```

---

## Deployment Scripts

### deploy.js

Deploys smart contracts to specified network.

#### Usage
```bash
# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet (configure network in hardhat.config.js first)
npx hardhat run scripts/deploy.js --network mainnet
```

#### Features
- Automatic contract verification on Etherscan
- Deployment info persistence
- Balance checking
- Network-specific configuration

#### Output
Creates deployment file at `./deployments/{network}.json`:
```json
{
  "network": "sepolia",
  "deployer": "0x742d35Cc6634C0532925a3b8D138dDbe29E7d7e3",
  "contracts": {
    "FusionResolver": "0x1234567890123456789012345678901234567890"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Usage Examples

### Complete Swap Flow

#### 1. Initialize Services
```javascript
const SwapCoordinator = require('./coordinator/SwapCoordinator');
const StateManager = require('./coordinator/StateManager');

const config = {
  bitcoinNetwork: 'testnet',
  ethereumNetwork: 'sepolia',
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL,
  fusionResolverAddress: process.env.FUSION_RESOLVER_ADDRESS,
  privateKey: process.env.PRIVATE_KEY,
  oneinchApiKey: process.env.ONEINCH_API_KEY
};

const coordinator = new SwapCoordinator(config);
const stateManager = new StateManager();
```

#### 2. Create Swap
```javascript
const swapParams = {
  btcAmount: 0.001,
  ethTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
  ethAmount: 0.1,
  userBtcAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
  userEthAddress: '0x742d35Cc6634C0532925a3b8D138dDbe29E7d7e3',
  lockTime: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
};

const swapResult = await coordinator.initiateBTCToETHSwap(swapParams);
console.log('Swap created:', swapResult);
```

#### 3. Monitor Swap
```javascript
// Start monitoring
coordinator.startMonitoring();

// Check status
const status = await coordinator.getSwapStatus(swapResult.swapId);
console.log('Swap status:', status);
```

#### 4. Complete Swap (when Bitcoin is sent)
```javascript
// This would typically be triggered by monitoring Bitcoin transactions
const bitcoinTxId = 'abc123...'; // Bitcoin transaction ID
const completion = await coordinator.completeBTCToETHSwap(
  swapResult.swapId, 
  bitcoinTxId
);
console.log('Swap completed:', completion);
```

### Bitcoin HTLC Example

```javascript
const BitcoinHTLC = require('./bitcoin/htlc');
const BitcoinWallet = require('./bitcoin/wallet');

const htlc = new BitcoinHTLC('testnet');
const wallet = new BitcoinWallet('testnet');

// Generate participants
const alice = wallet.generateKeyPair(); // Sender
const bob = wallet.generateKeyPair();   // Recipient

// Create HTLC
const { secret, hash } = htlc.generateSecret();
const htlcOutput = htlc.createHTLCOutput(
  hash,
  bob.address,    // recipient
  alice.address,  // refund address
  800000,         // lock time (block height)
  100000          // 0.001 BTC
);

console.log('HTLC Address:', htlcOutput.address);
console.log('Secret Hash:', hash.toString('hex'));

// Alice sends BTC to HTLC address
// ... (fund the HTLC)

// Bob claims with secret
const utxos = await wallet.getUTXOs(htlcOutput.address);
const claimTx = htlc.createClaimTransaction(
  htlcOutput,
  secret,
  bob.privateKey,
  bob.address,
  utxos
);

const claimTxId = await wallet.broadcastTransaction(claimTx.toHex());
console.log('Claim transaction:', claimTxId);
```

### Frontend Integration

```jsx
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import SwapInterface from '../components/SwapInterface';

export default function SwapPage() {
  const { address } = useAccount();
  const [swaps, setSwaps] = useState([]);

  const handleSwapCreated = async (swapData) => {
    console.log('New swap created:', swapData);
    setSwaps(prev => [swapData, ...prev]);
    
    // Start monitoring this swap
    monitorSwap(swapData.swapId);
  };

  const monitorSwap = async (swapId) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/swaps/${swapId}/status`);
        const status = await response.json();
        
        if (status.status === 'completed') {
          console.log('Swap completed!');
          // Update UI
        } else if (status.status === 'expired') {
          console.log('Swap expired');
          // Handle expiration
        } else {
          // Check again in 30 seconds
          setTimeout(checkStatus, 30000);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    checkStatus();
  };

  return (
    <div>
      <SwapInterface 
        userAddress={address}
        onSwapCreated={handleSwapCreated}
      />
      
      {/* Display swap history */}
      <div className="mt-8">
        <h2>Your Swaps</h2>
        {swaps.map(swap => (
          <div key={swap.swapId} className="border p-4 mb-2">
            <p>ID: {swap.swapId}</p>
            <p>Status: {swap.status}</p>
            <p>BTC: {swap.btcAmount}</p>
            <p>ETH: {swap.ethAmount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Bitcoin Configuration
BITCOIN_NETWORK=testnet
BITCOIN_RPC_URL=http://localhost:18332
BITCOIN_RPC_USER=your_rpc_user
BITCOIN_RPC_PASS=your_rpc_pass

# Ethereum Configuration
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key_for_deployment

# 1inch Configuration
ONEINCH_API_KEY=your_1inch_api_key

# Contract Addresses (set after deployment)
FUSION_RESOLVER_ADDRESS=0x...
```

### Network Configuration

#### Hardhat Networks
```javascript
// hardhat.config.js
module.exports = {
  networks: {
    sepolia: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111
    },
    mainnet: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1
    }
  }
};
```

#### Frontend Wallet Configuration
```javascript
// wagmi configuration
import { configureChains, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [sepolia, mainnet],
  [publicProvider()]
);

export const config = createConfig({
  autoConnect: true,
  connectors: [/* your connectors */],
  publicClient,
});
```

### Service Configuration

#### Coordinator Service
```javascript
const coordinatorConfig = {
  // Network settings
  bitcoinNetwork: 'testnet',
  ethereumNetwork: 'sepolia',
  
  // RPC endpoints
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL,
  bitcoinRpcUrl: process.env.BITCOIN_RPC_URL,
  
  // Contract addresses
  fusionResolverAddress: process.env.FUSION_RESOLVER_ADDRESS,
  
  // API keys
  oneinchApiKey: process.env.ONEINCH_API_KEY,
  
  // Service settings
  confirmationsRequired: 3,
  defaultLockTime: 24 * 60 * 60, // 24 hours
  monitoringInterval: 30000,      // 30 seconds
  
  // Fees
  serviceFeePercent: 0.1,         // 0.1%
  gasPriceMultiplier: 1.2         // 20% gas price increase
};
```

#### State Manager Configuration
```javascript
const stateConfig = {
  dataDir: './data/swaps',
  backupDir: './data/backups',
  maxBackups: 10,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  maxAge: 30 * 24 * 60 * 60 * 1000      // 30 days
};
```

---

## Error Handling

### Common Error Codes

#### Smart Contract Errors
- `"Swap already exists"` - Swap ID is not unique
- `"Swap does not exist"` - Invalid swap ID
- `"Swap not pending"` - Swap is not in pending state
- `"Swap expired"` - Swap has exceeded timeout
- `"Invalid secret"` - Provided secret doesn't match hash
- `"Not authorized oracle"` - Caller is not an authorized oracle

#### Coordinator Errors
- `"Insufficient Bitcoin confirmations"` - Waiting for more confirmations
- `"Invalid Bitcoin transaction"` - Transaction validation failed
- `"1inch quote failed"` - Unable to get exchange quote
- `"Swap timeout"` - Swap exceeded maximum time limit

#### Bitcoin Errors
- `"Insufficient funds"` - Not enough UTXOs for transaction
- `"Invalid address"` - Malformed Bitcoin address
- `"Transaction broadcast failed"` - Network error during broadcast
- `"HTLC already spent"` - HTLC output already claimed

### Error Handling Examples

```javascript
try {
  const swapResult = await coordinator.initiateBTCToETHSwap(params);
} catch (error) {
  switch (error.code) {
    case 'INSUFFICIENT_FUNDS':
      console.error('Not enough funds for swap');
      break;
    case 'INVALID_QUOTE':
      console.error('Unable to get valid exchange quote');
      break;
    case 'NETWORK_ERROR':
      console.error('Network communication failed');
      break;
    default:
      console.error('Unexpected error:', error.message);
  }
}
```

---

## Security Considerations

### Smart Contract Security
- All functions use `nonReentrant` modifier where applicable
- Proper access control with `onlyOwner` and oracle authorization
- Input validation on all parameters
- Safe math operations using Solidity 0.8+

### Bitcoin Security
- HTLC scripts include proper timelock and hashlock mechanisms
- Private keys are never transmitted over network
- Transaction signing is done locally
- Proper UTXO selection and change handling

### Frontend Security
- Private keys stored securely in wallet extensions
- API calls authenticated where necessary
- Input sanitization and validation
- Secure communication over HTTPS

### Operational Security
- Environment variables for sensitive configuration
- Regular backup of swap states
- Monitoring and alerting for failed swaps
- Automated timeout handling

---

## Testing

### Running Tests

```bash
# Smart contract tests
npm run test

# Bitcoin tests
npm run bitcoin:test

# Integration tests
npm run test:integration
```

### Test Examples

#### Smart Contract Test
```javascript
describe("FusionResolver", function () {
  it("Should initiate swap correctly", async function () {
    const swapId = ethers.utils.formatBytes32String("test-swap");
    const secretHash = ethers.utils.keccak256("0x1234");
    
    await expect(fusionResolver.initiateSwap(
      swapId,
      ethers.constants.AddressZero,
      ethers.utils.parseEther("1"),
      secretHash,
      Math.floor(Date.now() / 1000) + 3600
    )).to.emit(fusionResolver, "SwapInitiated");
  });
});
```

#### Bitcoin HTLC Test
```javascript
const assert = require('assert');
const BitcoinHTLC = require('../bitcoin/htlc');

describe('BitcoinHTLC', () => {
  it('should generate valid secret and hash', () => {
    const htlc = new BitcoinHTLC('testnet');
    const { secret, hash } = htlc.generateSecret();
    
    assert.equal(secret.length, 32);
    assert.equal(hash.length, 32);
    
    // Verify hash
    const crypto = require('crypto');
    const expectedHash = crypto.createHash('sha256').update(secret).digest();
    assert.equal(hash.toString('hex'), expectedHash.toString('hex'));
  });
});
```

---

This documentation provides comprehensive coverage of all public APIs, functions, and components in the Bitcoin-Ethereum cross-chain swap project. Each section includes detailed parameters, return values, usage examples, and configuration options to help developers integrate and extend the system.