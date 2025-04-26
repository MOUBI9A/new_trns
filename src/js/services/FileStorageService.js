/**
 * File Storage Service
 * This service provides an interface for data storage that works completely client-side
 * It uses LocalStorageService under the hood to store data without needing a backend
 */
import localStorageService from './LocalStorageService.js';

class FileStorageService {
    constructor() {
        this.API_URL = '/api'; // Keeping this for compatibility, but not used
        this.fetchOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        console.log('FileStorageService initialized in client-only mode');
    }

    /**
     * Get all players (usernames only)
     */
    async getAllPlayers() {
        try {
            return await localStorageService.getAllPlayers();
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
            return await localStorageService.getPlayer(username);
        } catch (error) {
            console.error(`Error getting player ${username}:`, error);
            throw error;
        }
    }

    /**
     * Register a new player
     */
    async registerPlayer(username, password, email, displayName) {
        try {
            return await localStorageService.registerPlayer(username, password, email, displayName);
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
            return await localStorageService.loginPlayer(username, password);
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
            return await localStorageService.logoutPlayer();
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    }

    /**
     * Enhanced updateProfile method to ensure proper session handling
     */
    async updateProfile(username, updates) {
        try {
            console.log(`FileStorageService: Updating profile for ${username}`, updates);
            return await localStorageService.updateProfile(username, updates);
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
            return await localStorageService.addMatch(username, matchData);
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
            return await localStorageService.clearMatchHistory(username);
        } catch (error) {
            console.error(`Error clearing match history for ${username}:`, error);
            throw error;
        }
    }

    /**
     * Update friend relationship
     */
    async updateFriendship(username, friendUsername, action) {
        try {
            return await localStorageService.updateFriend(username, friendUsername, action);
        } catch (error) {
            console.error(`Error updating friendship for ${username}:`, error);
            throw error;
        }
    }

    /**
     * Send friend request
     */
    async sendFriendRequest(senderUsername, receiverUsername) {
        try {
            return await localStorageService.sendFriendRequest(senderUsername, receiverUsername);
        } catch (error) {
            console.error('Error sending friend request:', error);
            throw error;
        }
    }

    /**
     * Get friend requests
     */
    async getFriendRequests(username) {
        try {
            return await localStorageService.getFriendRequests(username);
        } catch (error) {
            console.error(`Error getting friend requests for ${username}:`, error);
            throw error;
        }
    }

    /**
     * Accept friend request
     */
    async acceptFriendRequest(username, senderUsername) {
        try {
            return await localStorageService.acceptFriendRequest(username, senderUsername);
        } catch (error) {
            console.error('Error accepting friend request:', error);
            throw error;
        }
    }

    /**
     * Decline friend request
     */
    async declineFriendRequest(username, senderUsername) {
        try {
            return await localStorageService.declineFriendRequest(username, senderUsername);
        } catch (error) {
            console.error('Error declining friend request:', error);
            throw error;
        }
    }

    /**
     * Save tournament
     */
    async saveTournament(tournamentData) {
        try {
            return await localStorageService.saveTournament(tournamentData);
        } catch (error) {
            console.error('Error saving tournament:', error);
            throw error;
        }
    }

    /**
     * Get all tournaments
     */
    async getAllTournaments() {
        try {
            return await localStorageService.getAllTournaments();
        } catch (error) {
            console.error('Error getting tournaments:', error);
            throw error;
        }
    }
}

// Create singleton instance
const fileStorageService = new FileStorageService();

export default fileStorageService;