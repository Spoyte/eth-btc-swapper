# Bitcoin-Ethereum Cross-Chain Swap

A trustless bridge enabling swaps between Bitcoin and Ethereum using 1inch Fusion+ protocol. Users can swap BTC for ETH (or ERC-20 tokens) directly without wrapping, using atomic swaps with hashlock and timelock mechanisms.

## 🎯 Target Prize
**1inch - Non-EVM Extensions for Cross-chain Swap ($12,000)**

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Bitcoin HTLC  │    │   Coordinator   │    │ Ethereum Fusion+│
│   (P2SH Script) │◄──►│    Service      │◄──►│   Resolver      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Bitcoin Wallet │    │  Frontend UI    │    │ Ethereum Wallet │
│   Integration   │    │   (Next.js)     │    │  (RainbowKit)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Technical Implementation

### Bitcoin Side
- **HTLC Scripts**: P2SH scripts with hashlocks and timelocks
- **Wallet Integration**: Transaction creation, signing, and broadcasting
- **Atomic Guarantees**: Ensures swap completion or refund

### Ethereum Side
- **Fusion+ Integration**: Custom resolver contracts
- **1inch Aggregation**: Optimal routing for ETH/ERC-20 swaps
- **Proof Verification**: Validates Bitcoin transaction proofs

### Coordinator Service
- **Swap Orchestration**: Manages the atomic swap flow
- **State Management**: Tracks swap progress and handles failures
- **Recovery Mechanisms**: Implements timeout and refund logic

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Bitcoin Core (for testnet)
- Ethereum wallet (MetaMask)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd eth-btc-swapper

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Variables

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
```

## � Deployment to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Feth-btc-swapper&env=NEXT_PUBLIC_BITCOIN_NETWORK,NEXT_PUBLIC_ETHEREUM_CHAIN_ID,NEXT_PUBLIC_APP_NAME,NEXT_PUBLIC_ONEINCH_API_KEY&envDescription=Environment%20variables%20needed%20for%20the%20Bitcoin-Ethereum%20bridge)

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file or set them in Vercel dashboard:
   ```bash
   # Required for frontend
   NEXT_PUBLIC_BITCOIN_NETWORK=testnet
   NEXT_PUBLIC_ETHEREUM_CHAIN_ID=11155111
   NEXT_PUBLIC_APP_NAME=Bitcoin-Ethereum Bridge
   NEXT_PUBLIC_ONEINCH_API_KEY=your_1inch_api_key
   NEXT_PUBLIC_ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   
   # Optional: For enhanced functionality
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   NEXT_PUBLIC_ENABLE_TESTNETS=true
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Automatic Deployment from Git

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Configure environment variables in the dashboard

2. **Build Settings**
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

3. **Environment Variables**
   Add these in your Vercel project settings:
   ```
   NEXT_PUBLIC_BITCOIN_NETWORK=testnet
   NEXT_PUBLIC_ETHEREUM_CHAIN_ID=11155111
   NEXT_PUBLIC_APP_NAME=Bitcoin-Ethereum Bridge
   NEXT_PUBLIC_ONEINCH_API_KEY=your_1inch_api_key
   NEXT_PUBLIC_ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   ```

### Vercel Configuration

Create a `vercel.json` file in your project root for advanced configuration:

```json
{
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_BITCOIN_NETWORK": "testnet",
    "NEXT_PUBLIC_ETHEREUM_CHAIN_ID": "11155111",
    "NEXT_PUBLIC_APP_NAME": "Bitcoin-Ethereum Bridge"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

### Troubleshooting Deployment Issues

#### Common Issues and Solutions

1. **Build fails due to Node.js polyfills**
   - Already handled in `next.config.js` with webpack fallbacks
   - If issues persist, add to `next.config.js`:
   ```javascript
   config.resolve.fallback = {
     ...config.resolve.fallback,
     stream: require.resolve('stream-browserify'),
     buffer: require.resolve('buffer'),
   };
   ```

2. **Environment variables not loading**
   - Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
   - Check Vercel dashboard environment variables settings
   - Redeploy after adding new environment variables

3. **API routes timeout**
   - Increase function timeout in `vercel.json`
   - Optimize API routes for faster response times

4. **Crypto/Bitcoin library issues**
   - Already configured in `next.config.js`
   - For additional issues, add to webpack config:
   ```javascript
   config.experiments = {
     ...config.experiments,
     topLevelAwait: true,
   };
   ```

### Production Considerations

- **Environment Variables**: Use production RPC URLs and API keys
- **Network Configuration**: Switch to mainnet for production deployment
- **Security**: Never commit private keys or sensitive data
- **Performance**: Enable Vercel Analytics for monitoring
- **Caching**: Configure appropriate caching headers for static assets

### Monitoring and Analytics

1. **Enable Vercel Analytics**
   ```bash
   npm install @vercel/analytics
   ```

2. **Add to your `_app.js`**
   ```javascript
   import { Analytics } from '@vercel/analytics/react';
   
   export default function App({ Component, pageProps }) {
     return (
       <>
         <Component {...pageProps} />
         <Analytics />
       </>
     );
   }
   ```

## �📁 Project Structure

```
eth-btc-swapper/
├── contracts/              # Ethereum smart contracts
│   ├── FusionResolver.sol  # Custom 1inch Fusion+ resolver
│   └── SwapManager.sol     # Main swap coordination contract
├── bitcoin/                # Bitcoin-related scripts and utilities
│   ├── htlc.js            # HTLC script generation
│   ├── wallet.js          # Bitcoin wallet integration
│   └── scripts/           # Bitcoin script examples
├── coordinator/            # Swap coordination service
│   ├── SwapCoordinator.js # Main coordinator logic
│   └── StateManager.js    # Swap state management
├── frontend/              # Next.js frontend application
│   ├── pages/             # Application pages
│   ├── components/        # React components
│   └── hooks/             # Custom React hooks
├── scripts/               # Deployment and utility scripts
└── test/                  # Test files
```

## 🔄 Swap Flow

1. **Initiation**: User initiates BTC→ETH swap on frontend
2. **Bitcoin Lock**: BTC locked in HTLC script with hashlock
3. **Ethereum Order**: Fusion+ order created with custom resolver
4. **Proof Submission**: Bitcoin transaction proof submitted to Ethereum
5. **Execution**: Resolver validates proof and executes ETH transfer
6. **Completion**: User receives ETH, BTC is released from HTLC

## 🧪 Testing

```bash
# Run all tests
npm test

# Test Bitcoin scripts
npm run bitcoin:test

# Deploy to testnet
npm run deploy:testnet
```

## 📚 Documentation

- [Technical Specification](./docs/technical-spec.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting](./docs/troubleshooting.md)

## 🛠️ Development

### Bitcoin Development
- Uses Bitcoin testnet for safe testing
- HTLC scripts implemented with bitcoinjs-lib
- Supports both P2SH and P2WSH scripts

### Ethereum Development
- Hardhat for contract development
- Integration with 1inch Fusion+ SDK
- Custom resolver for cross-chain verification

### Frontend Development
- Next.js with TypeScript
- RainbowKit for wallet connections
- Tailwind CSS for styling

## 🔒 Security Considerations

- **Atomic Guarantees**: Swaps are atomic - either complete or refund
- **Timelock Protection**: Automatic refunds after timeout
- **Proof Verification**: Cryptographic verification of Bitcoin transactions
- **Testnet First**: Extensive testing on testnets before mainnet

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the development team. 