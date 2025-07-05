const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto');
const ECPair = require('ecpair');
const tinysecp256k1 = require('tiny-secp256k1');

// Initialize ECPair factory
const ECPairFactory = ECPair.ECPairFactory(tinysecp256k1);

/**
 * Bitcoin HTLC (Hash Time Lock Contract) Implementation
 * Enables atomic swaps between Bitcoin and Ethereum
 */
class BitcoinHTLC {
  constructor(network = 'testnet') {
    this.network = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
  }

  /**
   * Generate a new secret and its hash
   * @returns {Object} {secret: Buffer, hash: Buffer}
   */
  generateSecret() {
    const secret = crypto.randomBytes(32);
    const hash = crypto.createHash('sha256').update(secret).digest();
    return { secret, hash };
  }

  /**
   * Create HTLC script
   * @param {Buffer} hash - SHA256 hash of the secret
   * @param {Buffer} recipientPubKey - Recipient's public key
   * @param {Buffer} refundPubKey - Refund public key (sender)
   * @param {number} lockTime - Lock time in blocks
   * @returns {Buffer} HTLC script
   */
  createHTLCScript(hash, recipientPubKey, refundPubKey, lockTime) {
    const script = bitcoin.script.compile([
      bitcoin.opcodes.OP_IF,
        bitcoin.opcodes.OP_SHA256,
        hash,
        bitcoin.opcodes.OP_EQUALVERIFY,
        recipientPubKey,
        bitcoin.opcodes.OP_CHECKSIG,
      bitcoin.opcodes.OP_ELSE,
        bitcoin.script.number.encode(lockTime),
        bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
        bitcoin.opcodes.OP_DROP,
        refundPubKey,
        bitcoin.opcodes.OP_CHECKSIG,
      bitcoin.opcodes.OP_ENDIF,
    ]);
    return script;
  }

  /**
   * Create P2SH address from HTLC script
   * @param {Buffer} script - HTLC script
   * @returns {string} P2SH address
   */
  createP2SHAddress(script) {
    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: script },
      network: this.network,
    });
    return p2sh.address;
  }

  /**
   * Create HTLC transaction output
   * @param {Buffer} hash - SHA256 hash of the secret
   * @param {string} recipientAddress - Recipient's address
   * @param {string} refundAddress - Refund address
   * @param {number} lockTime - Lock time in blocks
   * @param {number} amount - Amount in satoshis
   * @returns {Object} HTLC transaction details
   */
  createHTLCOutput(hash, recipientAddress, refundAddress, lockTime, amount) {
    // Convert addresses to public keys (simplified - in real implementation, you'd need proper key derivation)
    const recipientPubKey = this.addressToPubKey(recipientAddress);
    const refundPubKey = this.addressToPubKey(refundAddress);
    
    const script = this.createHTLCScript(hash, recipientPubKey, refundPubKey, lockTime);
    const address = this.createP2SHAddress(script);
    
    return {
      script,
      address,
      amount,
      lockTime,
      hash: hash.toString('hex'),
    };
  }

  /**
   * Create claim transaction (recipient claims with secret)
   * @param {Object} htlcOutput - HTLC output details
   * @param {Buffer} secret - The secret
   * @param {string} recipientPrivateKey - Recipient's private key
   * @param {string} destinationAddress - Where to send the funds
   * @param {Array} utxos - UTXOs to spend
   * @returns {Object} Signed transaction
   */
  createClaimTransaction(htlcOutput, secret, recipientPrivateKey, destinationAddress, utxos) {
    const keyPair = ECPairFactory.fromWIF(recipientPrivateKey, this.network);
    const psbt = new bitcoin.Psbt({ network: this.network });

    // Add inputs
    utxos.forEach(utxo => {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: Buffer.from(utxo.scriptPubKey, 'hex'),
          value: utxo.value,
        },
        redeemScript: htlcOutput.script,
      });
    });

    // Add output
    const fee = 1000; // 1000 satoshis fee
    const outputAmount = htlcOutput.amount - fee;
    psbt.addOutput({
      address: destinationAddress,
      value: outputAmount,
    });

    // Sign inputs
    utxos.forEach((_, index) => {
      const witnessScript = bitcoin.script.compile([
        secret, // Push secret
        bitcoin.opcodes.OP_TRUE, // Choose IF branch
      ]);
      
      psbt.signInput(index, keyPair);
      psbt.finalizeInput(index, (inputIndex, input) => {
        const redeemPayment = bitcoin.payments.p2sh({
          redeem: {
            output: htlcOutput.script,
            input: witnessScript,
          },
        });
        return {
          finalScriptSig: redeemPayment.input,
        };
      });
    });

    return psbt.extractTransaction();
  }

  /**
   * Create refund transaction (sender reclaims after timeout)
   * @param {Object} htlcOutput - HTLC output details
   * @param {string} refundPrivateKey - Refund private key
   * @param {string} refundAddress - Where to send the refund
   * @param {Array} utxos - UTXOs to spend
   * @returns {Object} Signed transaction
   */
  createRefundTransaction(htlcOutput, refundPrivateKey, refundAddress, utxos) {
    const keyPair = ECPairFactory.fromWIF(refundPrivateKey, this.network);
    const psbt = new bitcoin.Psbt({ network: this.network });

    // Set locktime
    psbt.setLocktime(htlcOutput.lockTime);

    // Add inputs
    utxos.forEach(utxo => {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        sequence: 0xfffffffe, // Enable locktime
        witnessUtxo: {
          script: Buffer.from(utxo.scriptPubKey, 'hex'),
          value: utxo.value,
        },
        redeemScript: htlcOutput.script,
      });
    });

    // Add output
    const fee = 1000; // 1000 satoshis fee
    const outputAmount = htlcOutput.amount - fee;
    psbt.addOutput({
      address: refundAddress,
      value: outputAmount,
    });

    // Sign inputs
    utxos.forEach((_, index) => {
      const witnessScript = bitcoin.script.compile([
        bitcoin.opcodes.OP_FALSE, // Choose ELSE branch
      ]);
      
      psbt.signInput(index, keyPair);
      psbt.finalizeInput(index, (inputIndex, input) => {
        const redeemPayment = bitcoin.payments.p2sh({
          redeem: {
            output: htlcOutput.script,
            input: witnessScript,
          },
        });
        return {
          finalScriptSig: redeemPayment.input,
        };
      });
    });

    return psbt.extractTransaction();
  }

  /**
   * Verify if a transaction reveals the secret
   * @param {string} txHex - Transaction hex
   * @param {Buffer} expectedHash - Expected hash of the secret
   * @returns {Buffer|null} Secret if found, null otherwise
   */
  extractSecretFromTransaction(txHex, expectedHash) {
    const tx = bitcoin.Transaction.fromHex(txHex);
    
    for (const input of tx.ins) {
      const script = bitcoin.script.decompile(input.script);
      if (script && script.length > 0) {
        const potentialSecret = script[0];
        if (Buffer.isBuffer(potentialSecret) && potentialSecret.length === 32) {
          const hash = crypto.createHash('sha256').update(potentialSecret).digest();
          if (hash.equals(expectedHash)) {
            return potentialSecret;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Helper function to convert address to public key
   * Note: This is a simplified version. In production, you'd need proper key management
   * @param {string} address - Bitcoin address
   * @returns {Buffer} Public key
   */
  addressToPubKey(address) {
    // This is a placeholder - in real implementation, you'd need to derive the public key
    // from the address or maintain a mapping of addresses to public keys
    return Buffer.alloc(33); // Placeholder 33-byte public key
  }

  /**
   * Get current block height (mock implementation)
   * @returns {Promise<number>} Current block height
   */
  async getCurrentBlockHeight() {
    // In real implementation, this would query the Bitcoin network
    return 800000; // Mock block height
  }

  /**
   * Broadcast transaction (mock implementation)
   * @param {string} txHex - Transaction hex
   * @returns {Promise<string>} Transaction ID
   */
  async broadcastTransaction(txHex) {
    // In real implementation, this would broadcast to the Bitcoin network
    const tx = bitcoin.Transaction.fromHex(txHex);
    return tx.getId();
  }
}

module.exports = BitcoinHTLC; 