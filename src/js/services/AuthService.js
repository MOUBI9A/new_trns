/**
 * Authentication Service for Game Hub
 * Handles user registration, login, logout and session management
 * Uses the file-based storage system for user data
 */

import fileStorageService from './FileStorageService.js';

class AuthService {
    constructor() {
        this.SESSION_KEY = 'game_hub_session';
        this.ONLINE_USERS_KEY = 'game_hub_online_users';
        
        this.currentUser = null;
        this.authStatus = false;
        this.onlineUsers = {};
        
        // Load local session first for quick startup
        this.currentUser = this.loadSession();
        this.authStatus = this.currentUser !== null;
        
        // Set up online status checking
        if (this.currentUser) {
            this.setUserOnline(this.currentUser.username);
            // Set up periodic online status ping
            this.onlineInterval = setInterval(() => this.pingOnlineStatus(), 30000); // Every 30 seconds
            
            // Handle window close/reload
            window.addEventListener('beforeunload', () => {
                this.setUserOffline(this.currentUser.username);
            });
        }

        // Load online users from localStorage
        this.onlineUsers = this.loadOnlineUsersFromLocalStorage();
    }

    /**
     * Load online users from localStorage
     */
    loadOnlineUsersFromLocalStorage() {
        const onlineJSON = localStorage.getItem(this.ONLINE_USERS_KEY);
        return onlineJSON ? JSON.parse(onlineJSON) : {};
    }

    /**
     * Save online users to localStorage
     */
    saveOnlineUsers() {
        localStorage.setItem(this.ONLINE_USERS_KEY, JSON.stringify(this.onlineUsers));
    }
    
    /**
     * Set user as online
     */
    async setUserOnline(username) {
        this.onlineUsers[username] = {
            status: 'online',
            lastSeen: new Date().toISOString()
        };
        this.saveOnlineUsers();
    }
    
    /**
     * Set user as offline
     */
    async setUserOffline(username) {
        if (this.onlineUsers[username]) {
            this.onlineUsers[username] = {
                status: 'offline',
                lastSeen: new Date().toISOString()
            };
            this.saveOnlineUsers();
        }
    }
    
    /**
     * Ping online status to keep user marked as online
     */
    async pingOnlineStatus() {
        if (this.currentUser) {
            await this.setUserOnline(this.currentUser.username);
        }
    }

    /**
     * Load current user session from localStorage
     */
    loadSession() {
        const sessionJSON = localStorage.getItem(this.SESSION_KEY);
        return sessionJSON ? JSON.parse(sessionJSON) : null;
    }

    /**
     * Save user session to localStorage
     */
    saveSession(user) {
        if (user) {
            // Create a session object without sensitive data
            const session = {
                username: user.username,
                email: user.email,
                avatar: user.avatar || null,
                registeredAt: user.registeredAt || user.created,
                lastLogin: user.lastLogin,
                friends: user.friends || [],
                stats: user.stats || {
                    totalMatches: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    byGame: {}
                },
                matchHistory: user.matchHistory || []
            };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            this.currentUser = session;
            this.authStatus = true;
            
            // Set up online status
            this.setUserOnline(user.username);
            if (!this.onlineInterval) {
                this.onlineInterval = setInterval(() => this.pingOnlineStatus(), 30000);
            }
        } else {
            // Set user as offline before clearing session
            if (this.currentUser) {
                this.setUserOffline(this.currentUser.username);
            }
            
            // Clear the ping interval
            if (this.onlineInterval) {
                clearInterval(this.onlineInterval);
                this.onlineInterval = null;
            }
            
            localStorage.removeItem(this.SESSION_KEY);
            this.currentUser = null;
            this.authStatus = false;
        }
    }

    /**
     * Register a new user
     */
    async register(username, email, password, displayName = null) {
        try {
            const player = await fileStorageService.registerPlayer(username, password, email);
            this.saveSession(player);
            return { success: true, user: player };
        } catch (error) {
            console.error('Error registering:', error);
            throw error;
        }
    }

    /**
     * Login user
     */
    async login(username, password) {
        try {
            const player = await fileStorageService.loginPlayer(username, password);
            this.saveSession(player);
            return { success: true, user: player };
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        if (!this.isAuthenticated()) {
            return { success: true };
        }
        
        try {
            await fileStorageService.logoutPlayer(this.currentUser.username);
            this.saveSession(null);
            return { success: true };
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        try {
            const player = await fileStorageService.updateProfile(this.currentUser.username, updates);
            this.saveSession(player);
            return { success: true, user: player };
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    /**
     * Add or remove friend
     */
    async updateFriendStatus(friendUsername, action) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        try {
            const player = await fileStorageService.updateFriend(this.currentUser.username, friendUsername, action);
            this.saveSession(player);
            return { success: true, user: player };
        } catch (error) {
            console.error('Error updating friend status:', error);
            throw error;
        }
    }

    /**
     * Add friend
     */
    async addFriend(friendUsername) {
        return this.updateFriendStatus(friendUsername, 'add');
    }

    /**
     * Remove friend
     */
    async removeFriend(friendUsername) {
        return this.updateFriendStatus(friendUsername, 'remove');
    }

    /**
     * Get friends list for current user with online status
     */
    async getFriends() {
        if (!this.isAuthenticated()) {
            return [];
        }
        
        try {
            // Get the latest player data to ensure friends list is up-to-date
            const player = await fileStorageService.getPlayer(this.currentUser.username);
            
            if (!player || !player.friends || !Array.isArray(player.friends)) {
                return [];
            }
            
            const friendsPromises = player.friends.map(async (friendUsername) => {
                try {
                    const friendPlayer = await fileStorageService.getPlayer(friendUsername);
                    const onlineStatus = this.onlineUsers[friendUsername] || { status: 'offline', lastSeen: null };
                    
                    return {
                        username: friendUsername,
                        avatar: friendPlayer.avatar || null,
                        online: onlineStatus.status === 'online',
                        lastSeen: onlineStatus.lastSeen
                    };
                } catch (error) {
                    console.error(`Error loading friend ${friendUsername}:`, error);
                    return {
                        username: friendUsername,
                        avatar: null,
                        online: false,
                        lastSeen: null
                    };
                }
            });
            
            return Promise.all(friendsPromises);
        } catch (error) {
            console.error('Error getting friends:', error);
            return [];
        }
    }

    /**
     * Get available players (for adding friends)
     */
    async getAvailablePlayers() {
        if (!this.isAuthenticated()) {
            return [];
        }
        
        try {
            // Get all players
            const allPlayers = await fileStorageService.getAllPlayers();
            
            // Filter out current user and existing friends
            return allPlayers.filter(username => 
                username !== this.currentUser.username && 
                !this.currentUser.friends.includes(username)
            ).map(username => ({ username }));
        } catch (error) {
            console.error('Error getting available players:', error);
            return [];
        }
    }

    /**
     * Add match to player history
     */
    async addMatchToHistory(matchData) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        try {
            const player = await fileStorageService.addMatch(this.currentUser.username, matchData);
            this.saveSession(player);
            return { success: true, user: player };
        } catch (error) {
            console.error('Error adding match:', error);
            throw error;
        }
    }

    /**
     * Clear match history
     */
    async clearMatchHistory() {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        try {
            const player = await fileStorageService.clearMatchHistory(this.currentUser.username);
            this.saveSession(player);
            return { success: true, user: player };
        } catch (error) {
            console.error('Error clearing match history:', error);
            throw error;
        }
    }

    /**
     * Get user match history
     */
    getMatchHistory() {
        if (!this.isAuthenticated() || !this.currentUser.matchHistory) {
            return [];
        }
        
        return this.currentUser.matchHistory;
    }
    
    /**
     * Get user stats
     */
    getUserStats() {
        if (!this.isAuthenticated() || !this.currentUser.stats) {
            return {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                byGame: {}
            };
        }
        
        return this.currentUser.stats;
    }

    /**
     * Get user profile by username
     */
    async getUserProfile(username) {
        try {
            const player = await fileStorageService.getPlayer(username);
            const onlineStatus = this.onlineUsers[username] || { status: 'offline', lastSeen: null };
            
            return {
                username: player.username,
                avatar: player.avatar,
                registeredAt: player.registeredAt,
                stats: player.stats,
                online: onlineStatus.status === 'online',
                lastSeen: onlineStatus.lastSeen
            };
        } catch (error) {
            console.error(`Error getting profile for ${username}:`, error);
            throw error;
        }
    }
}

// Create singleton instance
const authService = new AuthService();

export default authService;