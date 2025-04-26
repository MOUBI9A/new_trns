/**
 * Game Hub SPA - Server
 * Handles file-based storage operations for player data
 */

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const axios = require('axios'); // For HTTP requests to 42 API

// Detect GitHub Codespace environment
const isGitHubCodespace = !!process.env.CODESPACE_NAME;
const codespaceUrl = isGitHubCodespace ? `https://app.github.dev` : null;

// OAuth 2.0 configuration for 42
const OAUTH_CONFIG = {
    clientID: 'u-s4t2ud-bd6565de05f582b9b2049550df8505bff5f34e4ef217fe2e3cffa2e20a8401c5',
    clientSecret: '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',
    // Determine the appropriate redirect URI based on environment
    redirectURI: isGitHubCodespace 
        ? `${codespaceUrl}/api/auth/42/callback` 
        : 'http://localhost:3000/api/auth/42/callback',
    authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
    tokenURL: 'https://api.intra.42.fr/oauth/token',
    profileURL: 'https://api.intra.42.fr/v2/me'
};

// Log the redirect URI being used
console.log(`Using 42 OAuth redirect URI: ${OAUTH_CONFIG.redirectURI}`);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' })); // Increased limit for avatar uploads
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Session configuration
app.use(session({
    secret: 'game-hub-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Debug middleware to check session status
app.use((req, res, next) => {
    // Log session info in dev mode
    if (req.path.startsWith('/api/')) {
        console.log(`Session check - Path: ${req.path}, Method: ${req.method}, Session username: ${req.session.username || 'none'}`);
    }
    next();
});

// Ensure players directory exists
const DATA_DIR = path.join(__dirname, 'data');
const PLAYERS_DIR = path.join(DATA_DIR, 'players');
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(PLAYERS_DIR);

// Helper functions
const getPlayerFilePath = (username) => path.join(PLAYERS_DIR, `${username.toLowerCase()}.json`);

const playerExists = (username) => {
    return fs.existsSync(getPlayerFilePath(username));
};

const readPlayer = async (username) => {
    try {
        const filePath = getPlayerFilePath(username);
        if (fs.existsSync(filePath)) {
            const data = await fs.readFile(filePath, 'utf8');
            try {
                // Try to parse the JSON data
                return JSON.parse(data);
            } catch (parseError) {
                console.error(`JSON parse error for player ${username}:`, parseError);
                
                // Attempt to repair the file
                const repaired = await attemptFileRepair(username, data, parseError);
                if (repaired) {
                    console.log(`Successfully repaired player file for ${username}`);
                    return repaired;
                }
                
                // If repair failed, return null
                return null;
            }
        }
        return null;
    } catch (error) {
        console.error(`Error reading player ${username}:`, error);
        return null;
    }
};

// Attempt to repair a corrupted player file
const attemptFileRepair = async (username, data, parseError) => {
    try {
        // Create a backup of the corrupted file
        const filePath = getPlayerFilePath(username);
        const backupPath = `${filePath}.corrupted_${Date.now()}`;
        await fs.writeFile(backupPath, data, 'utf8');
        console.log(`Created backup of corrupted file: ${backupPath}`);
        
        // Check common corruption scenarios
        let repairedData = null;
        
        // Case 1: Unexpected end of JSON (truncated file)
        if (parseError.message.includes('Unexpected end of JSON')) {
            // Create minimal valid player data
            repairedData = {
                username: username,
                email: `${username}@repaired.gamehub`,
                displayName: username,
                registeredAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                avatar: null,
                friends: [],
                stats: {
                    totalMatches: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    byGame: {}
                },
                matchHistory: []
            };
        }
        
        // Case 2: Extra data after valid JSON
        else if (parseError.message.includes('Unexpected non-whitespace character after JSON')) {
            // Try to extract only the valid JSON part
            const position = parseError.message.match(/position (\d+)/);
            if (position && position[1]) {
                const validPart = data.substring(0, parseInt(position[1]));
                try {
                    repairedData = JSON.parse(validPart);
                } catch (e) {
                    // Failed to extract valid JSON
                }
            }
        }
        
        // If we have repaired data, save it
        if (repairedData) {
            await writePlayer(username, repairedData);
            return repairedData;
        }
        
        return null;
    } catch (error) {
        console.error(`Error repairing file for player ${username}:`, error);
        return null;
    }
};

// Update writePlayer to be more robust
const writePlayer = async (username, data) => {
    try {
        const filePath = getPlayerFilePath(username);
        
        // First write to temporary file
        const tempPath = `${filePath}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
        
        // Verify the temp file is valid JSON
        try {
            const checkData = await fs.readFile(tempPath, 'utf8');
            JSON.parse(checkData); // Just to validate
            
            // If valid, replace the original file
            await fs.rename(tempPath, filePath);
            return true;
        } catch (error) {
            // Remove invalid temp file
            await fs.unlink(tempPath).catch(() => {});
            console.error(`Failed to write valid JSON for player ${username}`);
            throw error;
        }
    } catch (error) {
        console.error(`Error writing player ${username}:`, error);
        return false;
    }
};

// Helper function to check if a username exists (case-insensitive)
const checkUsernameExists = async (username) => {
    try {
        const files = await fs.readdir(PLAYERS_DIR);
        const normalizedUsername = username.toLowerCase();
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const fileUsername = file.replace('.json', '').toLowerCase();
                if (fileUsername === normalizedUsername) {
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking username existence:', error);
        throw error;
    }
};

// Helper function to check if an email exists
const checkEmailExists = async (email) => {
    try {
        const files = await fs.readdir(PLAYERS_DIR);
        const normalizedEmail = email.toLowerCase();
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(PLAYERS_DIR, file);
                const data = await fs.readFile(filePath, 'utf8');
                const player = JSON.parse(data);
                
                if (player.email && player.email.toLowerCase() === normalizedEmail) {
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking email existence:', error);
        throw error;
    }
};

// Add database backup functionality
const createDatabaseBackup = async () => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(DATA_DIR, 'backups', timestamp);
        
        // Create backup directory
        await fs.ensureDir(backupDir);
        
        // Copy all player files
        const files = await fs.readdir(PLAYERS_DIR);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const sourcePath = path.join(PLAYERS_DIR, file);
                const destPath = path.join(backupDir, file);
                await fs.copy(sourcePath, destPath);
            }
        }
        
        console.log(`Database backup created at ${backupDir}`);
        return true;
    } catch (error) {
        console.error('Error creating database backup:', error);
        return false;
    }
};

// Schedule daily backups at midnight
const scheduleDailyBackup = () => {
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // next day
        0, // midnight
        1  // 1 minute after midnight
    );
    
    // Time until next backup
    const msUntilBackup = night.getTime() - now.getTime();
    
    // Schedule next backup
    setTimeout(async () => {
        await createDatabaseBackup();
        scheduleDailyBackup(); // Schedule the next one
    }, msUntilBackup);
    
    console.log(`Next database backup scheduled for ${night.toLocaleString()}`);
};

// Create a backup when server starts
createDatabaseBackup().then(() => {
    // Schedule regular backups
    scheduleDailyBackup();
});

// API endpoint for manually triggering a backup (admin only)
app.post('/api/admin/backup', async (req, res) => {
    try {
        // In a production environment, add admin authentication check here
        const result = await createDatabaseBackup();
        if (result) {
            res.json({ success: true, message: 'Backup created successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to create backup' });
        }
    } catch (error) {
        console.error('Error handling backup request:', error);
        res.status(500).json({ success: false, message: 'Error creating backup' });
    }
});

// OAuth routes for 42 authentication

// Route to initiate 42 OAuth flow
app.get('/api/auth/42', (req, res) => {
    const authURL = `${OAUTH_CONFIG.authorizationURL}?client_id=${OAUTH_CONFIG.clientID}&redirect_uri=${encodeURIComponent(OAUTH_CONFIG.redirectURI)}&response_type=code`;
    res.redirect(authURL);
});

// 42 OAuth callback route
app.get('/api/auth/42/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.redirect('/#/login?error=no_code');
        }

        // Exchange code for access token
        const tokenResponse = await axios.post(OAUTH_CONFIG.tokenURL, {
            grant_type: 'authorization_code',
            client_id: OAUTH_CONFIG.clientID,
            client_secret: OAUTH_CONFIG.clientSecret,
            code,
            redirect_uri: OAUTH_CONFIG.redirectURI
        });

        const { access_token } = tokenResponse.data;

        // Get user profile from 42 API
        const userProfileResponse = await axios.get(OAUTH_CONFIG.profileURL, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });
        
        const profile = userProfileResponse.data;
        
        // Process 42 user profile - handle registration/login
        const username = `42_${profile.login}`;
        const email = profile.email;
        const displayName = profile.displayname || profile.login;
        const avatar = profile.image?.versions?.medium || null;
        
        // Check if user already exists
        const existingUser = await readPlayer(username);
        let player;
        
        if (existingUser) {
            // Update existing user's info
            player = existingUser;
            player.lastLogin = new Date().toISOString();
            
            // Update profile with latest 42 data
            player.displayName = displayName;
            player.email = email;
            
            // Only update avatar if user hasn't uploaded a custom one
            if (!player.hasCustomAvatar && avatar) {
                player.avatar = avatar;
            }
            
            await writePlayer(username, player);
        } else {
            // Create new player from 42 data
            player = {
                username,
                email,
                displayName,
                registeredAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                avatar,
                authProvider: '42',
                providerUserId: profile.id,
                friends: [],
                stats: {
                    totalMatches: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    byGame: {}
                },
                matchHistory: []
            };
            
            await writePlayer(username, player);
        }
        
        // Set session data
        req.session.username = username;
        req.session.authProvider = '42';
        
        // Remove sensitive data before returning to client
        const returnPlayer = { ...player };
        delete returnPlayer.password; // In case there was a password
        
        // Redirect to home page with successful login
        res.redirect('/#/oauth-success');
    } catch (error) {
        console.error('42 OAuth error:', error.response?.data || error.message);
        res.redirect('/#/login?error=auth_error');
    }
});

// Add user check endpoint
app.get('/api/auth/check', (req, res) => {
    if (!req.session.username) {
        return res.json({ isAuthenticated: false });
    }
    
    readPlayer(req.session.username)
        .then(player => {
            if (!player) {
                return res.json({ isAuthenticated: false });
            }
            
            const userInfo = {
                username: player.username,
                displayName: player.displayName,
                email: player.email,
                avatar: player.avatar,
                authProvider: player.authProvider || 'local'
            };
            
            res.json({ isAuthenticated: true, user: userInfo });
        })
        .catch(error => {
            console.error('Error checking auth:', error);
            res.json({ isAuthenticated: false, error: 'Error checking authentication' });
        });
});

// Return user data if authenticated through 42
app.get('/api/auth/42/user', async (req, res) => {
    if (!req.session.username || req.session.authProvider !== '42') {
        return res.status(401).json({ success: false, message: 'Not authenticated with 42' });
    }
    
    try {
        const player = await readPlayer(req.session.username);
        
        if (!player) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Remove sensitive information
        const returnPlayer = { ...player };
        delete returnPlayer.password;
        
        res.json({ success: true, player: returnPlayer });
    } catch (error) {
        console.error('Error getting 42 user:', error);
        res.status(500).json({ success: false, message: 'Error retrieving user data' });
    }
});

// API Routes

// Authentication routes should come before dynamic username routes
// Register new player
app.post('/api/players/register', async (req, res) => {
    try {
        const { username, password, email, displayName } = req.body;
        
        if (!username || !password || !email) {
            return res.status(400).json({ success: false, message: 'Username, password, and email are required' });
        }
        
        // Validate username format
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return res.status(400).json({ success: false, message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' });
        }
        
        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
        }
        
        // Check for username duplicates (case-insensitive)
        const usernameExists = await checkUsernameExists(username);
        if (usernameExists) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }
        
        // Check for email duplicates
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
            return res.status(400).json({ success: false, message: 'Email address is already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new player
        const now = new Date().toISOString();
        const player = {
            username,
            email,
            displayName: displayName || username,
            password: hashedPassword,
            registeredAt: now,
            lastLogin: now,
            avatar: null,
            friends: [],
            stats: {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                byGame: {}
            },
            matchHistory: []
        };
        
        await writePlayer(username, player);
        
        // Return player data without sensitive information
        const returnPlayer = { ...player };
        delete returnPlayer.password;
        
        req.session.username = username;
        
        res.status(201).json({ success: true, player: returnPlayer });
    } catch (error) {
        console.error('Error registering player:', error);
        res.status(500).json({ success: false, message: 'Error registering player' });
    }
});

// Login player
app.post('/api/players/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }
        
        const player = await readPlayer(username);
        
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }
        
        const passwordMatch = await bcrypt.compare(password, player.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }
        
        // Update last login time
        player.lastLogin = new Date().toISOString();
        await writePlayer(username, player);
        
        // Return player data without sensitive information
        const returnPlayer = { ...player };
        delete returnPlayer.password;
        
        req.session.username = username;
        
        res.json({ success: true, player: returnPlayer });
    } catch (error) {
        console.error('Error logging in player:', error);
        res.status(500).json({ success: false, message: 'Error logging in' });
    }
});

// Logout player
app.post('/api/players/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Get all players (usernames only)
app.get('/api/players', async (req, res) => {
    try {
        const files = await fs.readdir(PLAYERS_DIR);
        const players = files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
        
        res.json({ success: true, players });
    } catch (error) {
        console.error('Error getting players:', error);
        res.status(500).json({ success: false, message: 'Error getting players' });
    }
});

// Get specific player
app.get('/api/players/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const player = await readPlayer(username);
        
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }
        
        // Remove sensitive information
        delete player.password;
        
        res.json({ success: true, player });
    } catch (error) {
        console.error(`Error getting player ${req.params.username}:`, error);
        res.status(500).json({ success: false, message: 'Error getting player' });
    }
});

// Update player profile
app.put('/api/players/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const updates = req.body;
        
        // Ensure player exists
        const player = await readPlayer(username);
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }
        
        // Check session authentication
        if (req.session.username !== username) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
        }
        
        // Handle avatar upload with special validation
        if (updates.avatar) {
            try {
                // Validate the avatar data
                if (!validateAvatarData(updates.avatar)) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Invalid avatar image format. Please upload a valid image.'
                    });
                }
                
                // Set the avatar in the player object
                player.avatar = updates.avatar;
                console.log(`Avatar updated for player ${username}`);
            } catch (error) {
                console.error('Error processing avatar:', error);
                return res.status(400).json({ 
                    success: false, 
                    message: 'Error processing avatar image. Please try a different image.'
                });
            }
        }
        
        // Apply other updates (excluding sensitive fields and avatar which was handled separately)
        const allowedUpdates = ['email', 'displayName'];
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                player[field] = updates[field];
            }
        });
        
        await writePlayer(username, player);
        
        // Return updated player without sensitive information
        const returnPlayer = { ...player };
        delete returnPlayer.password;
        
        res.json({ success: true, player: returnPlayer });
    } catch (error) {
        console.error(`Error updating player ${req.params.username}:`, error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

/**
 * Validate avatar data to ensure it's a proper image
 * @param {string} avatarData - Base64 encoded image data
 * @returns {boolean} True if valid, false otherwise
 */
function validateAvatarData(avatarData) {
    // Check if it's a base64 image string
    if (!avatarData || typeof avatarData !== 'string' || !avatarData.startsWith('data:image/')) {
        return false;
    }
    
    // Validate size - check if string length is reasonable (max ~2MB after base64 encoding)
    // Base64 encoding increases size by ~33%, so 2.7MB in base64 is roughly 2MB of binary data
    const maxBase64Length = 2.7 * 1024 * 1024; // ~2MB after base64 encoding
    if (avatarData.length > maxBase64Length) {
        return false;
    }
    
    // Check for valid mime types
    const validMimeTypes = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/gif'];
    return validMimeTypes.some(type => avatarData.startsWith(type));
}

// Add match to player history
app.post('/api/players/:username/matches', async (req, res) => {
    try {
        const { username } = req.params;
        const matchData = req.body;
        
        // Ensure player exists
        const player = await readPlayer(username);
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }
        
        // Check session authentication
        if (req.session.username !== username) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
        }
        
        // Initialize match history if it doesn't exist
        if (!player.matchHistory) {
            player.matchHistory = [];
        }
        
        // Initialize stats if they don't exist
        if (!player.stats) {
            player.stats = {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                byGame: {}
            };
        }
        
        // Initialize game stats if it doesn't exist
        if (matchData.game && !player.stats.byGame[matchData.game]) {
            player.stats.byGame[matchData.game] = {
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
        
        player.matchHistory.unshift(match); // Add to beginning of array
        
        // Update stats
        player.stats.totalMatches++;
        
        if (matchData.game) {
            player.stats.byGame[matchData.game].totalMatches++;
            
            if (matchData.result === 'win') {
                player.stats.wins++;
                player.stats.byGame[matchData.game].wins++;
            } else if (matchData.result === 'loss') {
                player.stats.losses++;
                player.stats.byGame[matchData.game].losses++;
            } else if (matchData.result === 'draw') {
                player.stats.draws++;
                player.stats.byGame[matchData.game].draws++;
            }
        }
        
        await writePlayer(username, player);
        
        // Return updated player without sensitive information
        const returnPlayer = { ...player };
        delete returnPlayer.password;
        
        res.json({ success: true, player: returnPlayer });
    } catch (error) {
        console.error(`Error adding match for player ${req.params.username}:`, error);
        res.status(500).json({ success: false, message: 'Error adding match' });
    }
});

// Clear match history
app.delete('/api/players/:username/matches', async (req, res) => {
    try {
        const { username } = req.params;
        
        // Ensure player exists
        const player = await readPlayer(username);
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }
        
        // Check session authentication
        if (req.session.username !== username) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
        }
        
        // Clear match history
        player.matchHistory = [];
        
        // Reset stats
        player.stats = {
            totalMatches: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            byGame: {}
        };
        
        await writePlayer(username, player);
        
        // Return updated player without sensitive information
        const returnPlayer = { ...player };
        delete returnPlayer.password;
        
        res.json({ success: true, player: returnPlayer });
    } catch (error) {
        console.error(`Error clearing matches for player ${req.params.username}:`, error);
        res.status(500).json({ success: false, message: 'Error clearing match history' });
    }
});

// Add/Remove friend
app.post('/api/players/:username/friends', async (req, res) => {
    try {
        const { username } = req.params;
        const { friendUsername, action } = req.body;
        
        if (!friendUsername || !['add', 'remove'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid request parameters' });
        }
        
        // Ensure player exists
        const player = await readPlayer(username);
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }
        
        // Check session authentication
        if (req.session.username !== username) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
        }
        
        // Ensure friend player exists
        const friendPlayer = await readPlayer(friendUsername);
        if (!friendPlayer) {
            return res.status(404).json({ success: false, message: 'Friend player not found' });
        }
        
        // Initialize friends array if it doesn't exist
        if (!player.friends) {
            player.friends = [];
        }
        
        // Initialize friend's friends array if it doesn't exist
        if (!friendPlayer.friends) {
            friendPlayer.friends = [];
        }
        
        if (action === 'add') {
            // Check if already friends
            if (player.friends.includes(friendUsername)) {
                return res.status(400).json({ success: false, message: 'Already friends with this user' });
            }
            
            // Add friend relationship both ways
            player.friends.push(friendUsername);
            friendPlayer.friends.push(username);
        } else if (action === 'remove') {
            // Remove friend relationship both ways
            player.friends = player.friends.filter(f => f !== friendUsername);
            friendPlayer.friends = friendPlayer.friends.filter(f => f !== username);
        }
        
        await writePlayer(username, player);
        await writePlayer(friendUsername, friendPlayer);
        
        // Return updated player without sensitive information
        const returnPlayer = { ...player };
        delete returnPlayer.password;
        
        res.json({ success: true, player: returnPlayer });
    } catch (error) {
        console.error(`Error updating friends for player ${req.params.username}:`, error);
        res.status(500).json({ success: false, message: 'Error updating friends' });
    }
});

// Catch-all route for SPA
app.get('*', (req, res) => {
    // Don't handle API routes with this catch-all
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} in your browser`);
});