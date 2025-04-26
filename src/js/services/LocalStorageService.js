/**
 * Local Storage Service
 * Provides utility methods for interacting with browser's localStorage
 */

class LocalStorageService {
    /**
     * Get an item from localStorage
     * @param {string} key - The key to retrieve
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} The stored value or defaultValue
     */
    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error(`Error retrieving ${key} from localStorage:`, error);
            return defaultValue;
        }
    }

    /**
     * Set an item in localStorage
     * @param {string} key - The key to set
     * @param {*} value - The value to store
     * @returns {boolean} Success status
     */
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error storing ${key} in localStorage:`, error);
            // If the error is due to storage quota, try to clear old data
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                this._cleanupStorageIfNeeded();
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (retryError) {
                    console.error('Still failed after cleanup:', retryError);
                    return false;
                }
            }
            return false;
        }
    }

    /**
     * Remove an item from localStorage
     * @param {string} key - The key to remove
     * @returns {boolean} Success status
     */
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
            return false;
        }
    }

    /**
     * Check if a key exists in localStorage
     * @param {string} key - The key to check
     * @returns {boolean} Whether the key exists
     */
    hasItem(key) {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Clear all items from localStorage
     * @returns {boolean} Success status
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    /**
     * Get all keys from localStorage
     * @returns {string[]} Array of keys
     */
    getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            keys.push(localStorage.key(i));
        }
        return keys;
    }
    
    /**
     * Get total localStorage usage in bytes
     * @returns {number} Storage usage in bytes
     */
    getStorageUsage() {
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalSize += (key.length + value.length) * 2; // UTF-16 uses 2 bytes per character
        }
        return totalSize;
    }
    
    /**
     * Create a backup of localStorage data
     * @returns {Object} Backup data
     */
    createBackup() {
        const backup = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            backup[key] = localStorage.getItem(key);
        }
        
        const timestamp = new Date().toISOString();
        backup._metadata = {
            timestamp: timestamp,
            size: this.getStorageUsage(),
            keys: Object.keys(backup).filter(key => key !== '_metadata')
        };
        
        return {
            data: backup,
            timestamp: timestamp
        };
    }
    
    /**
     * Restore a backup to localStorage
     * @param {Object} backup - The backup object to restore
     * @param {boolean} clearFirst - Whether to clear localStorage first
     * @returns {boolean} Success status
     */
    restoreBackup(backup, clearFirst = true) {
        try {
            // Validate backup
            if (!backup || !backup.data) {
                throw new Error('Invalid backup data');
            }
            
            // Clear existing data if requested
            if (clearFirst) {
                this.clear();
            }
            
            // Restore each item
            const data = backup.data;
            for (const key in data) {
                // Skip metadata
                if (key === '_metadata') continue;
                
                localStorage.setItem(key, data[key]);
            }
            
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }
    
    /**
     * Create a timestamped backup and save it to localStorage
     * @returns {string} The backup key
     */
    saveBackup() {
        const backup = this.createBackup();
        const backupKey = `game_hub_backup_${backup.timestamp}`;
        
        // Store backup itself
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        // Update backup registry
        const backups = this.getItem('game_hub_backups', []);
        backups.push({
            key: backupKey,
            timestamp: backup.timestamp,
            size: backup.data._metadata.size
        });
        this.setItem('game_hub_backups', backups);
        
        return backupKey;
    }
    
    /**
     * Get list of all available backups
     * @returns {Array} List of backups with metadata
     */
    getBackups() {
        return this.getItem('game_hub_backups', []);
    }
    
    /**
     * Retrieve a specific backup
     * @param {string} backupKey - The key of the backup to retrieve
     * @returns {Object|null} The backup or null if not found
     */
    getBackup(backupKey) {
        return this.getItem(backupKey, null);
    }
    
    /**
     * Delete a backup
     * @param {string} backupKey - The key of the backup to delete
     * @returns {boolean} Success status
     */
    deleteBackup(backupKey) {
        try {
            // Remove the backup itself
            this.removeItem(backupKey);
            
            // Update the registry
            const backups = this.getItem('game_hub_backups', []);
            const updatedBackups = backups.filter(backup => backup.key !== backupKey);
            this.setItem('game_hub_backups', updatedBackups);
            
            return true;
        } catch (error) {
            console.error(`Error deleting backup ${backupKey}:`, error);
            return false;
        }
    }
    
    /**
     * Clean up old items when storage is nearly full
     * @private
     */
    _cleanupStorageIfNeeded() {
        try {
            // Check if we're close to the storage limit (5MB is common limit)
            const usagePercent = this.getStorageUsage() / (5 * 1024 * 1024) * 100;
            
            if (usagePercent > 80) {
                console.warn(`LocalStorage is ${usagePercent.toFixed(2)}% full. Cleaning up...`);
                
                // Strategy: Remove old backups first
                const backups = this.getItem('game_hub_backups', []);
                
                if (backups.length > 0) {
                    // Sort by date (oldest first)
                    backups.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    
                    // Remove oldest backup
                    this.deleteBackup(backups[0].key);
                    console.log(`Removed old backup ${backups[0].key} to free up space`);
                }
            }
        } catch (error) {
            console.error('Error in cleanup routine:', error);
        }
    }
}

// Create singleton instance
const localStorageService = new LocalStorageService();
export default localStorageService;