import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';
import testDataGenerator from '../services/TestDataGenerator.js';

export default class Profile extends AbstractView {
    constructor(params = {}, queryParams = {}) {
        super(params);
        
        // Check if we're viewing another user's profile
        this.username = params.username || null;
        this.isOwnProfile = !this.username;
        
        // If we're viewing our own profile, get current user
        this.currentUser = authService.getCurrentUser();
        this.isEditing = false;
        this.profileData = null;
        this.matchHistory = [];
        
        // Set the title based on whose profile we're viewing
        if (this.isOwnProfile) {
            this.setTitle('Game Hub - My Profile');
        } else {
            this.setTitle(`Game Hub - ${this.username}'s Profile`);
            // Redirect if not authenticated when viewing another profile
            if (!authService.isAuthenticated()) {
                window.navigateTo('/login');
                return;
            }
            // Load the other user's profile
            try {
                this.profileData = authService.getUserProfile(this.username);
                this.matchHistory = authService.getUserMatchHistory(this.username);
            } catch (error) {
                console.error('Error loading profile:', error);
                window.navigateTo('/notfound');
                return;
            }
        }
    }

    async getHtml() {
        // Get user data
        const user = this.isOwnProfile ? this.currentUser : this.profileData;
        
        if (!user) {
            return `
                <div class="view-container fade-in">
                    <div class="alert alert-danger" role="alert">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        User not found
                    </div>
                    <button class="btn btn-primary" onclick="window.navigateTo('/')">
                        <i class="bi bi-house me-2"></i>Go to Home Page
                    </button>
                </div>
            `;
        }
        
        const displayName = user.displayName || user.username;
        const username = user.username;
        const email = this.isOwnProfile ? (user.email || 'Not provided') : null; // Only show email on own profile
        const joinDate = new Date(user.created || Date.now()).toLocaleDateString();
        
        // Avatar HTML
        let avatarHtml = '';
        if (user.avatar) {
            avatarHtml = `<img src="${user.avatar}" alt="Profile" class="profile-avatar rounded-circle">`;
        } else {
            avatarHtml = `<div class="profile-avatar-placeholder d-flex align-items-center justify-content-center bg-light rounded-circle">
                <i class="bi bi-person-circle" style="font-size: 4rem;"></i>
            </div>`;
        }
        
        // Online status
        const onlineStatus = user.online ? 
            `<span class="badge bg-success">Online Now</span>` : 
            `<span class="badge bg-secondary">Offline</span>`;
        
        return `
            <div class="view-container fade-in">
                <h1 class="section-title">${this.isOwnProfile ? 'Your Profile' : `${displayName}'s Profile`}</h1>
                
                <div class="row">
                    <!-- User Info Section -->
                    <div class="col-lg-12 mb-4">
                        <div class="card">
                            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">User Information</h5>
                                ${this.isOwnProfile ? `
                                <button id="edit-profile-btn" class="btn btn-sm btn-light">
                                    <i class="bi bi-pencil-square"></i> Edit
                                </button>
                                ` : ''}
                            </div>
                            <div class="card-body">
                                <!-- Display Profile Section -->
                                <div id="profile-info-section">
                                    <div class="row">
                                        <div class="col-md-3 text-center mb-4 mb-md-0">
                                            <div class="avatar-container mb-3">
                                                ${avatarHtml}
                                            </div>
                                            <div class="user-status">
                                                ${onlineStatus}
                                                ${user.lastSeen && !user.online ? `
                                                <div class="text-muted small mt-1">
                                                    Last seen: ${this.formatLastSeen(user.lastSeen)}
                                                </div>
                                                ` : ''}
                                            </div>
                                            ${!this.isOwnProfile ? `
                                            <div class="profile-actions mt-3">
                                                <button id="add-friend-btn" class="btn btn-sm btn-outline-primary" ${this.isFriend(username) ? 'disabled' : ''}>
                                                    <i class="bi bi-person-plus"></i> 
                                                    ${this.isFriend(username) ? 'Already Friends' : 'Add Friend'}
                                                </button>
                                                <button id="challenge-btn" class="btn btn-sm btn-outline-success">
                                                    <i class="bi bi-controller"></i> Challenge
                                                </button>
                                            </div>
                                            ` : ''}
                                        </div>
                                        <div class="col-md-9">
                                            <div class="row mb-3">
                                                <div class="col-sm-3 fw-bold">Display Name:</div>
                                                <div class="col-sm-9">${displayName}</div>
                                            </div>
                                            <div class="row mb-3">
                                                <div class="col-sm-3 fw-bold">Username:</div>
                                                <div class="col-sm-9">${username}</div>
                                            </div>
                                            ${this.isOwnProfile ? `
                                            <div class="row mb-3">
                                                <div class="col-sm-3 fw-bold">Email:</div>
                                                <div class="col-sm-9">${email}</div>
                                            </div>
                                            ` : ''}
                                            <div class="row mb-3">
                                                <div class="col-sm-3 fw-bold">Joined:</div>
                                                <div class="col-sm-9">${joinDate}</div>
                                            </div>
                                            <div class="row">
                                                <div class="col-sm-3 fw-bold">Stats:</div>
                                                <div class="col-sm-9">
                                                    <div class="d-flex">
                                                        <div class="me-4">
                                                            <span class="fw-bold text-success">${user.stats?.wins || 0}</span> Wins
                                                        </div>
                                                        <div class="me-4">
                                                            <span class="fw-bold text-danger">${user.stats?.losses || 0}</span> Losses
                                                        </div>
                                                        <div>
                                                            <span class="fw-bold text-secondary">${user.stats?.draws || 0}</span> Draws
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Edit Profile Section (Hidden by default) -->
                                ${this.isOwnProfile ? `
                                <div id="profile-edit-section" class="d-none">
                                    <form id="profile-edit-form">
                                        <div class="row">
                                            <div class="col-md-3 text-center mb-4 mb-md-0">
                                                <div class="avatar-upload">
                                                    <div class="avatar-preview">
                                                        ${avatarHtml.replace('profile-avatar', 'avatar-preview-img')}
                                                        <div class="avatar-overlay">
                                                            <i class="bi bi-camera"></i>
                                                            <small>Change</small>
                                                        </div>
                                                    </div>
                                                    <input type="file" id="avatar-upload" class="avatar-input" accept="image/*">
                                                </div>
                                            </div>
                                            <div class="col-md-9">
                                                <div class="mb-3">
                                                    <label for="displayName" class="form-label">Display Name</label>
                                                    <input type="text" class="form-control" id="displayName" value="${displayName}">
                                                    <div class="form-text">This is the name that will be displayed to other users</div>
                                                </div>
                                                <div class="mb-3">
                                                    <label for="profile-username" class="form-label">Username</label>
                                                    <input type="text" class="form-control" id="profile-username" value="${username}" disabled>
                                                    <div class="form-text text-muted">Username cannot be changed</div>
                                                </div>
                                                <div class="mb-3">
                                                    <label for="profile-email" class="form-label">Email</label>
                                                    <input type="email" class="form-control" id="profile-email" value="${email}">
                                                </div>
                                                <div class="edit-controls">
                                                    <button type="button" id="cancel-edit-btn" class="btn btn-outline-secondary">Cancel</button>
                                                    <button type="submit" class="btn btn-primary">Save Changes</button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Match History Section -->
                    <div class="col-lg-12">
                        <div class="card">
                            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Match History</h5>
                                ${this.isOwnProfile ? `
                                <div class="btn-group">
                                    <button id="refresh-history-btn" class="btn btn-sm btn-light me-2">
                                        <i class="bi bi-arrow-clockwise"></i> Refresh
                                    </button>
                                    <button id="test-data-dropdown" class="btn btn-sm btn-light dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i class="bi bi-database"></i> Test Data
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="test-data-dropdown">
                                        <li><button id="generate-5-matches" class="dropdown-item">Generate 5 Random Matches</button></li>
                                        <li><button id="generate-10-matches" class="dropdown-item">Generate 10 Random Matches</button></li>
                                        <li><button id="generate-chronological" class="dropdown-item">Generate 14-Day Timeline</button></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><button id="clear-match-history" class="dropdown-item text-danger">Clear All Match History</button></li>
                                    </ul>
                                </div>
                                ` : ''}
                            </div>
                            <div class="card-body">
                                <!-- Match Stats Chart -->
                                <div class="row mb-4">
                                    <div class="col-12">
                                        <div id="match-stats-chart-container" style="height: 300px;">
                                            <canvas id="match-stats-chart"></canvas>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Recent Matches Table -->
                                <h5>Recent Matches</h5>
                                <div class="table-responsive">
                                    <table class="table table-striped" id="match-history-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Game</th>
                                                <th>Opponent</th>
                                                <th>Result</th>
                                                <th>Score</th>
                                            </tr>
                                        </thead>
                                        <tbody id="match-history">
                                            <!-- Match history will be populated here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    afterRender() {
        // Populate user data and match history
        this.populateProfileData();
        this.populateMatchHistory();
        
        if (this.isOwnProfile) {
            // Handle edit profile button click
            const editProfileBtn = document.getElementById('edit-profile-btn');
            const profileInfoSection = document.getElementById('profile-info-section');
            const profileEditSection = document.getElementById('profile-edit-section');
            
            if (editProfileBtn) {
                editProfileBtn.addEventListener('click', () => {
                    profileInfoSection.classList.add('d-none');
                    profileEditSection.classList.remove('d-none');
                });
            }
            
            // Handle cancel edit button click
            const cancelEditBtn = document.getElementById('cancel-edit-btn');
            if (cancelEditBtn) {
                cancelEditBtn.addEventListener('click', () => {
                    profileInfoSection.classList.remove('d-none');
                    profileEditSection.classList.add('d-none');
                });
            }
            
            // Handle avatar upload
            const avatarUpload = document.getElementById('avatar-upload');
            if (avatarUpload) {
                // Trigger file input when avatar preview is clicked
                const avatarPreview = document.querySelector('.avatar-preview');
                if (avatarPreview) {
                    avatarPreview.addEventListener('click', () => {
                        avatarUpload.click();
                    });
                }
                
                // Handle file selection
                avatarUpload.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    // Validate file is an image and not too large
                    if (!file.type.startsWith('image/')) {
                        this.showToast('Error', 'Please select an image file.', 'danger');
                        return;
                    }
                    
                    if (file.size > 2 * 1024 * 1024) { // 2MB max
                        this.showToast('Error', 'Image must be less than 2MB.', 'danger');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64Image = event.target.result;
                        // Update the preview image
                        const previewImg = document.querySelector('.avatar-preview img');
                        if (previewImg) {
                            previewImg.src = base64Image;
                        } else {
                            // If there's no img element, replace the placeholder
                            const placeholder = document.querySelector('.avatar-preview');
                            if (placeholder) {
                                placeholder.innerHTML = `<img src="${base64Image}" alt="Preview" class="avatar-preview-img rounded-circle">
                                                        <div class="avatar-overlay">
                                                            <i class="bi bi-camera"></i>
                                                            <small>Change</small>
                                                        </div>`;
                            }
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }
            
            // Handle profile edit form submission
            const profileEditForm = document.getElementById('profile-edit-form');
            if (profileEditForm) {
                profileEditForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const displayName = document.getElementById('displayName').value.trim();
                    const email = document.getElementById('profile-email').value.trim();
                    
                    // Get avatar - either from img src or null if not changed
                    let avatar = null;
                    const avatarImg = document.querySelector('.avatar-preview img');
                    if (avatarImg) {
                        avatar = avatarImg.src;
                    }
                    
                    // Validate
                    if (!displayName) {
                        this.showToast('Error', 'Display name cannot be empty.', 'danger');
                        return;
                    }
                    
                    if (!email) {
                        this.showToast('Error', 'Email cannot be empty.', 'danger');
                        return;
                    }
                    
                    // Update profile
                    const updates = { displayName, email };
                    
                    if (avatar) {
                        updates.avatar = avatar;
                    }
                    
                    this.updateProfile(updates);
                });
            }
            
            // Add test data generation functionality
            this.setupTestDataButtons();
        } else {
            // Setup actions for viewing other user's profile
            this.setupOtherUserButtons();
        }
    }
    
    // Format last seen date
    formatLastSeen(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60 * 1000) {
            return 'Just now';
        }
        if (diff < 60 * 60 * 1000) {
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }
        if (diff < 24 * 60 * 60 * 1000) {
            const hours = Math.floor(diff / (60 * 60 * 1000));
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            const days = Math.floor(diff / (24 * 60 * 60 * 1000));
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
        
        return date.toLocaleDateString();
    }
    
    // Check if a user is a friend
    isFriend(username) {
        const friends = authService.getFriends();
        return friends.some(friend => friend.username === username);
    }
    
    // Setup buttons for other user's profile
    setupOtherUserButtons() {
        const addFriendBtn = document.getElementById('add-friend-btn');
        const challengeBtn = document.getElementById('challenge-btn');
        
        if (addFriendBtn && !this.isFriend(this.username)) {
            addFriendBtn.addEventListener('click', async () => {
                try {
                    const result = await authService.sendFriendRequest(this.username);
                    if (result.success) {
                        addFriendBtn.disabled = true;
                        addFriendBtn.innerHTML = '<i class="bi bi-check"></i> Friend Request Sent';
                        this.showToast('Success', `Friend request sent to ${this.username}`, 'success');
                    }
                } catch (error) {
                    this.showToast('Error', error.message, 'danger');
                }
            });
        }
        
        if (challengeBtn) {
            challengeBtn.addEventListener('click', () => {
                this.showGameChallengeModal(this.username);
            });
        }
    }
    
    // Show game challenge modal
    showGameChallengeModal(username) {
        // Check if modal already exists
        let modal = document.getElementById('challenge-modal');
        
        if (!modal) {
            // Create modal if it doesn't exist
            const modalHtml = `
                <div class="modal fade" id="challenge-modal" tabindex="-1" aria-labelledby="challenge-modal-label" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="challenge-modal-label">Challenge ${username}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>Choose a game to challenge <strong>${username}</strong>:</p>
                                <div class="d-grid gap-3">
                                    <button class="btn btn-outline-primary challenge-game" data-game="pong">
                                        <i class="bi bi-controller me-2"></i>Pong
                                    </button>
                                    <button class="btn btn-outline-primary challenge-game" data-game="tictactoe">
                                        <i class="bi bi-grid-3x3-gap me-2"></i>Tic Tac Toe
                                    </button>
                                    <button class="btn btn-outline-primary challenge-game" data-game="rockpaperscissors">
                                        <i class="bi bi-hand-index-thumb me-2"></i>Rock Paper Scissors
                                    </button>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('challenge-modal');
            
            // Set up challenge game buttons
            const gameButtons = modal.querySelectorAll('.challenge-game');
            gameButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const game = button.getAttribute('data-game');
                    
                    // Close the modal
                    bootstrap.Modal.getInstance(modal).hide();
                    
                    // Navigate to the game with the challenge parameter
                    window.navigateTo(`/games/${game}?challenge=${username}`);
                });
            });
        }
        
        // Show the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
    
    // Setup test data buttons
    setupTestDataButtons() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-history-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.populateMatchHistory();
            });
        }
        
        // Generate 5 random matches
        const generate5Btn = document.getElementById('generate-5-matches');
        if (generate5Btn) {
            generate5Btn.addEventListener('click', () => {
                if (testDataGenerator.addRandomMatchesToHistory(5)) {
                    this.populateMatchHistory();
                    this.showToast('Success', '5 random matches added to your history!');
                }
            });
        }
        
        // Generate 10 random matches
        const generate10Btn = document.getElementById('generate-10-matches');
        if (generate10Btn) {
            generate10Btn.addEventListener('click', () => {
                if (testDataGenerator.addRandomMatchesToHistory(10)) {
                    this.populateMatchHistory();
                    this.showToast('Success', '10 random matches added to your history!');
                }
            });
        }
        
        // Generate chronological matches (14-day timeline)
        const generateChronBtn = document.getElementById('generate-chronological');
        if (generateChronBtn) {
            generateChronBtn.addEventListener('click', () => {
                if (testDataGenerator.addChronologicalMatches(14)) {
                    this.populateMatchHistory();
                    this.showToast('Success', '14-day match timeline added to your history!');
                }
            });
        }
        
        // Clear match history
        const clearBtn = document.getElementById('clear-match-history');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all your match history? This cannot be undone.')) {
                    if (testDataGenerator.clearMatchHistory()) {
                        this.populateMatchHistory();
                        this.showToast('Success', 'Match history cleared successfully');
                    }
                }
            });
        }
    }
    
    // Display toast notification
    showToast(title, message, type = 'success') {
        // Check if the toast container exists, if not create it
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Create a unique ID for the toast
        const toastId = 'toast-' + new Date().getTime();
        
        // Create toast HTML
        const toastHtml = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header ${type === 'danger' ? 'bg-danger text-white' : ''}">
                    <strong class="me-auto">${title}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">${message}</div>
            </div>
        `;
        
        // Add toast to container
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Initialize and show the toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        // Remove toast from DOM after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
    
    // Populate user profile data
    populateProfileData() {
        // Add any additional data loading if needed
    }
    
    // Populate match history
    populateMatchHistory() {
        const matchHistory = document.getElementById('match-history');
        
        // Get user's stats and match history from auth service
        let stats, history;
        
        if (this.isOwnProfile) {
            stats = authService.getUserStats();
            history = authService.getMatchHistory();
        } else {
            stats = this.profileData.stats;
            history = this.matchHistory;
        }
        
        // Create chart if the container exists
        const chartContainer = document.getElementById('match-stats-chart');
        if (chartContainer) {
            if (stats && stats.totalMatches > 0) {
                this.createStatsChart(chartContainer, stats);
            } else {
                // Display empty chart message
                chartContainer.innerHTML = `
                    <div class="text-center p-5 text-muted">
                        <i class="bi bi-pie-chart" style="font-size: 3rem;"></i>
                        <p class="mt-3">No game statistics available!</p>
                    </div>
                `;
            }
        }
        
        // Populate match history table
        if (matchHistory) {
            if (!history || history.length === 0) {
                matchHistory.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">
                            <div class="game-history-empty py-4">
                                <i class="bi bi-exclamation-circle"></i>
                                <p class="mt-3">No match history yet.</p>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                matchHistory.innerHTML = '';
                
                try {
                    // Sort by date descending (using playedAt property)
                    const sortedHistory = [...history].sort((a, b) => {
                        return new Date(b.playedAt || 0) - new Date(a.playedAt || 0);
                    });
                    
                    // Add rows to the table
                    sortedHistory.forEach(match => {
                        if (!match) return; // Skip if match is undefined
                        
                        const date = match.playedAt ? new Date(match.playedAt).toLocaleDateString() : 'Unknown date';
                        const resultClass = match.result === 'win' ? 'text-success' : 
                                          match.result === 'loss' ? 'text-danger' : 'text-secondary';
                        
                        let scoreDisplay = '—';
                        if (match.score) {
                            scoreDisplay = `${match.score.player1} - ${match.score.player2}`;
                        }
                        
                        // Make opponent clickable if it's a username
                        let opponentDisplay = match.opponent || 'Unknown opponent';
                        if (match.opponent && match.opponent !== 'Computer' && match.opponent !== 'AI') {
                            opponentDisplay = `<a href="/profile/${match.opponent}" data-link>${match.opponent}</a>`;
                        }
                        
                        matchHistory.innerHTML += `
                            <tr>
                                <td>${date}</td>
                                <td>${match.game || 'Unknown game'}</td>
                                <td>${opponentDisplay}</td>
                                <td class="${resultClass}">${match.result ? match.result.charAt(0).toUpperCase() + match.result.slice(1) : 'Unknown'}</td>
                                <td>${scoreDisplay}</td>
                            </tr>
                        `;
                    });
                } catch (error) {
                    console.error('Error displaying match history:', error);
                    matchHistory.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center text-danger">
                                <i class="bi bi-exclamation-triangle"></i>
                                <p>An error occurred while loading match history.</p>
                            </td>
                        </tr>
                    `;
                }
            }
        }
    }
    
    // Create stats chart
    createStatsChart(chartCanvas, stats) {
        // We're using Chart.js, make sure it's included in your project
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded. Please include Chart.js library.');
            return;
        }
        
        try {
            // Destroy existing chart if it exists
            if (this.statsChart) {
                this.statsChart.destroy();
            }
            
            // Make sure stats exist and have the expected properties
            if (!stats || typeof stats !== 'object') {
                console.error('Invalid stats data for chart');
                return;
            }
            
            const wins = stats.wins || 0;
            const losses = stats.losses || 0;
            const draws = stats.draws || 0;
            
            // Don't create chart if all values are 0
            if (wins === 0 && losses === 0 && draws === 0) {
                return;
            }
            
            // Prepare data for the pie chart
            const data = {
                labels: ['Wins', 'Losses', 'Draws'],
                datasets: [{
                    data: [wins, losses, draws],
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.8)',  // green for wins
                        'rgba(220, 53, 69, 0.8)',  // red for losses
                        'rgba(108, 117, 125, 0.8)' // gray for draws
                    ],
                    borderColor: [
                        'rgba(40, 167, 69, 1)',
                        'rgba(220, 53, 69, 1)',
                        'rgba(108, 117, 125, 1)'
                    ],
                    borderWidth: 1
                }]
            };
            
            // Chart options
            const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            };
            
            // Create the chart
            this.statsChart = new Chart(chartCanvas, {
                type: 'pie',
                data: data,
                options: options
            });
        } catch (error) {
            console.error('Error creating chart:', error);
            
            // Display error message in the chart container
            if (chartCanvas.parentElement) {
                chartCanvas.parentElement.innerHTML = `
                    <div class="text-center p-5 text-danger">
                        <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                        <p class="mt-3">An error occurred while creating the chart.</p>
                    </div>
                `;
            }
        }
    }
    
    // Update profile method
    updateProfile(updates) {
        try {
            const result = authService.updateProfile(updates);
            if (result.success) {
                this.showToast('Success', 'Profile updated successfully');
                // Use the router's navigation instead of page reload
                window.navigateTo('/profile');
            }
        } catch (error) {
            this.showToast('Error', 'Error updating profile: ' + error.message, 'danger');
        }
    }
}