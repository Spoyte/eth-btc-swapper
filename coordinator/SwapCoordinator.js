const { ethers } = require('ethers');
const BitcoinHTLC = require('../bitcoin/htlc');
const BitcoinWallet = require('../bitcoin/wallet');
const StateManager = require('./StateManager');
const axios = require('axios');

/**
 * SwapCoordinator - Orchestrates atomic swaps between Bitcoin and Ethereum
 * Manages the complete lifecycle of cross-chain swaps using HTLC and 1inch Fusion+
 */
class SwapCoordinator {
  constructor(config) {
    this.config = {
      bitcoinNetwork: config.bitcoinNetwork || 'testnet',
      ethereumNetwork: config.ethereumNetwork || 'sepolia',
      ethereumRpcUrl: config.ethereumRpcUrl,
      fusionResolverAddress: config.fusionResolverAddress,
      privateKey: config.privateKey,
      oneinchApiKey: config.oneinchApiKey,
      oneinchBaseUrl: config.oneinchBaseUrl || 'https://api.1inch.dev',
      ...config
    };

    // Initialize components
    this.bitcoinHTLC = new BitcoinHTLC(this.config.bitcoinNetwork);
    this.bitcoinWallet = new BitcoinWallet(this.config.bitcoinNetwork);
    this.stateManager = new StateManager();
    
    // Initialize Ethereum provider and contract
    this.ethereumProvider = new ethers.JsonRpcProvider(this.config.ethereumRpcUrl);
    this.ethereumWallet = new ethers.Wallet(this.config.privateKey, this.ethereumProvider);
    
    // Load contract ABI (simplified for demo)
    this.fusionResolverContract = new ethers.Contract(
      this.config.fusionResolverAddress,
      this.getFusionResolverABI(),
      this.ethereumWallet
    );

    // Event listeners
    this.setupEventListeners();
  }

  /**
   * Initiate a BTC to ETH/ERC20 swap
   * @param {Object} swapParams - Swap parameters
   * @returns {Promise<Object>} Swap details
   */
  async initiateBTCToETHSwap(swapParams) {
    const {
      btcAmount,
      ethTokenAddress,
      ethAmount,
      userBtcAddress,
      userEthAddress,
      lockTime
    } = swapParams;

    try {
      // Generate unique swap ID
      const swapId = this.generateSwapId();
      
      // Generate secret and hash for HTLC
      const { secret, hash } = this.bitcoinHTLC.generateSecret();
      
      // Create Bitcoin HTLC
      const htlcOutput = this.bitcoinHTLC.createHTLCOutput(
        hash,
        userBtcAddress,
        this.config.serviceBtcAddress, // Service address for refund
        lockTime,
        btcAmount
      );

      // Get 1inch quote for ETH side
      const ethQuote = await this.get1inchQuote(
        ethTokenAddress,
        ethAmount,
        userEthAddress
      );

      // Create swap state
      const swapState = {
        swapId,
        status: 'initiated',
        btcSide: {
          amount: btcAmount,
          userAddress: userBtcAddress,
          htlcAddress: htlcOutput.address,
          htlcScript: htlcOutput.script.toString('hex'),
          secret: secret.toString('hex'),
          secretHash: hash.toString('hex'),
          lockTime
        },
        ethSide: {
          tokenAddress: ethTokenAddress,
          amount: ethAmount,
          userAddress: userEthAddress,
          quote: ethQuote
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      // Save swap state
      await this.stateManager.saveSwapState(swapId, swapState);

      // Initiate Ethereum side
      await this.initiateEthereumSwap(swapState);

      return {
        swapId,
        btcHtlcAddress: htlcOutput.address,
        secretHash: hash.toString('hex'),
        lockTime,
        ethQuote
      };

    } catch (error) {
      console.error('Error initiating BTC to ETH swap:', error);
      throw error;
    }
  }

  /**
   * Complete swap when Bitcoin HTLC is funded
   * @param {string} swapId - Swap identifier
   * @param {string} bitcoinTxId - Bitcoin transaction ID
   * @returns {Promise<Object>} Completion result
   */
  async completeBTCToETHSwap(swapId, bitcoinTxId) {
    try {
      const swapState = await this.stateManager.getSwapState(swapId);
      if (!swapState) {
        throw new Error('Swap not found');
      }

      // Verify Bitcoin transaction
      const btcTx = await this.bitcoinWallet.getTransaction(bitcoinTxId);
      if (!btcTx) {
        throw new Error('Bitcoin transaction not found');
      }

      // Wait for confirmations
      await this.waitForBitcoinConfirmations(bitcoinTxId, 3);

      // Extract secret from Bitcoin transaction
      const secret = this.bitcoinHTLC.extractSecretFromTransaction(
        btcTx.hex,
        Buffer.from(swapState.btcSide.secretHash, 'hex')
      );

      if (!secret) {
        throw new Error('Secret not found in Bitcoin transaction');
      }

      // Complete Ethereum swap
      const ethTxHash = await this.completeEthereumSwap(
        swapId,
        secret,
        bitcoinTxId
      );

      // Update swap state
      swapState.status = 'completed';
      swapState.btcTxId = bitcoinTxId;
      swapState.ethTxHash = ethTxHash;
      swapState.completedAt = Date.now();
      
      await this.stateManager.saveSwapState(swapId, swapState);

      return {
        swapId,
        status: 'completed',
        btcTxId: bitcoinTxId,
        ethTxHash,
        secret: secret.toString('hex')
      };

    } catch (error) {
      console.error('Error completing BTC to ETH swap:', error);
      throw error;
    }
  }

  /**
   * Initiate Ethereum side of the swap
   * @param {Object} swapState - Swap state
   * @returns {Promise<string>} Transaction hash
   */
  async initiateEthereumSwap(swapState) {
    try {
      const tx = await this.fusionResolverContract.initiateSwap(
        swapState.swapId,
        swapState.ethSide.tokenAddress,
        ethers.parseEther(swapState.ethSide.amount.toString()),
        ethers.zeroPadValue(swapState.btcSide.secretHash, 32),
        swapState.btcSide.lockTime
      );

      await tx.wait();
      return tx.hash;

    } catch (error) {
      console.error('Error initiating Ethereum swap:', error);
      throw error;
    }
  }

  /**
   * Complete Ethereum side of the swap
   * @param {string} swapId - Swap identifier
   * @param {Buffer} secret - The secret
   * @param {string} bitcoinTxId - Bitcoin transaction ID
   * @returns {Promise<string>} Transaction hash
   */
  async completeEthereumSwap(swapId, secret, bitcoinTxId) {
    try {
      // Create Bitcoin transaction proof (simplified)
      const bitcoinTxProof = await this.createBitcoinTxProof(bitcoinTxId);
      
      const tx = await this.fusionResolverContract.completeSwap(
        swapId,
        ethers.zeroPadValue(secret, 32),
        bitcoinTxProof.txData,
        bitcoinTxProof.merkleProof
      );

      await tx.wait();
      return tx.hash;

    } catch (error) {
      console.error('Error completing Ethereum swap:', error);
      throw error;
    }
  }

  /**
   * Get 1inch quote for token swap
   * @param {string} tokenAddress - Token address
   * @param {number} amount - Amount to swap
   * @param {string} userAddress - User address
   * @returns {Promise<Object>} Quote details
   */
  async get1inchQuote(tokenAddress, amount, userAddress) {
    try {
      const chainId = this.config.ethereumNetwork === 'mainnet' ? 1 : 11155111; // Sepolia
      const url = `${this.config.oneinchBaseUrl}/swap/v5.0/${chainId}/quote`;
      
      const params = {
        fromTokenAddress: tokenAddress,
        toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
        amount: ethers.parseEther(amount.toString()).toString(),
        fromAddress: userAddress,
      };

      const response = await axios.get(url, {
        params,
        headers: {
          'Authorization': `Bearer ${this.config.oneinchApiKey}`,
        },
      });

      return response.data;

    } catch (error) {
      console.error('Error getting 1inch quote:', error);
      throw error;
    }
  }

  /**
   * Wait for Bitcoin confirmations
   * @param {string} txId - Transaction ID
   * @param {number} confirmations - Required confirmations
   * @returns {Promise<void>}
   */
  async waitForBitcoinConfirmations(txId, confirmations) {
    return new Promise((resolve, reject) => {
      const checkConfirmations = async () => {
        try {
          const tx = await this.bitcoinWallet.getTransaction(txId);
          if (tx && tx.confirmations >= confirmations) {
            resolve();
          } else {
            setTimeout(checkConfirmations, 30000); // Check every 30 seconds
          }
        } catch (error) {
          reject(error);
        }
      };

      checkConfirmations();
    });
  }

  /**
   * Create Bitcoin transaction proof
   * @param {string} txId - Transaction ID
   * @returns {Promise<Object>} Transaction proof
   */
  async createBitcoinTxProof(txId) {
    try {
      // This is a simplified implementation
      // In production, you'd create a proper SPV proof
      const tx = await this.bitcoinWallet.getTransaction(txId);
      const txHex = await this.bitcoinWallet.getTransactionHex(txId);
      
      return {
        txData: ethers.hexlify(txHex),
        merkleProof: [ethers.keccak256(txHex)], // Simplified merkle proof
        blockHeader: '0x' + '00'.repeat(80), // Placeholder block header
      };

    } catch (error) {
      console.error('Error creating Bitcoin transaction proof:', error);
      throw error;
    }
  }

  /**
   * Handle swap timeout/refund
   * @param {string} swapId - Swap identifier
   * @returns {Promise<Object>} Refund result
   */
  async handleSwapTimeout(swapId) {
    try {
      const swapState = await this.stateManager.getSwapState(swapId);
      if (!swapState) {
        throw new Error('Swap not found');
      }

      if (Date.now() > swapState.expiresAt) {
        // Refund Ethereum side
        const ethTx = await this.fusionResolverContract.refundSwap(
          swapId,
          'Swap timeout'
        );
        await ethTx.wait();

        // Update swap state
        swapState.status = 'refunded';
        swapState.refundedAt = Date.now();
        swapState.ethRefundTxHash = ethTx.hash;
        
        await this.stateManager.saveSwapState(swapId, swapState);

        return {
          swapId,
          status: 'refunded',
          ethRefundTxHash: ethTx.hash
        };
      }

      throw new Error('Swap not expired yet');

    } catch (error) {
      console.error('Error handling swap timeout:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for contract events
   */
  setupEventListeners() {
    // Listen for swap events
    this.fusionResolverContract.on('SwapInitiated', (swapId, user, tokenOut, amountOut, bitcoinTxHash, lockTime) => {
      console.log('Swap initiated:', { swapId, user, tokenOut, amountOut });
    });

    this.fusionResolverContract.on('SwapCompleted', (swapId, user, secret, bitcoinTxHash) => {
      console.log('Swap completed:', { swapId, user, secret });
    });

    this.fusionResolverContract.on('SwapRefunded', (swapId, user, reason) => {
      console.log('Swap refunded:', { swapId, user, reason });
    });
  }

  /**
   * Generate unique swap ID
   * @returns {string} Unique swap ID
   */
  generateSwapId() {
    return ethers.keccak256(
      ethers.toUtf8Bytes(
        `${Date.now()}-${Math.random()}-${this.ethereumWallet.address}`
      )
    );
  }

  /**
   * Get Fusion Resolver ABI (simplified)
   * @returns {Array} Contract ABI
   */
  getFusionResolverABI() {
    return [
      "function initiateSwap(bytes32 swapId, address tokenOut, uint256 amountOut, bytes32 secretHash, uint256 lockTime) external",
      "function completeSwap(bytes32 swapId, bytes32 secret, bytes calldata bitcoinTxProof, bytes32[] calldata merkleProof) external",
      "function refundSwap(bytes32 swapId, string calldata reason) external",
      "function getSwapOrder(bytes32 swapId) external view returns (tuple(address user, address tokenOut, uint256 amountOut, bytes32 bitcoinTxHash, bytes32 secretHash, uint256 lockTime, uint256 createdAt, uint8 status))",
      "event SwapInitiated(bytes32 indexed swapId, address indexed user, address tokenOut, uint256 amountOut, bytes32 bitcoinTxHash, uint256 lockTime)",
      "event SwapCompleted(bytes32 indexed swapId, address indexed user, bytes32 secret, bytes32 bitcoinTxHash)",
      "event SwapRefunded(bytes32 indexed swapId, address indexed user, string reason)"
    ];
  }

  /**
   * Get swap status
   * @param {string} swapId - Swap identifier
   * @returns {Promise<Object>} Swap status
   */
  async getSwapStatus(swapId) {
    try {
      const swapState = await this.stateManager.getSwapState(swapId);
      if (!swapState) {
        throw new Error('Swap not found');
      }

      // Get on-chain status
      const onChainOrder = await this.fusionResolverContract.getSwapOrder(swapId);
      
      return {
        swapId,
        status: swapState.status,
        btcSide: swapState.btcSide,
        ethSide: swapState.ethSide,
        onChainStatus: onChainOrder.status,
        createdAt: swapState.createdAt,
        expiresAt: swapState.expiresAt,
        completedAt: swapState.completedAt,
        refundedAt: swapState.refundedAt
      };

    } catch (error) {
      console.error('Error getting swap status:', error);
      throw error;
    }
  }

  /**
   * Monitor active swaps for timeouts
   */
  async monitorSwaps() {
    const activeSwaps = await this.stateManager.getActiveSwaps();
    
    for (const swap of activeSwaps) {
      if (Date.now() > swap.expiresAt && swap.status === 'initiated') {
        try {
          await this.handleSwapTimeout(swap.swapId);
        } catch (error) {
          console.error(`Error handling timeout for swap ${swap.swapId}:`, error);
        }
      }
    }
  }

  /**
   * Start monitoring service
   */
  startMonitoring() {
    // Monitor swaps every 5 minutes
    setInterval(() => {
      this.monitorSwaps();
    }, 5 * 60 * 1000);

    console.log('Swap monitoring started');
  }
}

module.exports = SwapCoordinator; 