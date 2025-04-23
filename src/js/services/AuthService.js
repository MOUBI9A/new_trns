/**
 * Authentication Service for Game Hub
 * Handles user registration, login, logout and session management
 * Uses Web Crypto API for SHA-256 password hashing
 */

class AuthService {
    constructor() {
        this.USERS_KEY = 'game_hub_users';
        this.SESSION_KEY = 'game_hub_session';
        this.users = this.loadUsers();
        this.currentUser = this.loadSession();
        this.authStatus = this.currentUser !== null;
    }

    /**
     * Load users from localStorage
     */
    loadUsers() {
        const usersJSON = localStorage.getItem(this.USERS_KEY);
        return usersJSON ? JSON.parse(usersJSON) : {};
    }

    /**
     * Save users to localStorage
     */
    saveUsers() {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(this.users));
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
                displayName: user.displayName || user.username,
                avatar: user.avatar || null,
                created: user.created,
                gameHistory: user.gameHistory || [],
                matchHistory: user.matchHistory || [],
                stats: user.stats || {
                    totalMatches: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    byGame: {}
                }
            };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            this.currentUser = session;
            this.authStatus = true;
        } else {
            localStorage.removeItem(this.SESSION_KEY);
            this.currentUser = null;
            this.authStatus = false;
        }
    }

    /**
     * Check if username already exists
     */
    isUsernameTaken(username) {
        return this.users.hasOwnProperty(username);
    }

    /**
     * Hash password using SHA-256
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Register a new user
     */
    async register(username, email, password) {
        if (this.isUsernameTaken(username)) {
            throw new Error('Username already taken');
        }

        const hashedPassword = await this.hashPassword(password);
        
        const newUser = {
            username,
            email,
            displayName: username,
            password: hashedPassword,
            created: new Date().toISOString(),
            avatar: null,
            gameHistory: [],
            matchHistory: [],
            stats: {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                byGame: {}
            }
        };
        
        this.users[username] = newUser;
        this.saveUsers();
        this.saveSession(newUser);
        
        return { success: true, user: newUser };
    }

    /**
     * Login user
     */
    async login(username, password) {
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }
        
        const hashedPassword = await this.hashPassword(password);
        
        if (user.password !== hashedPassword) {
            throw new Error('Incorrect password');
        }
        
        // Initialize stats if they don't exist (for backward compatibility)
        if (!user.stats) {
            user.stats = {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                byGame: {}
            };
        }
        
        // Initialize matchHistory if it doesn't exist
        if (!user.matchHistory) {
            user.matchHistory = [];
        }
        
        this.saveUsers(); // Save any updates made for backward compatibility
        this.saveSession(user);
        return { success: true, user };
    }

    /**
     * Logout user
     */
    logout() {
        this.saveSession(null);
        return { success: true };
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
    updateProfile(updates) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }

        // Apply updates
        if (updates.displayName) {
            user.displayName = updates.displayName;
        }
        
        if (updates.avatar) {
            user.avatar = updates.avatar;
        }
        
        // Save changes
        this.users[username] = user;
        this.saveUsers();
        this.saveSession(user);
        
        return { success: true, user };
    }

    /**
     * Add game to user history
     */
    addGameToHistory(gameData) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }

        // Initialize game history if it doesn't exist
        if (!user.gameHistory) {
            user.gameHistory = [];
        }

        // Add game with timestamp
        const game = {
            ...gameData,
            playedAt: new Date().toISOString()
        };
        
        user.gameHistory.unshift(game); // Add to beginning of array
        
        // Save changes
        this.users[username] = user;
        this.saveUsers();
        this.saveSession(user);
        
        return { success: true, user };
    }

    /**
     * Get user game history
     */
    getGameHistory() {
        if (!this.isAuthenticated() || !this.currentUser.gameHistory) {
            return [];
        }
        
        return this.currentUser.gameHistory;
    }
    
    /**
     * Add match to user history with opponent and result
     * @param {Object} matchData - Data about the match
     * @param {string} matchData.game - Name of the game
     * @param {string} matchData.opponent - Name of the opponent
     * @param {string} matchData.result - "win", "loss", or "draw"
     * @param {Object} matchData.score - Score object for the match
     */
    addMatchToHistory(matchData) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }

        // Initialize match history if it doesn't exist
        if (!user.matchHistory) {
            user.matchHistory = [];
        }
        
        // Initialize stats if they don't exist
        if (!user.stats) {
            user.stats = {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                byGame: {}
            };
        }
        
        // Initialize game stats if it doesn't exist
        if (!user.stats.byGame[matchData.game]) {
            user.stats.byGame[matchData.game] = {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0
            };
        }

        // Add match with timestamp
        const match = {
            ...matchData,
            playedAt: new Date().toISOString()
        };
        
        user.matchHistory.unshift(match); // Add to beginning of array
        
        // Update stats
        user.stats.totalMatches++;
        user.stats.byGame[matchData.game].totalMatches++;
        
        if (matchData.result === 'win') {
            user.stats.wins++;
            user.stats.byGame[matchData.game].wins++;
        } else if (matchData.result === 'loss') {
            user.stats.losses++;
            user.stats.byGame[matchData.game].losses++;
        } else if (matchData.result === 'draw') {
            user.stats.draws++;
            user.stats.byGame[matchData.game].draws++;
        }
        
        // Save changes
        this.users[username] = user;
        this.saveUsers();
        this.saveSession(user);
        
        return { success: true, user };
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
}

// Create singleton instance
const authService = new AuthService();

export default authService; 