const fs = require('fs').promises;
const path = require('path');

/**
 * StateManager - Manages swap state persistence and retrieval
 * Handles local storage of swap states with backup and recovery
 */
class StateManager {
  constructor(config = {}) {
    this.config = {
      dataDir: config.dataDir || './data',
      backupDir: config.backupDir || './data/backups',
      maxBackups: config.maxBackups || 10,
      ...config
    };
    
    this.swapStates = new Map();
    this.initialized = false;
    
    this.initialize();
  }

  /**
   * Initialize the state manager
   */
  async initialize() {
    try {
      // Create data directories if they don't exist
      await fs.mkdir(this.config.dataDir, { recursive: true });
      await fs.mkdir(this.config.backupDir, { recursive: true });
      
      // Load existing swap states
      await this.loadSwapStates();
      
      this.initialized = true;
      console.log('StateManager initialized successfully');
    } catch (error) {
      console.error('Error initializing StateManager:', error);
      throw error;
    }
  }

  /**
   * Save swap state to persistent storage
   * @param {string} swapId - Swap identifier
   * @param {Object} swapState - Swap state object
   */
  async saveSwapState(swapId, swapState) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Update in-memory state
      this.swapStates.set(swapId, {
        ...swapState,
        lastUpdated: Date.now()
      });

      // Save to file
      const filePath = path.join(this.config.dataDir, `swap_${swapId}.json`);
      await fs.writeFile(filePath, JSON.stringify(swapState, null, 2));

      // Create backup
      await this.createBackup(swapId, swapState);

      console.log(`Swap state saved for ${swapId}`);
    } catch (error) {
      console.error(`Error saving swap state for ${swapId}:`, error);
      throw error;
    }
  }

  /**
   * Get swap state from storage
   * @param {string} swapId - Swap identifier
   * @returns {Promise<Object|null>} Swap state or null if not found
   */
  async getSwapState(swapId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Check in-memory first
      if (this.swapStates.has(swapId)) {
        return this.swapStates.get(swapId);
      }

      // Load from file
      const filePath = path.join(this.config.dataDir, `swap_${swapId}.json`);
      try {
        const data = await fs.readFile(filePath, 'utf8');
        const swapState = JSON.parse(data);
        
        // Update in-memory cache
        this.swapStates.set(swapId, swapState);
        
        return swapState;
      } catch (fileError) {
        if (fileError.code === 'ENOENT') {
          return null; // File doesn't exist
        }
        throw fileError;
      }
    } catch (error) {
      console.error(`Error getting swap state for ${swapId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active swaps
   * @returns {Promise<Array>} Array of active swap states
   */
  async getActiveSwaps() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const activeSwaps = [];
      
      for (const [swapId, swapState] of this.swapStates) {
        if (swapState.status === 'initiated' || swapState.status === 'pending') {
          activeSwaps.push(swapState);
        }
      }

      return activeSwaps;
    } catch (error) {
      console.error('Error getting active swaps:', error);
      throw error;
    }
  }

  /**
   * Get swaps by status
   * @param {string} status - Swap status
   * @returns {Promise<Array>} Array of swap states with the specified status
   */
  async getSwapsByStatus(status) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const swaps = [];
      
      for (const [swapId, swapState] of this.swapStates) {
        if (swapState.status === status) {
          swaps.push(swapState);
        }
      }

      return swaps;
    } catch (error) {
      console.error(`Error getting swaps by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get swap history for a user
   * @param {string} userAddress - User's address
   * @returns {Promise<Array>} Array of swap states for the user
   */
  async getUserSwapHistory(userAddress) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const userSwaps = [];
      
      for (const [swapId, swapState] of this.swapStates) {
        if (swapState.ethSide.userAddress === userAddress || 
            swapState.btcSide.userAddress === userAddress) {
          userSwaps.push(swapState);
        }
      }

      // Sort by creation time, newest first
      userSwaps.sort((a, b) => b.createdAt - a.createdAt);

      return userSwaps;
    } catch (error) {
      console.error(`Error getting user swap history for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Delete swap state
   * @param {string} swapId - Swap identifier
   */
  async deleteSwapState(swapId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Remove from in-memory cache
      this.swapStates.delete(swapId);

      // Remove file
      const filePath = path.join(this.config.dataDir, `swap_${swapId}.json`);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      console.log(`Swap state deleted for ${swapId}`);
    } catch (error) {
      console.error(`Error deleting swap state for ${swapId}:`, error);
      throw error;
    }
  }

  /**
   * Load all swap states from disk
   */
  async loadSwapStates() {
    try {
      const files = await fs.readdir(this.config.dataDir);
      const swapFiles = files.filter(file => file.startsWith('swap_') && file.endsWith('.json'));

      for (const file of swapFiles) {
        const filePath = path.join(this.config.dataDir, file);
        try {
          const data = await fs.readFile(filePath, 'utf8');
          const swapState = JSON.parse(data);
          const swapId = file.replace('swap_', '').replace('.json', '');
          
          this.swapStates.set(swapId, swapState);
        } catch (error) {
          console.error(`Error loading swap state from ${file}:`, error);
          // Continue loading other files
        }
      }

      console.log(`Loaded ${this.swapStates.size} swap states`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Directory doesn't exist yet, that's okay
        console.log('No existing swap states found');
      } else {
        console.error('Error loading swap states:', error);
        throw error;
      }
    }
  }

  /**
   * Create backup of swap state
   * @param {string} swapId - Swap identifier
   * @param {Object} swapState - Swap state object
   */
  async createBackup(swapId, swapState) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `swap_${swapId}_${timestamp}.json`;
      const backupPath = path.join(this.config.backupDir, backupFileName);

      await fs.writeFile(backupPath, JSON.stringify(swapState, null, 2));

      // Clean up old backups
      await this.cleanupOldBackups(swapId);
    } catch (error) {
      console.error(`Error creating backup for ${swapId}:`, error);
      // Don't throw - backup failure shouldn't stop the main operation
    }
  }

  /**
   * Clean up old backups, keeping only the most recent ones
   * @param {string} swapId - Swap identifier
   */
  async cleanupOldBackups(swapId) {
    try {
      const files = await fs.readdir(this.config.backupDir);
      const swapBackups = files
        .filter(file => file.startsWith(`swap_${swapId}_`) && file.endsWith('.json'))
        .sort()
        .reverse(); // Newest first

      if (swapBackups.length > this.config.maxBackups) {
        const filesToDelete = swapBackups.slice(this.config.maxBackups);
        
        for (const file of filesToDelete) {
          const filePath = path.join(this.config.backupDir, file);
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up backups for ${swapId}:`, error);
    }
  }

  /**
   * Get swap statistics
   * @returns {Promise<Object>} Swap statistics
   */
  async getSwapStatistics() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const stats = {
        total: this.swapStates.size,
        byStatus: {},
        totalVolume: {
          btc: 0,
          eth: 0
        },
        averageCompletionTime: 0,
        successRate: 0
      };

      let completedSwaps = 0;
      let totalCompletionTime = 0;

      for (const [swapId, swapState] of this.swapStates) {
        // Count by status
        stats.byStatus[swapState.status] = (stats.byStatus[swapState.status] || 0) + 1;

        // Calculate volume
        stats.totalVolume.btc += swapState.btcSide.amount || 0;
        stats.totalVolume.eth += swapState.ethSide.amount || 0;

        // Calculate completion time
        if (swapState.status === 'completed' && swapState.completedAt && swapState.createdAt) {
          completedSwaps++;
          totalCompletionTime += swapState.completedAt - swapState.createdAt;
        }
      }

      // Calculate averages
      if (completedSwaps > 0) {
        stats.averageCompletionTime = totalCompletionTime / completedSwaps;
        stats.successRate = (completedSwaps / stats.total) * 100;
      }

      return stats;
    } catch (error) {
      console.error('Error getting swap statistics:', error);
      throw error;
    }
  }

  /**
   * Export swap data for analysis
   * @param {Object} options - Export options
   * @returns {Promise<string>} Path to exported file
   */
  async exportSwapData(options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        format = 'json',
        startDate = null,
        endDate = null,
        status = null
      } = options;

      let swapsToExport = Array.from(this.swapStates.values());

      // Filter by date range
      if (startDate) {
        swapsToExport = swapsToExport.filter(swap => swap.createdAt >= startDate);
      }
      if (endDate) {
        swapsToExport = swapsToExport.filter(swap => swap.createdAt <= endDate);
      }

      // Filter by status
      if (status) {
        swapsToExport = swapsToExport.filter(swap => swap.status === status);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFileName = `swap_export_${timestamp}.${format}`;
      const exportPath = path.join(this.config.dataDir, 'exports', exportFileName);

      // Create exports directory
      await fs.mkdir(path.dirname(exportPath), { recursive: true });

      if (format === 'json') {
        await fs.writeFile(exportPath, JSON.stringify(swapsToExport, null, 2));
      } else if (format === 'csv') {
        const csv = this.convertToCSV(swapsToExport);
        await fs.writeFile(exportPath, csv);
      }

      return exportPath;
    } catch (error) {
      console.error('Error exporting swap data:', error);
      throw error;
    }
  }

  /**
   * Convert swap data to CSV format
   * @param {Array} swaps - Array of swap states
   * @returns {string} CSV string
   */
  convertToCSV(swaps) {
    if (swaps.length === 0) return '';

    const headers = [
      'swapId',
      'status',
      'createdAt',
      'completedAt',
      'btcAmount',
      'ethAmount',
      'btcAddress',
      'ethAddress',
      'btcTxId',
      'ethTxHash'
    ];

    const rows = swaps.map(swap => [
      swap.swapId,
      swap.status,
      new Date(swap.createdAt).toISOString(),
      swap.completedAt ? new Date(swap.completedAt).toISOString() : '',
      swap.btcSide.amount || '',
      swap.ethSide.amount || '',
      swap.btcSide.userAddress || '',
      swap.ethSide.userAddress || '',
      swap.btcTxId || '',
      swap.ethTxHash || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Cleanup expired swaps
   * @param {number} maxAge - Maximum age in milliseconds
   */
  async cleanupExpiredSwaps(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days default
    try {
      const cutoffTime = Date.now() - maxAge;
      const swapsToDelete = [];

      for (const [swapId, swapState] of this.swapStates) {
        if (swapState.createdAt < cutoffTime && 
            (swapState.status === 'completed' || swapState.status === 'refunded')) {
          swapsToDelete.push(swapId);
        }
      }

      for (const swapId of swapsToDelete) {
        await this.deleteSwapState(swapId);
      }

      console.log(`Cleaned up ${swapsToDelete.length} expired swaps`);
      return swapsToDelete.length;
    } catch (error) {
      console.error('Error cleaning up expired swaps:', error);
      throw error;
    }
  }
}

module.exports = StateManager; 