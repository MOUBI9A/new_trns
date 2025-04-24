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

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Session configuration
app.use(session({
    secret: 'game-hub-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

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
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error(`Error reading player ${username}:`, error);
        return null;
    }
};

const writePlayer = async (username, data) => {
    try {
        const filePath = getPlayerFilePath(username);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing player ${username}:`, error);
        return false;
    }
};

// API Routes

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

// Register new player
app.post('/api/players/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }
        
        if (playerExists(username)) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new player
        const now = new Date().toISOString();
        const player = {
            username,
            email: email || '',
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
        
        // Apply updates (excluding sensitive fields)
        const allowedUpdates = ['avatar', 'email'];
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
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} in your browser`);
});