/**
 * Test Data Generator Script
 * For generating test data for the Game Hub application
 */

import testDataGenerator from './src/js/services/TestDataGenerator.js';
import authService from './src/js/services/AuthService.js';

// DOM Elements
const userGeneratorForm = document.getElementById('user-generator-form');
const matchGeneratorForm = document.getElementById('match-generator-form');
const clearUsersBtn = document.getElementById('clear-users');
const clearMatchesBtn = document.getElementById('clear-matches');
const resultPanel = document.getElementById('result-panel');
const clearLogBtn = document.getElementById('clear-log');
const usernameSelect = document.getElementById('username');
const userList = document.getElementById('user-list');
const refreshUsersBtn = document.getElementById('refresh-users');

// ---- Logger Functions ----

/**
 * Log a message to the result panel
 * @param {string} message - The message to log
 * @param {string} type - The type of message (info, success, error, warning)
 */
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    let logClass = '';
    let prefix = '';
    
    switch (type) {
        case 'success':
            logClass = 'text-success';
            prefix = '✓ ';
            break;
        case 'error':
            logClass = 'text-danger';
            prefix = '✗ ';
            break;
        case 'warning':
            logClass = 'text-warning';
            prefix = '⚠ ';
            break;
        default:
            logClass = 'text-info';
            prefix = 'ℹ ';
    }
    
    const logItem = document.createElement('div');
    logItem.className = logClass;
    logItem.innerHTML = `[${timestamp}] ${prefix}${message}`;
    resultPanel.appendChild(logItem);
    
    // Auto-scroll to the latest log
    resultPanel.scrollTop = resultPanel.scrollHeight;
}

/**
 * Clear the log panel
 */
function clearLog() {
    resultPanel.innerHTML = '';
}

// ---- User Management ----

/**
 * Generate a random user
 * @param {number} index - The index of the user
 * @param {boolean} includeAvatar - Whether to include an avatar
 */
function generateUser(index, includeAvatar = true) {
    const username = `test_user${index}`;
    const email = `test${index}@example.com`;
    const displayName = `Test User ${index}`;
    const password = 'password123';
    
    // Including an avatar if specified
    const avatar = includeAvatar ? 
        `https://i.pravatar.cc/150?u=${username}` : null;
    
    return {
        username,
        email,
        displayName,
        password,
        avatar
    };
}

/**
 * Generate multiple users
 * @param {number} count - The number of users to generate
 * @param {boolean} includeAvatars - Whether to include avatars
 * @param {boolean} createFriends - Whether to create friend connections
 */
async function generateUsers(count, includeAvatars = true, createFriends = false) {
    log(`Generating ${count} test users...`);
    
    try {
        const users = [];
        
        // Create each user
        for (let i = 1; i <= count; i++) {
            const userData = generateUser(i, includeAvatars);
            
            try {
                // Register user in the system
                await authService.register(
                    userData.username, 
                    userData.password, 
                    userData.email, 
                    userData.displayName,
                    userData.avatar
                );
                
                users.push(userData.username);
                log(`Created user: ${userData.username}`, 'success');
            } catch (error) {
                log(`Failed to create user ${userData.username}: ${error.message}`, 'error');
            }
        }
        
        // Create friend connections if specified
        if (createFriends && users.length > 1) {
            log('Creating friend connections...', 'info');
            
            for (let i = 0; i < users.length; i++) {
                // Each user sends friend request to the next user in a circular manner
                const sender = users[i];
                const receiver = users[(i + 1) % users.length];
                
                try {
                    await authService.sendFriendRequest(sender, receiver);
                    log(`${sender} sent friend request to ${receiver}`, 'success');
                    
                    // Accept the friend request
                    await authService.acceptFriendRequest(receiver, sender);
                    log(`${receiver} accepted ${sender}'s friend request`, 'success');
                } catch (error) {
                    log(`Failed to create friend connection: ${error.message}`, 'error');
                }
            }
        }
        
        log(`Generated ${users.length} users successfully`, 'success');
        return users;
    } catch (error) {
        log(`Error generating users: ${error.message}`, 'error');
        return [];
    } finally {
        // Refresh UI components
        refreshUserList();
        populateUserSelect();
    }
}

/**
 * Clear all users from the system
 */
async function clearAllUsers() {
    if (!confirm('Are you sure you want to clear all users? This cannot be undone.')) {
        return;
    }
    
    log('Clearing all users...', 'warning');
    
    try {
        // Get all users
        const users = authService.loadUsers();
        const usernames = Object.keys(users);
        
        if (usernames.length === 0) {
            log('No users found to clear', 'info');
            return;
        }
        
        // Log current user out if logged in
        if (authService.isAuthenticated()) {
            await authService.logout();
            log('Logged out current user', 'info');
        }
        
        // Clear local storage
        localStorage.removeItem('game_hub_users');
        localStorage.removeItem('game_hub_session');
        
        log(`Cleared ${usernames.length} users successfully`, 'success');
    } catch (error) {
        log(`Error clearing users: ${error.message}`, 'error');
    } finally {
        // Refresh UI components
        refreshUserList();
        populateUserSelect();
    }
}

/**
 * Refresh the user list display
 */
function refreshUserList() {
    try {
        const users = authService.loadUsers();
        const usernames = Object.keys(users);
        
        if (usernames.length === 0) {
            userList.innerHTML = '<div class="text-muted">No users found. Generate some users first.</div>';
            return;
        }
        
        let html = '<ul class="list-group">';
        
        usernames.forEach(username => {
            const user = users[username];
            const avatarHtml = user.avatar ? 
                `<img src="${user.avatar}" alt="${user.displayName}" class="rounded-circle me-2" width="24" height="24">` :
                `<i class="bi bi-person-circle me-2"></i>`;
            
            html += `
                <li class="list-group-item d-flex align-items-center">
                    ${avatarHtml}
                    <div>
                        <strong>${user.displayName || username}</strong>
                        <small class="d-block text-muted">@${username}</small>
                    </div>
                    <div class="ms-auto">
                        <span class="badge bg-primary">${(user.matchHistory || []).length} matches</span>
                        <span class="badge bg-secondary">${(user.friends || []).length} friends</span>
                    </div>
                </li>
            `;
        });
        
        html += '</ul>';
        userList.innerHTML = html;
    } catch (error) {
        log(`Error refreshing user list: ${error.message}`, 'error');
        userList.innerHTML = '<div class="text-danger">Error loading user list</div>';
    }
}

/**
 * Populate the username select dropdown
 */
function populateUserSelect() {
    try {
        const users = authService.loadUsers();
        const usernames = Object.keys(users);
        
        // Clear existing options except the default
        while (usernameSelect.options.length > 1) {
            usernameSelect.remove(1);
        }
        
        // Add options for each user
        usernames.forEach(username => {
            const option = document.createElement('option');
            option.value = username;
            option.textContent = `${users[username].displayName || username} (@${username})`;
            usernameSelect.appendChild(option);
        });
    } catch (error) {
        log(`Error populating user select: ${error.message}`, 'error');
    }
}

// ---- Match History ----

/**
 * Generate match history for a user
 * @param {string} username - The username to generate match history for
 * @param {number} count - The number of matches to generate
 * @param {string} type - The type of match generation ('random' or 'chronological')
 */
async function generateMatchHistory(username, count, type = 'random') {
    if (!username) {
        log('Please select a user to generate match history for', 'warning');
        return;
    }
    
    log(`Generating ${count} matches for ${username}...`);
    
    try {
        let result = false;
        
        // First login as the user
        try {
            await authService.login(username, 'password123');
            log(`Logged in as ${username}`, 'success');
        } catch (error) {
            log(`Failed to log in as ${username}: ${error.message}`, 'error');
            return;
        }
        
        // Generate matches based on type
        if (type === 'chronological') {
            result = testDataGenerator.addChronologicalMatches(count);
            if (result) {
                log(`Generated ${count} chronological matches for ${username}`, 'success');
            }
        } else {
            result = testDataGenerator.addRandomMatchesToHistory(count);
            if (result) {
                log(`Generated ${count} random matches for ${username}`, 'success');
            }
        }
        
        if (!result) {
            log(`Failed to generate matches for ${username}`, 'error');
        }
        
        // Log out after generating matches
        await authService.logout();
        log(`Logged out ${username}`, 'info');
    } catch (error) {
        log(`Error generating match history: ${error.message}`, 'error');
    } finally {
        refreshUserList();
    }
}

/**
 * Clear match history for a user
 * @param {string} username - The username to clear match history for
 */
async function clearMatchHistory(username) {
    if (!username) {
        log('Please select a user to clear match history for', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to clear match history for ${username}? This cannot be undone.`)) {
        return;
    }
    
    log(`Clearing match history for ${username}...`, 'warning');
    
    try {
        // First login as the user
        try {
            await authService.login(username, 'password123');
            log(`Logged in as ${username}`, 'success');
        } catch (error) {
            log(`Failed to log in as ${username}: ${error.message}`, 'error');
            return;
        }
        
        // Clear match history
        const result = testDataGenerator.clearMatchHistory();
        
        if (result) {
            log(`Cleared match history for ${username}`, 'success');
        } else {
            log(`Failed to clear match history for ${username}`, 'error');
        }
        
        // Log out after clearing matches
        await authService.logout();
        log(`Logged out ${username}`, 'info');
    } catch (error) {
        log(`Error clearing match history: ${error.message}`, 'error');
    } finally {
        refreshUserList();
    }
}

// ---- Event Listeners ----

// User Generator Form Submit
userGeneratorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userCount = parseInt(document.getElementById('user-count').value, 10);
    const includeAvatars = document.getElementById('include-avatars').checked;
    const includeFriends = document.getElementById('include-friends').checked;
    
    await generateUsers(userCount, includeAvatars, includeFriends);
});

// Match Generator Form Submit
matchGeneratorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameSelect.value;
    const matchCount = parseInt(document.getElementById('match-count').value, 10);
    const matchType = document.getElementById('match-type').value;
    
    await generateMatchHistory(username, matchCount, matchType);
});

// Clear Users Button
clearUsersBtn.addEventListener('click', async () => {
    await clearAllUsers();
});

// Clear Matches Button
clearMatchesBtn.addEventListener('click', async () => {
    const username = usernameSelect.value;
    await clearMatchHistory(username);
});

// Clear Log Button
clearLogBtn.addEventListener('click', () => {
    clearLog();
});

// Refresh Users Button
refreshUsersBtn.addEventListener('click', () => {
    refreshUserList();
    populateUserSelect();
    log('User list refreshed', 'info');
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    refreshUserList();
    populateUserSelect();
    log('Test Data Generator initialized', 'success');
});
