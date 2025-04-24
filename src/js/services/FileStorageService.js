/**
 * File Storage Service for Game Hub
 * Handles API calls to the server for player data
 */

class FileStorageService {
    constructor() {
        this.API_URL = '/api';
    }

    /**
     * Get all players (usernames only)
     */
    async getAllPlayers() {
        try {
            const response = await fetch(`${this.API_URL}/players`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to get players');
            }
            
            return data.players;
        } catch (error) {
            console.error('Error getting all players:', error);
            throw error;
        }
    }

    /**
     * Get player by username
     */
    async getPlayer(username) {
        try {
            const response = await fetch(`${this.API_URL}/players/${username}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to get player');
            }
            
            return data.player;
        } catch (error) {
            console.error(`Error getting player ${username}:`, error);
            throw error;
        }
    }

    /**
     * Register a new player
     */
    async registerPlayer(username, password, email) {
        try {
            const response = await fetch(`${this.API_URL}/players/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, email })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to register');
            }
            
            return data.player;
        } catch (error) {
            console.error('Error registering player:', error);
            throw error;
        }
    }

    /**
     * Login a player
     */
    async loginPlayer(username, password) {
        try {
            const response = await fetch(`${this.API_URL}/players/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to login');
            }
            
            return data.player;
        } catch (error) {
            console.error('Error logging in player:', error);
            throw error;
        }
    }

    /**
     * Logout a player
     */
    async logoutPlayer() {
        try {
            const response = await fetch(`${this.API_URL}/players/logout`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to logout');
            }
            
            return true;
        } catch (error) {
            console.error('Error logging out player:', error);
            throw error;
        }
    }

    /**
     * Update player profile
     */
    async updateProfile(username, updates) {
        try {
            const response = await fetch(`${this.API_URL}/players/${username}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to update profile');
            }
            
            return data.player;
        } catch (error) {
            console.error(`Error updating profile for ${username}:`, error);
            throw error;
        }
    }

    /**
     * Add match to player history
     */
    async addMatch(username, matchData) {
        try {
            const response = await fetch(`${this.API_URL}/players/${username}/matches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(matchData)
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to add match');
            }
            
            return data.player;
        } catch (error) {
            console.error(`Error adding match for ${username}:`, error);
            throw error;
        }
    }

    /**
     * Clear match history
     */
    async clearMatchHistory(username) {
        try {
            const response = await fetch(`${this.API_URL}/players/${username}/matches`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to clear match history');
            }
            
            return data.player;
        } catch (error) {
            console.error(`Error clearing match history for ${username}:`, error);
            throw error;
        }
    }

    /**
     * Add or remove friend
     */
    async updateFriend(username, friendUsername, action) {
        try {
            if (!['add', 'remove'].includes(action)) {
                throw new Error('Invalid action. Must be "add" or "remove".');
            }
            
            const response = await fetch(`${this.API_URL}/players/${username}/friends`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ friendUsername, action })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || `Failed to ${action} friend`);
            }
            
            return data.player;
        } catch (error) {
            console.error(`Error updating friend for ${username}:`, error);
            throw error;
        }
    }
}

// Create singleton instance
const fileStorageService = new FileStorageService();

export default fileStorageService;