/**
 * Authentication Service for Game Hub
 * Handles user authentication using localStorage
 */
import localStorageService from './LocalStorageService.js';
import mockOAuthService from './MockOAuthService.js';

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
     * Check if a user is authenticated
     */
    isAuthenticated() {
        return this.authStatus && this.currentUser !== null;
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
            // Log profile update attempt
            console.log(`Attempting profile update for user: ${this.currentUser.username}`);
            
            // Ensure username is correctly passed and profile updates don't change the username
            const username = this.currentUser.username;
            
            // Create a clean updates object with only allowed fields
            const cleanUpdates = {};
            const allowedFields = ['displayName', 'email', 'avatar'];
            
            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    cleanUpdates[field] = updates[field];
                }
            });
            
            const player = await localStorageService.updateProfile(username, cleanUpdates);
            
            if (player) {
                // Update local session with new data
                this.saveSession(player);
                
                // Notify any UI components that the profile was updated
                document.dispatchEvent(new CustomEvent('auth:profile-updated', {
                    detail: { player }
                }));
                
                return { success: true, user: player };
            } else {
                throw new Error('Profile update returned no data');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    /**
     * Validate password strength
     */
    validatePassword(password) {
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Check for at least one lowercase letter
        if (!/[a-z]/.test(password)) {
            throw new Error('Password must contain at least one lowercase letter');
        }

        // Check for at least one uppercase letter
        if (!/[A-Z]/.test(password)) {
            throw new Error('Password must contain at least one uppercase letter');
        }

        // Check for at least one digit
        if (!/\d/.test(password)) {
            throw new Error('Password must contain at least one number');
        }

        // Check for at least one special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            throw new Error('Password must contain at least one special character');
        }

        return true;
    }

    /**
     * Register a new user
     * Enhanced with better validation and security
     */
    async register(username, email, password, displayName = null) {
        try {
            // Validate input
            if (!username || !email || !password) {
                throw new Error('Username, email and password are required');
            }

            // Validate username format
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
                throw new Error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
            }

            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw new Error('Please enter a valid email address');
            }

            // Enhanced password validation
            this.validatePassword(password);

            // Proceed with registration
            const player = await localStorageService.registerPlayer(username, password, email, displayName);
            this.saveSession(player);
            
            // Dispatch authentication change event
            document.dispatchEvent(new CustomEvent('auth:login'));
            
            return { success: true, user: player };
        } catch (error) {
            console.error('Error registering:', error);
            throw error;
        }
    }

    /**
     * Login a user
     */
    async login(username, password) {
        try {
            // Validate input
            if (!username || !password) {
                throw new Error('Username and password are required');
            }

            // Proceed with login
            const player = await localStorageService.loginPlayer(username, password);
            this.saveSession(player);
            
            // Dispatch authentication change event
            document.dispatchEvent(new CustomEvent('auth:login'));
            
            return { success: true, user: player };
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    }

    /**
     * Logout the current user
     */
    async logout() {
        try {
            if (!this.isAuthenticated()) {
                return { success: true };
            }
            
            await localStorageService.logoutPlayer();
            
            // Clear the session
            this.saveSession(null);
            
            // Dispatch logout event
            document.dispatchEvent(new CustomEvent('auth:logout'));
            
            return { success: true };
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    }

    /**
     * Add a match to the current user's history
     */
    async addMatchToHistory(matchData) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }
            
            const username = this.currentUser.username;
            const player = await localStorageService.addMatch(username, matchData);
            
            // Update the session
            this.saveSession(player);
            
            // Dispatch event for match history updates
            document.dispatchEvent(new CustomEvent('auth:match-added', {
                detail: { match: matchData }
            }));
            
            return { success: true, player };
        } catch (error) {
            console.error('Error adding match to history:', error);
            throw error;
        }
    }

    /**
     * Clear the current user's match history
     */
    async clearMatchHistory() {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }
            
            const username = this.currentUser.username;
            const player = await localStorageService.clearMatchHistory(username);
            
            // Update the session
            this.saveSession(player);
            
            // Dispatch event for match history updates
            document.dispatchEvent(new CustomEvent('auth:match-history-cleared'));
            
            return { success: true, player };
        } catch (error) {
            console.error('Error clearing match history:', error);
            throw error;
        }
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
                winRate: 0,
                byGame: {}
            };
        }
        
        const stats = this.currentUser.stats;
        
        // Calculate win rate
        const winRate = stats.totalMatches > 0 
            ? Math.round((stats.wins / stats.totalMatches) * 100) 
            : 0;
        
        return {
            ...stats,
            winRate
        };
    }

    /**
     * Get user profile by username
     */
    async getUserProfile(username) {
        try {
            return await localStorageService.getPlayer(username);
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }

    /**
     * Get friends list for current user
     */
    getFriends() {
        if (!this.isAuthenticated() || !this.currentUser.friends) {
            return [];
        }
        
        // Get online status for each friend
        return this.currentUser.friends.map(friendUsername => {
            const onlineStatus = this.onlineUsers[friendUsername] || {
                status: 'offline',
                lastSeen: null
            };
            
            return {
                username: friendUsername,
                online: onlineStatus.status === 'online',
                lastSeen: onlineStatus.lastSeen
            };
        });
    }

    /**
     * Get friend requests for current user
     */
    async getFriendRequests() {
        try {
            if (!this.isAuthenticated()) {
                return [];
            }
            
            const requests = await localStorageService.getFriendRequests(this.currentUser.username);
            
            // Enrich requests with user details
            const enrichedRequests = [];
            for (const request of requests) {
                try {
                    const user = await this.getUserProfile(request.username);
                    enrichedRequests.push({
                        ...request,
                        displayName: user.displayName || user.username,
                        avatar: user.avatar
                    });
                } catch (error) {
                    console.error(`Error enriching friend request from ${request.username}:`, error);
                    // Add basic request info even if enrichment fails
                    enrichedRequests.push({
                        ...request,
                        displayName: request.username
                    });
                }
            }
            
            return enrichedRequests;
        } catch (error) {
            console.error('Error getting friend requests:', error);
            return [];
        }
    }

    /**
     * Send a friend request
     */
    async sendFriendRequest(receiverUsername) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }
            
            if (this.currentUser.username === receiverUsername) {
                throw new Error('You cannot add yourself as a friend');
            }
            
            return await localStorageService.sendFriendRequest(this.currentUser.username, receiverUsername);
        } catch (error) {
            console.error('Error sending friend request:', error);
            throw error;
        }
    }

    /**
     * Accept a friend request
     */
    async acceptFriendRequest(senderUsername) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }
            
            const result = await localStorageService.acceptFriendRequest(this.currentUser.username, senderUsername);
            
            // Update session with new friend list
            const player = await this.getUserProfile(this.currentUser.username);
            this.saveSession(player);
            
            return result;
        } catch (error) {
            console.error('Error accepting friend request:', error);
            throw error;
        }
    }

    /**
     * Decline a friend request
     */
    async declineFriendRequest(senderUsername) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }
            
            return await localStorageService.declineFriendRequest(this.currentUser.username, senderUsername);
        } catch (error) {
            console.error('Error declining friend request:', error);
            throw error;
        }
    }

    /**
     * Remove a friend
     */
    async removeFriend(friendUsername) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }
            
            const result = await localStorageService.updateFriend(this.currentUser.username, friendUsername, 'remove');
            
            // Update session
            const player = await this.getUserProfile(this.currentUser.username);
            this.saveSession(player);
            
            return { success: true };
        } catch (error) {
            console.error('Error removing friend:', error);
            throw error;
        }
    }

    /**
     * Find a user by email
     */
    async findUserByEmail(email) {
        try {
            return await localStorageService.findUserByEmail(email);
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    /**
     * Send friend request by email
     */
    async sendFriendRequestByEmail(email) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }
            
            // Find user by email
            const user = await this.findUserByEmail(email);
            
            if (!user) {
                throw new Error('No user found with this email address');
            }
            
            // Check if it's the current user
            if (user.username === this.currentUser.username) {
                throw new Error('You cannot add yourself as a friend');
            }
            
            // Send friend request
            return await this.sendFriendRequest(user.username);
        } catch (error) {
            console.error('Error sending friend request by email:', error);
            throw error;
        }
    }

    /**
     * Simulate checking 42 authentication
     */
    async check42Auth() {
        try {
            // This is a stub for the mock 42 auth
            // In a real implementation, this would make an API call
            return { isAuthenticated: false };
        } catch (error) {
            console.error('Error checking 42 auth status:', error);
            throw error;
        }
    }

    /**
     * Mock implementation for OAuth with 42
     */
    loginWith42() {
        const redirectUrl = window.location.origin + '/oauth-success';
        mockOAuthService.initiateOAuth42Login(redirectUrl);
    }

    /**
     * Determine if a user is authenticated using 42 OAuth
     * @returns {boolean} Whether the current user is authenticated with 42
     */
    is42Authenticated() {
        return this.isAuthenticated() && this.currentUser && this.currentUser.username.startsWith('42_');
    }

    /**
     * Get the OAuth provider for the current user (if any)
     * @returns {string|null} The OAuth provider name or null
     */
    getOAuthProvider() {
        if (!this.isAuthenticated() || !this.currentUser) {
            return null;
        }
        
        if (this.currentUser.username.startsWith('42_')) {
            return '42';
        }
        
        return this.currentUser.oauthProvider || null;
    }

    /**
     * Show mock 42 login UI
     * This simulates the OAuth process without a real backend
     */
    show42MockLogin() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('mock-42-login-modal');
        
        if (!modal) {
            const modalHtml = `
                <div class="modal fade" id="mock-42-login-modal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title">Mock 42 Authentication</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="text-center mb-4">
                                    <img src="/42_Logo.svg.png" alt="42 Logo" style="height: 80px; width: auto;">
                                    <p class="my-3">This is a simulation of 42 OAuth authentication</p>
                                </div>
                                <form id="mock-42-login-form">
                                    <div class="mb-3">
                                        <label for="mock-42-email" class="form-label">42 Email</label>
                                        <input type="email" class="form-control" id="mock-42-email" required
                                            placeholder="your42email@student.42.fr">
                                    </div>
                                    <div class="mb-3">
                                        <label for="mock-42-username" class="form-label">42 Username</label>
                                        <input type="text" class="form-control" id="mock-42-username" required
                                            placeholder="42username">
                                    </div>
                                    <div class="mb-3">
                                        <label for="mock-42-displayname" class="form-label">Display Name</label>
                                        <input type="text" class="form-control" id="mock-42-displayname"
                                            placeholder="Your Name">
                                    </div>
                                    <div class="alert alert-info">
                                        <small>This is a client-side simulation of the 42 OAuth process.
                                        In a real implementation, this would redirect to the actual 42 authentication page.</small>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="mock-42-submit">Authenticate with 42</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('mock-42-login-modal');
            
            // Set up form submission
            const submitBtn = document.getElementById('mock-42-submit');
            submitBtn.addEventListener('click', async () => {
                const email = document.getElementById('mock-42-email').value;
                const username = document.getElementById('mock-42-username').value;
                const displayName = document.getElementById('mock-42-displayname').value || username;
                
                if (!email || !username) {
                    // Show validation error
                    return;
                }
                
                try {
                    // Create a deterministic avatar based on username
                    const avatar = `https://i.pravatar.cc/150?u=${username}`;
                    
                    // Create a normalized 42 username
                    const normalized42Username = `42_${username}`;
                    
                    // Check if user exists
                    let user = null;
                    try {
                        user = await localStorageService.getPlayer(normalized42Username);
                    } catch (error) {
                        // User doesn't exist, will create a new one
                    }
                    
                    if (user) {
                        // User exists, update last login and log them in
                        const updatedUser = await localStorageService.updateProfile(normalized42Username, {
                            lastLogin: new Date().toISOString()
                        });
                        
                        this.saveSession(updatedUser);
                    } else {
                        // Create new user
                        // Generate a secure random password for the 42 account
                        const randomPassword = Array(20)
                            .fill(0)
                            .map(() => Math.random().toString(36).charAt(2))
                            .join('');
                        
                        const newUser = await localStorageService.registerPlayer(
                            normalized42Username,
                            randomPassword,
                            email,
                            displayName
                        );
                        
                        // Update avatar
                        await localStorageService.updateProfile(normalized42Username, { avatar });
                        
                        // Get the updated user
                        const userWithAvatar = await localStorageService.getPlayer(normalized42Username);
                        
                        this.saveSession(userWithAvatar);
                    }
                    
                    // Close the modal
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    bsModal.hide();
                    
                    // Dispatch login event
                    document.dispatchEvent(new CustomEvent('auth:login'));
                    
                    // Redirect to oauth success page
                    window.navigateTo('/oauth-success');
                } catch (error) {
                    console.error('Error in mock 42 authentication:', error);
                    alert(`Authentication error: ${error.message}`);
                }
            });
        }
        
        // Show the modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Debugging: List all users
     */
    listAllUsers() {
        return localStorageService.listAllUsers();
    }
}

// Create singleton instance
const authService = new AuthService();

export default authService;