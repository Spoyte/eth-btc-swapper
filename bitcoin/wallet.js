const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
const ECPair = require('ecpair');
const tinysecp256k1 = require('tiny-secp256k1');

// Initialize ECPair factory
const ECPairFactory = ECPair.ECPairFactory(tinysecp256k1);

/**
 * Bitcoin Wallet Integration for Cross-Chain Swaps
 * Handles Bitcoin transactions, UTXOs, and network communication
 */
class BitcoinWallet {
  constructor(network = 'testnet', rpcConfig = null) {
    this.network = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    this.networkName = network;
    this.rpcConfig = rpcConfig || {
      url: process.env.BITCOIN_RPC_URL || 'http://localhost:18332',
      user: process.env.BITCOIN_RPC_USER || 'bitcoin',
      pass: process.env.BITCOIN_RPC_PASS || 'bitcoin',
    };
    
    // Use public APIs for testnet if no RPC config
    this.usePublicAPI = !rpcConfig && network === 'testnet';
    this.apiBaseUrl = network === 'testnet' 
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
  }

  /**
   * Generate a new Bitcoin key pair
   * @returns {Object} {privateKey: string, publicKey: string, address: string}
   */
  generateKeyPair() {
    const keyPair = ECPairFactory.makeRandom({ network: this.network });
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey, 
      network: this.network 
    });
    
    return {
      privateKey: keyPair.toWIF(),
      publicKey: keyPair.publicKey.toString('hex'),
      address,
      keyPair,
    };
  }

  /**
   * Import private key
   * @param {string} privateKeyWIF - Private key in WIF format
   * @returns {Object} Key pair and address
   */
  importPrivateKey(privateKeyWIF) {
    const keyPair = ECPairFactory.fromWIF(privateKeyWIF, this.network);
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey, 
      network: this.network 
    });
    
    return {
      privateKey: privateKeyWIF,
      publicKey: keyPair.publicKey.toString('hex'),
      address,
      keyPair,
    };
  }

  /**
   * Get UTXOs for an address
   * @param {string} address - Bitcoin address
   * @returns {Promise<Array>} Array of UTXOs
   */
  async getUTXOs(address) {
    try {
      if (this.usePublicAPI) {
        const response = await axios.get(`${this.apiBaseUrl}/address/${address}/utxo`);
        return response.data.map(utxo => ({
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.value,
          scriptPubKey: '', // Will be fetched separately if needed
          confirmations: utxo.status.confirmed ? utxo.status.block_height : 0,
        }));
      } else {
        // Use Bitcoin Core RPC
        const result = await this.rpcCall('listunspent', [0, 9999999, [address]]);
        return result.map(utxo => ({
          txid: utxo.txid,
          vout: utxo.vout,
          value: Math.round(utxo.amount * 100000000), // Convert BTC to satoshis
          scriptPubKey: utxo.scriptPubKey,
          confirmations: utxo.confirmations,
        }));
      }
    } catch (error) {
      console.error('Error fetching UTXOs:', error);
      throw error;
    }
  }

  /**
   * Get transaction details
   * @param {string} txid - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransaction(txid) {
    try {
      if (this.usePublicAPI) {
        const response = await axios.get(`${this.apiBaseUrl}/tx/${txid}`);
        return response.data;
      } else {
        return await this.rpcCall('gettransaction', [txid]);
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Get current block height
   * @returns {Promise<number>} Current block height
   */
  async getBlockHeight() {
    try {
      if (this.usePublicAPI) {
        const response = await axios.get(`${this.apiBaseUrl}/blocks/tip/height`);
        return response.data;
      } else {
        return await this.rpcCall('getblockcount');
      }
    } catch (error) {
      console.error('Error fetching block height:', error);
      throw error;
    }
  }

  /**
   * Estimate transaction fee
   * @param {number} numInputs - Number of inputs
   * @param {number} numOutputs - Number of outputs
   * @param {number} feeRate - Fee rate in sat/vB (optional)
   * @returns {Promise<number>} Estimated fee in satoshis
   */
  async estimateFee(numInputs, numOutputs, feeRate = null) {
    try {
      if (!feeRate) {
        if (this.usePublicAPI) {
          const response = await axios.get(`${this.apiBaseUrl}/fee-estimates`);
          feeRate = response.data['6'] || 10; // 6 block target or fallback to 10 sat/vB
        } else {
          const result = await this.rpcCall('estimatesmartfee', [6]);
          feeRate = result.feerate ? Math.round(result.feerate * 100000000 / 1000) : 10;
        }
      }

      // Estimate transaction size
      const inputSize = 148; // Typical P2PKH input size
      const outputSize = 34; // Typical P2PKH output size
      const overhead = 10; // Transaction overhead
      
      const estimatedSize = (numInputs * inputSize) + (numOutputs * outputSize) + overhead;
      return Math.round(estimatedSize * feeRate);
    } catch (error) {
      console.error('Error estimating fee:', error);
      return 10000; // Fallback fee
    }
  }

  /**
   * Create a simple transaction
   * @param {Array} utxos - Input UTXOs
   * @param {Array} outputs - Output addresses and amounts
   * @param {string} changeAddress - Change address
   * @param {number} feeRate - Fee rate in sat/vB
   * @returns {Promise<Object>} Unsigned transaction
   */
  async createTransaction(utxos, outputs, changeAddress, feeRate = 10) {
    const psbt = new bitcoin.Psbt({ network: this.network });
    
    // Add inputs
    let totalInput = 0;
    for (const utxo of utxos) {
      const txHex = await this.getTransactionHex(utxo.txid);
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(txHex, 'hex'),
      });
      totalInput += utxo.value;
    }

    // Add outputs
    let totalOutput = 0;
    outputs.forEach(output => {
      psbt.addOutput({
        address: output.address,
        value: output.value,
      });
      totalOutput += output.value;
    });

    // Calculate fee
    const estimatedFee = await this.estimateFee(utxos.length, outputs.length + 1, feeRate);
    const changeAmount = totalInput - totalOutput - estimatedFee;

    // Add change output if necessary
    if (changeAmount > 546) { // Dust threshold
      psbt.addOutput({
        address: changeAddress,
        value: changeAmount,
      });
    }

    return psbt;
  }

  /**
   * Sign transaction
   * @param {Object} psbt - Partially Signed Bitcoin Transaction
   * @param {Array} privateKeys - Array of private keys (WIF format)
   * @returns {Object} Signed transaction
   */
  signTransaction(psbt, privateKeys) {
    privateKeys.forEach(privateKeyWIF => {
      const keyPair = ECPairFactory.fromWIF(privateKeyWIF, this.network);
      
      // Sign all inputs that can be signed with this key
      for (let i = 0; i < psbt.inputCount; i++) {
        try {
          psbt.signInput(i, keyPair);
        } catch (error) {
          // Input might not be signable with this key, continue
        }
      }
    });

    psbt.finalizeAllInputs();
    return psbt.extractTransaction();
  }

  /**
   * Broadcast transaction
   * @param {string} txHex - Transaction hex
   * @returns {Promise<string>} Transaction ID
   */
  async broadcastTransaction(txHex) {
    try {
      if (this.usePublicAPI) {
        const response = await axios.post(`${this.apiBaseUrl}/tx`, txHex, {
          headers: { 'Content-Type': 'text/plain' },
        });
        return response.data;
      } else {
        return await this.rpcCall('sendrawtransaction', [txHex]);
      }
    } catch (error) {
      console.error('Error broadcasting transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction hex
   * @param {string} txid - Transaction ID
   * @returns {Promise<string>} Transaction hex
   */
  async getTransactionHex(txid) {
    try {
      if (this.usePublicAPI) {
        const response = await axios.get(`${this.apiBaseUrl}/tx/${txid}/hex`);
        return response.data;
      } else {
        const result = await this.rpcCall('getrawtransaction', [txid]);
        return result;
      }
    } catch (error) {
      console.error('Error fetching transaction hex:', error);
      throw error;
    }
  }

  /**
   * Monitor address for transactions
   * @param {string} address - Bitcoin address to monitor
   * @param {Function} callback - Callback function for new transactions
   * @returns {Function} Stop monitoring function
   */
  monitorAddress(address, callback) {
    let lastTxCount = 0;
    
    const checkForNewTx = async () => {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/address/${address}/txs`);
        const currentTxCount = response.data.length;
        
        if (currentTxCount > lastTxCount) {
          const newTxs = response.data.slice(0, currentTxCount - lastTxCount);
          newTxs.forEach(tx => callback(tx));
          lastTxCount = currentTxCount;
        }
      } catch (error) {
        console.error('Error monitoring address:', error);
      }
    };

    const interval = setInterval(checkForNewTx, 30000); // Check every 30 seconds
    
    // Initial check
    checkForNewTx();
    
    return () => clearInterval(interval);
  }

  /**
   * Make RPC call to Bitcoin Core
   * @param {string} method - RPC method
   * @param {Array} params - RPC parameters
   * @returns {Promise<any>} RPC result
   */
  async rpcCall(method, params = []) {
    try {
      const response = await axios.post(this.rpcConfig.url, {
        jsonrpc: '1.0',
        id: 'bitcoin-wallet',
        method,
        params,
      }, {
        auth: {
          username: this.rpcConfig.user,
          password: this.rpcConfig.pass,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      console.error('RPC call error:', error);
      throw error;
    }
  }

  /**
   * Convert satoshis to BTC
   * @param {number} satoshis - Amount in satoshis
   * @returns {number} Amount in BTC
   */
  satoshisToBTC(satoshis) {
    return satoshis / 100000000;
  }

  /**
   * Convert BTC to satoshis
   * @param {number} btc - Amount in BTC
   * @returns {number} Amount in satoshis
   */
  btcToSatoshis(btc) {
    return Math.round(btc * 100000000);
  }
}

module.exports = BitcoinWallet; 