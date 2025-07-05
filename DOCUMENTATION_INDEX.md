# Documentation Index - Bitcoin-Ethereum Cross-Chain Swap

## 📖 Documentation Overview

This repository contains comprehensive documentation for the Bitcoin-Ethereum cross-chain swap application using 1inch Fusion+ protocol. The documentation is organized into multiple files to provide both detailed reference material and quick access guides.

---

## 📁 Documentation Structure

### 🔍 [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
**Quick start guide with essential code snippets**
- Getting started in 5 minutes
- Most commonly used API calls
- Configuration templates
- Common workflows and troubleshooting

**Best for:** Developers who want to get up and running quickly

### 📚 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
**Complete API reference with detailed examples**
- All public APIs, functions, and components
- Detailed parameter descriptions
- Return value specifications
- Usage examples and code samples
- Configuration options
- Security considerations

**Best for:** In-depth integration and development

### 📋 [README.md](./README.md)
**Project overview and setup instructions**
- Project architecture
- Installation and setup
- Development workflow
- Testing instructions

**Best for:** Understanding the project structure and getting started

---

## 🎯 Quick Navigation

### By Component Type

#### 🔗 Smart Contracts
- **FusionResolver.sol**: [Quick Ref](./QUICK_REFERENCE.md#-smart-contract-interface) | [Full API](./API_DOCUMENTATION.md#smart-contract-api)
- Main functions: `initiateSwap()`, `completeSwap()`, `refundSwap()`
- Events: `SwapInitiated`, `SwapCompleted`, `SwapRefunded`

#### 🖥️ Backend Services
- **SwapCoordinator**: [Quick Ref](./QUICK_REFERENCE.md#-essential-api-calls) | [Full API](./API_DOCUMENTATION.md#coordinator-service-api)
- **StateManager**: [Quick Ref](./QUICK_REFERENCE.md#️-state-management) | [Full API](./API_DOCUMENTATION.md#state-manager-api)
- Key functions: Swap orchestration, state persistence, monitoring

#### ₿ Bitcoin Utilities
- **BitcoinWallet**: [Quick Ref](./QUICK_REFERENCE.md#-bitcoin-utilities) | [Full API](./API_DOCUMENTATION.md#bitcoin-utilities-api)
- **BitcoinHTLC**: [Quick Ref](./QUICK_REFERENCE.md#-bitcoin-utilities) | [Full API](./API_DOCUMENTATION.md#bitcoin-utilities-api)
- Features: Wallet management, HTLC creation, transaction handling

#### ⚛️ Frontend Components
- **SwapInterface**: [Quick Ref](./QUICK_REFERENCE.md#️-react-components) | [Full API](./API_DOCUMENTATION.md#frontend-components-api)
- **Header & Layout**: [Full API](./API_DOCUMENTATION.md#frontend-components-api)
- Features: Wallet connection, swap creation UI, progress tracking

---

## 🚀 Getting Started Paths

### 👨‍💻 For Developers

1. **Quick Start**: Begin with [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#-getting-started)
2. **Setup Environment**: Follow [Configuration Templates](./QUICK_REFERENCE.md#-configuration-templates)
3. **First Swap**: Try the [Essential API Calls](./QUICK_REFERENCE.md#-essential-api-calls)
4. **Deep Dive**: Explore [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete details

### 🏗️ For Integrators

1. **Understand Architecture**: Read [Project Overview](./API_DOCUMENTATION.md#project-overview)
2. **Review APIs**: Study [Smart Contract API](./API_DOCUMENTATION.md#smart-contract-api)
3. **Implementation**: Use [Usage Examples](./API_DOCUMENTATION.md#usage-examples)
4. **Testing**: Follow [Testing Guide](./API_DOCUMENTATION.md#testing)

### 🎨 For Frontend Developers

1. **Component Overview**: Check [Frontend Components API](./API_DOCUMENTATION.md#frontend-components-api)
2. **Integration Examples**: See [Frontend Integration](./QUICK_REFERENCE.md#-frontend-integration)
3. **Wallet Setup**: Follow [Wallet Connection](./QUICK_REFERENCE.md#wallet-connection)
4. **Error Handling**: Implement [Error Patterns](./QUICK_REFERENCE.md#-error-handling)

---

## 🔧 API Categories

### Core Swap Operations
| Function | Component | Documentation |
|----------|-----------|---------------|
| Create Swap | SwapCoordinator | [Quick](./QUICK_REFERENCE.md#1-create-a-swap) \| [Full](./API_DOCUMENTATION.md#async-initiatebtctoethswapswapparams) |
| Check Status | SwapCoordinator | [Quick](./QUICK_REFERENCE.md#2-check-swap-status) \| [Full](./API_DOCUMENTATION.md#async-getswapstatusswapid) |
| Complete Swap | SwapCoordinator | [Quick](./QUICK_REFERENCE.md#3-complete-swap) \| [Full](./API_DOCUMENTATION.md#async-completebtctoethswapswapid-bitcointxid) |

### Bitcoin Operations
| Function | Component | Documentation |
|----------|-----------|---------------|
| Generate Wallet | BitcoinWallet | [Quick](./QUICK_REFERENCE.md#generate-bitcoin-wallet) \| [Full](./API_DOCUMENTATION.md#generatekeypair) |
| Create HTLC | BitcoinHTLC | [Quick](./QUICK_REFERENCE.md#create-htlc) \| [Full](./API_DOCUMENTATION.md#createhtlcoutputhash-recipientaddress-refundaddress-locktime-amount) |
| Monitor Address | BitcoinWallet | [Quick](./QUICK_REFERENCE.md#monitor-bitcoin-address) \| [Full](./API_DOCUMENTATION.md#monitoraddressaddress-callback) |

### State Management
| Function | Component | Documentation |
|----------|-----------|---------------|
| Save State | StateManager | [Quick](./QUICK_REFERENCE.md#save--retrieve-swap-state) \| [Full](./API_DOCUMENTATION.md#async-saveswapstateswapid-swapstate) |
| Get Statistics | StateManager | [Quick](./QUICK_REFERENCE.md#get-statistics) \| [Full](./API_DOCUMENTATION.md#async-getswapstatistics) |
| Export Data | StateManager | [Quick](./QUICK_REFERENCE.md#export-data) \| [Full](./API_DOCUMENTATION.md#async-exportswapdataoptions) |

### Smart Contract Interface
| Function | Type | Documentation |
|----------|------|---------------|
| initiateSwap() | Write | [Quick](./QUICK_REFERENCE.md#key-functions) \| [Full](./API_DOCUMENTATION.md#initiateswapbytes32-swapid-address-tokenout-uint256-amountout-bytes32-bitcointxhash-bytes32-secrethash-uint256-locktime) |
| completeSwap() | Write | [Quick](./QUICK_REFERENCE.md#key-functions) \| [Full](./API_DOCUMENTATION.md#completeswapbytes32-swapid-bytes32-secret-bytes-calldata-bitcointxproof-bytes32-calldata-merkleproof) |
| getSwapOrder() | Read | [Quick](./QUICK_REFERENCE.md#key-functions) \| [Full](./API_DOCUMENTATION.md#getswaporderbytes32-swapid--swaporder) |

---

## 📊 Feature Matrix

### Supported Operations
| Feature | Available | Documentation |
|---------|-----------|---------------|
| BTC → ETH Swaps | ✅ | [Swap Operations](./API_DOCUMENTATION.md#coordinator-service-api) |
| BTC → ERC20 Swaps | ✅ | [1inch Integration](./API_DOCUMENTATION.md#async-get1inchquotetokenaddress-amount-useraddress) |
| Atomic Guarantees | ✅ | [HTLC Implementation](./API_DOCUMENTATION.md#bitcoin-utilities-api) |
| Automatic Refunds | ✅ | [Timeout Handling](./API_DOCUMENTATION.md#async-handleswaptimeoutswapid) |
| State Persistence | ✅ | [State Management](./API_DOCUMENTATION.md#state-manager-api) |
| Frontend UI | ✅ | [React Components](./API_DOCUMENTATION.md#frontend-components-api) |

### Network Support
| Network | Bitcoin | Ethereum | Status |
|---------|---------|----------|--------|
| Testnet | ✅ | ✅ (Sepolia) | Fully Supported |
| Mainnet | ✅ | ✅ | Production Ready |

---

## 🛠️ Development Resources

### Code Examples
- **Complete Workflows**: [API_DOCUMENTATION.md#usage-examples](./API_DOCUMENTATION.md#usage-examples)
- **Quick Snippets**: [QUICK_REFERENCE.md#common-workflows](./QUICK_REFERENCE.md#-common-workflows)
- **Error Handling**: [QUICK_REFERENCE.md#error-handling](./QUICK_REFERENCE.md#-error-handling)

### Configuration
- **Environment Setup**: [QUICK_REFERENCE.md#configuration-templates](./QUICK_REFERENCE.md#-configuration-templates)
- **Network Config**: [API_DOCUMENTATION.md#configuration](./API_DOCUMENTATION.md#configuration)
- **Security Settings**: [API_DOCUMENTATION.md#security-considerations](./API_DOCUMENTATION.md#security-considerations)

### Testing
- **Test Examples**: [API_DOCUMENTATION.md#testing](./API_DOCUMENTATION.md#testing)
- **Mock Data**: [QUICK_REFERENCE.md#testing-helpers](./QUICK_REFERENCE.md#-testing-helpers)
- **Debug Mode**: [QUICK_REFERENCE.md#troubleshooting](./QUICK_REFERENCE.md#-troubleshooting)

---

## 🔍 Search Guide

### Find Information By:

**Use Case**
- Creating swaps → [Essential API Calls](./QUICK_REFERENCE.md#-essential-api-calls)
- Frontend integration → [React Components](./QUICK_REFERENCE.md#️-react-components)
- Bitcoin operations → [Bitcoin Utilities](./QUICK_REFERENCE.md#-bitcoin-utilities)
- Error handling → [Error Handling](./QUICK_REFERENCE.md#-error-handling)

**Component**
- Smart contracts → [Smart Contract API](./API_DOCUMENTATION.md#smart-contract-api)
- Backend services → [Coordinator Service API](./API_DOCUMENTATION.md#coordinator-service-api)
- State management → [State Manager API](./API_DOCUMENTATION.md#state-manager-api)
- Frontend UI → [Frontend Components API](./API_DOCUMENTATION.md#frontend-components-api)

**Function Name**
- Use Ctrl+F to search within documentation files
- Function names are consistently formatted across all docs

---

## 📞 Support & Contributing

### Getting Help
1. Check [Troubleshooting](./QUICK_REFERENCE.md#-troubleshooting) for common issues
2. Review [Error Handling](./API_DOCUMENTATION.md#error-handling) for error codes
3. Examine [Usage Examples](./API_DOCUMENTATION.md#usage-examples) for patterns

### Contributing
1. Follow the [Development Guide](./README.md)
2. Review [Security Considerations](./API_DOCUMENTATION.md#security-considerations)
3. Add tests as described in [Testing](./API_DOCUMENTATION.md#testing)

---

## 🔄 Documentation Updates

This documentation covers **all public APIs, functions, and components** as of the current version. For the latest updates:

1. Check the repository for code changes
2. Review commit messages for API modifications
3. Update environment configurations as needed

**Last Updated**: Generated from current codebase analysis  
**Coverage**: 100% of public APIs and components  
**Examples**: All major use cases and workflows included

---

## 📚 Quick Links

| Resource | Purpose | Link |
|----------|---------|------|
| Quick Start | Get running in minutes | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| Complete API | Full reference | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) |
| Project Setup | Installation & config | [README.md](./README.md) |
| Environment Example | Configuration template | [env.example](./env.example) |

**Happy coding!** 🚀