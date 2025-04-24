/**
 * Authentication Service for Game Hub
 * Handles user registration, login, logout and session management
 * Uses Web Crypto API for SHA-256 password hashing
 */

class AuthService {
    constructor() {
        this.USERS_KEY = 'game_hub_users';
        this.SESSION_KEY = 'game_hub_session';
        this.ONLINE_USERS_KEY = 'game_hub_online_users';
        this.users = this.loadUsers();
        this.currentUser = this.loadSession();
        this.authStatus = this.currentUser !== null;
        this.onlineUsers = this.loadOnlineUsers();
        
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
     * Load online users from localStorage
     */
    loadOnlineUsers() {
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
    setUserOnline(username) {
        this.onlineUsers[username] = {
            status: 'online',
            lastSeen: new Date().toISOString()
        };
        this.saveOnlineUsers();
    }
    
    /**
     * Set user as offline
     */
    setUserOffline(username) {
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
    pingOnlineStatus() {
        if (this.currentUser) {
            this.setUserOnline(this.currentUser.username);
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
                displayName: user.displayName || user.username,
                avatar: user.avatar || null,
                created: user.created,
                friends: user.friends || [],
                friendRequests: user.friendRequests || [],
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
    async register(username, email, password, displayName = null) {
        if (this.isUsernameTaken(username)) {
            throw new Error('Username already taken');
        }

        const hashedPassword = await this.hashPassword(password);
        
        const newUser = {
            username,
            email,
            displayName: displayName || username,
            password: hashedPassword,
            created: new Date().toISOString(),
            avatar: null,
            friends: [],
            friendRequests: [],
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
        
        // Initialize friend lists if they don't exist
        if (!user.friends) {
            user.friends = [];
        }
        
        if (!user.friendRequests) {
            user.friendRequests = [];
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
        
        if (updates.email) {
            user.email = updates.email;
        }
        
        // Save changes
        this.users[username] = user;
        this.saveUsers();
        this.saveSession(user);
        
        return { success: true, user };
    }

    /**
     * Update user password
     */
    async updatePassword(currentPassword, newPassword) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Verify current password
        const hashedCurrentPassword = await this.hashPassword(currentPassword);
        if (user.password !== hashedCurrentPassword) {
            throw new Error('Current password is incorrect');
        }
        
        // Update to new password
        const hashedNewPassword = await this.hashPassword(newPassword);
        user.password = hashedNewPassword;
        
        // Save changes
        this.users[username] = user;
        this.saveUsers();
        
        return { success: true };
    }
    
    /**
     * Send friend request to another user
     */
    sendFriendRequest(targetUsername) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        const username = this.currentUser.username;
        
        if (username === targetUsername) {
            throw new Error('You cannot add yourself as a friend');
        }
        
        const targetUser = this.users[targetUsername];
        
        if (!targetUser) {
            throw new Error('User not found');
        }
        
        // Initialize friendRequests array if it doesn't exist
        if (!targetUser.friendRequests) {
            targetUser.friendRequests = [];
        }
        
        // Check if request already exists
        const existingRequest = targetUser.friendRequests.find(req => req.from === username);
        if (existingRequest) {
            throw new Error('Friend request already sent');
        }
        
        // Check if already friends
        if (!targetUser.friends) {
            targetUser.friends = [];
        }
        
        const alreadyFriends = targetUser.friends.includes(username);
        if (alreadyFriends) {
            throw new Error('You are already friends with this user');
        }
        
        // Get current user info to include in the request
        const currentUser = this.users[username];
        
        // Add friend request to target user with additional user info
        targetUser.friendRequests.push({
            from: username,
            username: username,
            displayName: currentUser.displayName || username,
            avatar: currentUser.avatar || null,
            date: new Date().toISOString()
        });
        
        // Save changes
        this.users[targetUsername] = targetUser;
        this.saveUsers();
        
        return { success: true };
    }
    
    /**
     * Accept a friend request
     */
    acceptFriendRequest(fromUsername) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        const username = this.currentUser.username;
        const currentUser = this.users[username];
        const fromUser = this.users[fromUsername];
        
        if (!currentUser || !fromUser) {
            throw new Error('User not found');
        }
        
        // Initialize arrays if they don't exist
        if (!currentUser.friendRequests) {
            currentUser.friendRequests = [];
        }
        
        if (!currentUser.friends) {
            currentUser.friends = [];
        }
        
        if (!fromUser.friends) {
            fromUser.friends = [];
        }
        
        // Find the request
        const requestIndex = currentUser.friendRequests.findIndex(req => req.from === fromUsername);
        
        if (requestIndex === -1) {
            throw new Error('Friend request not found');
        }
        
        // Remove request
        currentUser.friendRequests.splice(requestIndex, 1);
        
        // Add to friends list (both ways)
        if (!currentUser.friends.includes(fromUsername)) {
            currentUser.friends.push(fromUsername);
        }
        
        if (!fromUser.friends.includes(username)) {
            fromUser.friends.push(username);
        }
        
        // Save changes
        this.users[username] = currentUser;
        this.users[fromUsername] = fromUser;
        this.saveUsers();
        this.saveSession(currentUser);
        
        return { success: true };
    }
    
    /**
     * Decline a friend request
     */
    declineFriendRequest(fromUsername) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Initialize friendRequests array if it doesn't exist
        if (!user.friendRequests) {
            user.friendRequests = [];
        }
        
        // Find the request
        const requestIndex = user.friendRequests.findIndex(req => req.from === fromUsername);
        
        if (requestIndex === -1) {
            throw new Error('Friend request not found');
        }
        
        // Remove request
        user.friendRequests.splice(requestIndex, 1);
        
        // Save changes
        this.users[username] = user;
        this.saveUsers();
        this.saveSession(user);
        
        return { success: true };
    }
    
    /**
     * Remove a friend
     */
    removeFriend(friendUsername) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        const username = this.currentUser.username;
        const currentUser = this.users[username];
        const friendUser = this.users[friendUsername];
        
        if (!currentUser || !friendUser) {
            throw new Error('User not found');
        }
        
        // Initialize friends arrays if they don't exist
        if (!currentUser.friends) {
            currentUser.friends = [];
        }
        
        if (!friendUser.friends) {
            friendUser.friends = [];
        }
        
        // Check if they are friends
        const userFriendIndex = currentUser.friends.indexOf(friendUsername);
        const friendUserIndex = friendUser.friends.indexOf(username);
        
        if (userFriendIndex === -1) {
            throw new Error('You are not friends with this user');
        }
        
        // Remove from both friends lists
        currentUser.friends.splice(userFriendIndex, 1);
        
        if (friendUserIndex !== -1) {
            friendUser.friends.splice(friendUserIndex, 1);
        }
        
        // Save changes
        this.users[username] = currentUser;
        this.users[friendUsername] = friendUser;
        this.saveUsers();
        this.saveSession(currentUser);
        
        return { success: true };
    }
    
    /**
     * Get friend requests for current user
     */
    getFriendRequests() {
        if (!this.isAuthenticated()) {
            return [];
        }
        
        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user || !user.friendRequests) {
            return [];
        }
        
        // Return the friend requests directly, they already have all the needed properties
        // If we're dealing with older requests that don't have the full user info, 
        // add that information from the users object
        return user.friendRequests.map(request => {
            // If this is an older request that only has "from" but not the full user info
            if (request.from && !request.username) {
                const fromUser = this.users[request.from];
                return {
                    username: request.from,
                    from: request.from,
                    displayName: fromUser ? fromUser.displayName : request.from,
                    avatar: fromUser ? fromUser.avatar : null,
                    date: request.date
                };
            }
            return request; // Return the already complete request object
        });
    }
    
    /**
     * Get friends list for current user with online status
     */
    getFriends() {
        if (!this.isAuthenticated()) {
            return [];
        }
        
        const username = this.currentUser.username;
        const user = this.users[username];
        
        if (!user || !user.friends) {
            return [];
        }
        
        return user.friends.map(friendUsername => {
            const friendUser = this.users[friendUsername];
            const onlineStatus = this.onlineUsers[friendUsername] || { status: 'offline', lastSeen: null };
            
            return {
                username: friendUsername,
                displayName: friendUser ? friendUser.displayName : friendUsername,
                avatar: friendUser ? friendUser.avatar : null,
                online: onlineStatus.status === 'online',
                lastSeen: onlineStatus.lastSeen
            };
        });
    }
    
    /**
     * Get user profile by username (public info only)
     */
    getUserProfile(username) {
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }
        
        const onlineStatus = this.onlineUsers[username] || { status: 'offline', lastSeen: null };
        
        return {
            username: username,
            displayName: user.displayName,
            avatar: user.avatar,
            created: user.created,
            stats: user.stats,
            online: onlineStatus.status === 'online',
            lastSeen: onlineStatus.lastSeen
        };
    }
    
    /**
     * Get match history for specified user
     */
    getUserMatchHistory(username) {
        const user = this.users[username];
        
        if (!user) {
            throw new Error('User not found');
        }
        
        if (!user.matchHistory) {
            return [];
        }
        
        return user.matchHistory;
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