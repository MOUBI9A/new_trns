import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';

export default class Friends extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Friends');
        
        // Redirect if not authenticated
        if (!authService.isAuthenticated()) {
            window.navigateTo('/login');
            return;
        }
        
        this.currentUser = authService.getCurrentUser();
        this.friendsList = [];
        this.friendRequests = [];
        this.loadFriendsData();
    }
    
    loadFriendsData() {
        this.friendsList = authService.getFriends();
        this.friendRequests = authService.getFriendRequests();
        
        // Fetch profile data for each friend to get their stats
        this.friendsList = this.friendsList.map(friend => {
            try {
                const profileData = authService.getUserProfile(friend.username);
                return { ...friend, stats: profileData.stats || null };
            } catch (error) {
                console.error(`Error loading stats for ${friend.username}:`, error);
                return friend;
            }
        });
    }

    async getHtml() {
        // Add debug information when in development
        const debugMode = true;
        const debugInfo = debugMode ? this.getDebugSection() : '';
        
        return `
            <div class="view-container fade-in">
                <h1 class="section-title">Friends</h1>
                
                ${debugInfo}
                
                <div class="row">
                    <!-- Friend Requests Section -->
                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">
                                    <i class="bi bi-person-plus-fill me-2"></i>
                                    Friend Requests
                                    ${this.friendRequests.length > 0 ? 
                                      `<span class="badge bg-danger ms-2">${this.friendRequests.length}</span>` : ''}
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <div class="nav nav-tabs" id="search-tabs" role="tablist">
                                        <button class="nav-link active" id="username-tab" data-bs-toggle="tab" data-bs-target="#username-search" 
                                            type="button" role="tab" aria-controls="username-search" aria-selected="true">
                                            <i class="bi bi-person"></i> Username
                                        </button>
                                        <button class="nav-link" id="email-tab" data-bs-toggle="tab" data-bs-target="#email-search" 
                                            type="button" role="tab" aria-controls="email-search" aria-selected="false">
                                            <i class="bi bi-envelope"></i> Email
                                        </button>
                                    </div>
                                    
                                    <div class="tab-content py-2" id="search-tabs-content">
                                        <!-- Username search tab -->
                                        <div class="tab-pane fade show active" id="username-search" role="tabpanel" aria-labelledby="username-tab">
                                            <div class="input-group">
                                                <span class="input-group-text"><i class="bi bi-search"></i></span>
                                                <input type="text" class="form-control" id="friend-search" placeholder="Search by username">
                                                <button class="btn btn-primary" id="add-friend-btn">Add</button>
                                            </div>
                                        </div>
                                        
                                        <!-- Email search tab -->
                                        <div class="tab-pane fade" id="email-search" role="tabpanel" aria-labelledby="email-tab">
                                            <div class="input-group">
                                                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                                                <input type="email" class="form-control" id="email-search" placeholder="Search by email address">
                                                <button class="btn btn-primary" id="add-friend-by-email-btn">Add</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="friend-requests-container">
                                    ${this.renderFriendRequests()}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Friends List Section -->
                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">
                                    <i class="bi bi-people-fill me-2"></i>
                                    Friends List
                                    <span class="badge bg-light text-dark ms-2">${this.friendsList.length}</span>
                                </h5>
                            </div>
                            <div class="card-body">
                                <ul class="list-group friends-list">
                                    ${this.renderFriendsList()}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getDebugSection() {
        return `
        <div class="card mb-4 bg-light">
            <div class="card-header bg-warning">
                <h5 class="mb-0">Troubleshooting / Debug Panel</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col">
                        <button id="debug-list-users" class="btn btn-sm btn-info mb-2">List Available Users</button>
                        <div id="debug-users-list" class="small bg-dark text-light p-2" style="max-height: 150px; overflow-y: auto; display: none;"></div>
                    </div>
                    <div class="col">
                        <div class="mb-2">
                            <label class="form-label">Test Friend Request:</label>
                            <div class="input-group input-group-sm">
                                <input type="text" id="debug-username" class="form-control" placeholder="Username">
                                <button id="debug-send-request" class="btn btn-warning">Test Request</button>
                            </div>
                        </div>
                        <div class="mb-2">
                            <div class="input-group input-group-sm">
                                <input type="email" id="debug-email" class="form-control" placeholder="Email">
                                <button id="debug-send-email-request" class="btn btn-warning">Test Email Request</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="debug-result" class="mt-2 small"></div>
            </div>
        </div>`;
    }
    
    renderFriendRequests() {
        if (this.friendRequests.length === 0) {
            return `
                <div class="text-center p-4">
                    <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                    <p class="mt-3">No pending friend requests</p>
                </div>
            `;
        }
        
        return `
            <div class="list-group">
                ${this.friendRequests.map(request => `
                    <div class="list-group-item list-group-item-action d-flex align-items-center" data-username="${request.username}">
                        <div class="friend-avatar me-3">
                            ${request.avatar ? 
                              `<img src="${request.avatar}" alt="${request.displayName}" class="rounded-circle" width="40" height="40">` : 
                              `<div class="avatar-placeholder rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style="width:40px;height:40px;">
                                <i class="bi bi-person"></i>
                              </div>`
                            }
                        </div>
                        <div class="friend-info flex-grow-1">
                            <h6 class="mb-0">${request.displayName}</h6>
                            <small class="text-muted">@${request.username}</small>
                            <div class="request-time text-muted">
                                <small>${this.formatDate(request.date)}</small>
                            </div>
                        </div>
                        <div class="friend-actions">
                            <button class="btn btn-sm btn-success accept-request" data-username="${request.username}">
                                <i class="bi bi-check-lg"></i>
                            </button>
                            <button class="btn btn-sm btn-danger decline-request" data-username="${request.username}">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderFriendsList() {
        if (this.friendsList.length === 0) {
            return `
                <li class="list-group-item text-center p-4">
                    <i class="bi bi-people" style="font-size: 2rem;"></i>
                    <p class="mt-3">Your friends list is empty</p>
                </li>
            `;
        }
        
        return this.friendsList.map(friend => {
            // Generate stats display if stats are available
            let statsHtml = '';
            if (friend.stats && friend.stats.totalMatches > 0) {
                const winRate = friend.stats.totalMatches > 0 
                    ? Math.round((friend.stats.wins / friend.stats.totalMatches) * 100) 
                    : 0;
                
                statsHtml = `
                    <div class="friend-stats mt-1">
                        <small class="text-muted">
                            <span class="text-success">${friend.stats.wins || 0}W</span> / 
                            <span class="text-danger">${friend.stats.losses || 0}L</span>
                            ${friend.stats.draws > 0 ? `/ <span class="text-secondary">${friend.stats.draws}D</span>` : ''}
                            <span class="ms-1">(${winRate}% win rate)</span>
                        </small>
                    </div>
                `;
            }
            
            return `
                <li class="list-group-item d-flex align-items-center">
                    <div class="friend-avatar me-3 position-relative">
                        ${friend.avatar ? 
                          `<img src="${friend.avatar}" alt="${friend.displayName}" class="rounded-circle" width="48" height="48">` : 
                          `<div class="avatar-placeholder rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style="width:48px;height:48px;">
                            <i class="bi bi-person"></i>
                          </div>`
                        }
                        <span class="position-absolute bottom-0 end-0 translate-middle p-1 rounded-circle ${friend.online ? 'bg-success' : 'bg-secondary'}">
                            <span class="visually-hidden">${friend.online ? 'Online' : 'Offline'}</span>
                        </span>
                    </div>
                    <div class="friend-info flex-grow-1">
                        <h6 class="mb-0">${friend.displayName}</h6>
                        <small class="text-muted">@${friend.username}</small>
                        <div class="online-status">
                            <small class="${friend.online ? 'text-success' : 'text-secondary'}">
                                <i class="bi bi-${friend.online ? 'circle-fill' : 'clock-history'}"></i>
                                ${friend.online ? 'Online now' : 'Last seen ' + this.formatLastSeen(friend.lastSeen)}
                            </small>
                        </div>
                        ${statsHtml}
                    </div>
                    <div class="friend-actions">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                <i class="bi bi-three-dots"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item view-profile" href="/profile/${friend.username}">
                                    <i class="bi bi-person-badge"></i> View Profile
                                </a></li>
                                <li><a class="dropdown-item challenge-friend" href="#" data-username="${friend.username}">
                                    <i class="bi bi-controller"></i> Challenge to Game
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger remove-friend" href="#" data-username="${friend.username}">
                                    <i class="bi bi-person-x"></i> Remove Friend
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </li>
            `;
        }).join('');
    }
    
    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        // If less than a day, show relative time
        if (diff < 24 * 60 * 60 * 1000) {
            if (diff < 60 * 1000) {
                return 'Just now';
            }
            if (diff < 60 * 60 * 1000) {
                const minutes = Math.floor(diff / (60 * 1000));
                return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            }
            const hours = Math.floor(diff / (60 * 60 * 1000));
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
        
        // Otherwise, show the date
        return date.toLocaleDateString();
    }
    
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

    afterRender() {
        // Handle friend request acceptance
        this.setupAcceptRequestButtons();
        
        // Handle friend request rejection
        this.setupDeclineRequestButtons();
        
        // Handle friend removal
        this.setupRemoveFriendButtons();
        
        // Handle friend search and add
        this.setupFriendSearch();
        
        // Handle email search and add
        this.setupEmailSearch();
        
        // Handle challenge to game
        this.setupChallengeButtons();
        
        // Setup debug panel handlers if in debug mode
        this.setupDebugPanelHandlers();
    }
    
    setupAcceptRequestButtons() {
        const acceptButtons = document.querySelectorAll('.accept-request');
        acceptButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const username = button.getAttribute('data-username');
                
                try {
                    const result = await authService.acceptFriendRequest(username);
                    if (result.success) {
                        // Refresh friends data
                        this.loadFriendsData();
                        // Re-render the page
                        document.querySelector('.view-container').innerHTML = await this.getHtml();
                        this.afterRender();
                        // Show success toast
                        this.showToast('Friend Request Accepted', `You are now friends with ${username}`);
                    }
                } catch (error) {
                    this.showToast('Error', error.message, 'danger');
                }
            });
        });
    }
    
    setupDeclineRequestButtons() {
        const declineButtons = document.querySelectorAll('.decline-request');
        declineButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const username = button.getAttribute('data-username');
                
                try {
                    const result = await authService.declineFriendRequest(username);
                    if (result.success) {
                        // Refresh friends data
                        this.loadFriendsData();
                        // Re-render the page
                        document.querySelector('.view-container').innerHTML = await this.getHtml();
                        this.afterRender();
                        // Show success toast
                        this.showToast('Friend Request Declined', `Friend request from ${username} was declined`);
                    }
                } catch (error) {
                    this.showToast('Error', error.message, 'danger');
                }
            });
        });
    }
    
    setupRemoveFriendButtons() {
        const removeButtons = document.querySelectorAll('.remove-friend');
        removeButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const username = button.getAttribute('data-username');
                
                if (confirm(`Are you sure you want to remove ${username} from your friends list?`)) {
                    try {
                        const result = await authService.removeFriend(username);
                        if (result.success) {
                            // Refresh friends data
                            this.loadFriendsData();
                            // Re-render the page
                            document.querySelector('.view-container').innerHTML = await this.getHtml();
                            this.afterRender();
                            // Show success toast
                            this.showToast('Friend Removed', `${username} was removed from your friends list`);
                        }
                    } catch (error) {
                        this.showToast('Error', error.message, 'danger');
                    }
                }
            });
        });
    }
    
    setupFriendSearch() {
        const searchInput = document.getElementById('friend-search');
        const addButton = document.getElementById('add-friend-btn');
        
        if (addButton && searchInput) {
            addButton.addEventListener('click', async () => {
                const username = searchInput.value.trim();
                
                if (!username) {
                    this.showToast('Error', 'Please enter a username', 'warning');
                    return;
                }
                
                try {
                    const result = await authService.sendFriendRequest(username);
                    if (result.success) {
                        searchInput.value = '';
                        this.showToast('Friend Request Sent', `Friend request sent to ${username}`);
                    }
                } catch (error) {
                    this.showToast('Error', error.message, 'danger');
                }
            });
            
            // Also handle Enter key press
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    addButton.click();
                }
            });
        }
    }
    
    setupEmailSearch() {
        const emailInput = document.getElementById('email-search');
        const addButton = document.getElementById('add-friend-by-email-btn');
        
        if (addButton && emailInput) {
            addButton.addEventListener('click', async () => {
                const email = emailInput.value.trim();
                
                if (!email) {
                    this.showToast('Error', 'Please enter an email address', 'warning');
                    return;
                }
                
                if (!this.validateEmail(email)) {
                    this.showToast('Error', 'Please enter a valid email address', 'warning');
                    return;
                }
                
                try {
                    const result = await authService.sendFriendRequestByEmail(email);
                    if (result.success) {
                        emailInput.value = '';
                        this.showToast('Friend Request Sent', `Friend request sent successfully`);
                    }
                } catch (error) {
                    this.showToast('Error', error.message, 'danger');
                }
            });
            
            // Also handle Enter key press
            emailInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    addButton.click();
                }
            });
        }
    }
    
    validateEmail(email) {
        const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        return re.test(email);
    }
    
    setupChallengeButtons() {
        const challengeButtons = document.querySelectorAll('.challenge-friend');
        challengeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const username = button.getAttribute('data-username');
                
                // Show modal with game options
                this.showGameChallengeModal(username);
            });
        });
    }
    
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
                                <h5 class="modal-title" id="challenge-modal-label">Challenge Friend</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>Choose a game to challenge <strong id="challenge-username"></strong>:</p>
                                <div class="d-grid gap-3">
                                    <button class="btn btn-outline-primary challenge-game" data-game="pong">
                                        <i class="bi bi-controller me-2"></i>Pong
                                    </button>
                                    <button class="btn btn-outline-primary challenge-game" data-game="ticTacToe">
                                        <i class="bi bi-grid-3x3-gap me-2"></i>Tic Tac Toe
                                    </button>
                                    <button class="btn btn-outline-primary challenge-game" data-game="rockPaperScissors">
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
                    const challengedUser = document.getElementById('challenge-username').textContent;
                    
                    // Close the modal
                    bootstrap.Modal.getInstance(modal).hide();
                    
                    // Navigate to the game with the challenge parameter
                    window.navigateTo(`/game/${game}?challenge=${challengedUser}`);
                });
            });
        }
        
        // Update the challenged username
        document.getElementById('challenge-username').textContent = username;
        
        // Show the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
    
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
    
    setupDebugPanelHandlers() {
        const listUsersBtn = document.getElementById('debug-list-users');
        const usersListDiv = document.getElementById('debug-users-list');
        const debugUsernameInput = document.getElementById('debug-username');
        const debugEmailInput = document.getElementById('debug-email');
        const sendRequestBtn = document.getElementById('debug-send-request');
        const sendEmailRequestBtn = document.getElementById('debug-send-email-request');
        const debugResultDiv = document.getElementById('debug-result');
        
        if (listUsersBtn && usersListDiv) {
            listUsersBtn.addEventListener('click', () => {
                try {
                    // Fallback if listAllUsers doesn't exist
                    if (typeof authService.listAllUsers !== 'function') {
                        // Direct implementation as fallback
                        const users = Object.keys(authService.users);
                        console.log('Available users (fallback):', users);
                        console.log('Full users data (fallback):', authService.users);
                        
                        // Format and display users
                        usersListDiv.style.display = 'block';
                        
                        if (users.length === 0) {
                            usersListDiv.innerHTML = '<span class="text-warning">No users found in localStorage!</span>';
                        } else {
                            let usersHtml = '<ul class="list-unstyled mb-0">';
                            users.forEach(username => {
                                usersHtml += `<li>${username}</li>`;
                            });
                            usersHtml += '</ul>';
                            usersListDiv.innerHTML = usersHtml;
                        }
                        
                        debugResultDiv.innerHTML = '<div class="alert alert-info">Users list refreshed (using fallback method). Check browser console for detailed user data.</div>';
                        return;
                    }
                    
                    // Call the debug function to list all users
                    const users = authService.listAllUsers();
                    
                    // Format and display users
                    usersListDiv.style.display = 'block';
                    
                    if (users.length === 0) {
                        usersListDiv.innerHTML = '<span class="text-warning">No users found in localStorage!</span>';
                    } else {
                        let usersHtml = '<ul class="list-unstyled mb-0">';
                        users.forEach(username => {
                            usersHtml += `<li>${username}</li>`;
                        });
                        usersHtml += '</ul>';
                        usersListDiv.innerHTML = usersHtml;
                    }
                    
                    debugResultDiv.innerHTML = '<div class="alert alert-info">Users list refreshed. Check browser console for detailed user data.</div>';
                } catch (error) {
                    debugResultDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
                }
            });
        }
        
        if (sendRequestBtn && debugUsernameInput) {
            sendRequestBtn.addEventListener('click', async () => {
                const username = debugUsernameInput.value.trim();
                
                if (!username) {
                    debugResultDiv.innerHTML = '<div class="alert alert-warning">Please enter a username for testing</div>';
                    return;
                }
                
                try {
                    debugResultDiv.innerHTML = '<div class="alert alert-info">Sending request...</div>';
                    
                    const result = await authService.sendFriendRequest(username);
                    if (result.success) {
                        debugResultDiv.innerHTML = `<div class="alert alert-success">Friend request sent to ${username} successfully!</div>`;
                        debugUsernameInput.value = '';
                    }
                } catch (error) {
                    debugResultDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
                    console.error('Friend request error:', error);
                }
            });
        }
        
        if (sendEmailRequestBtn && debugEmailInput) {
            sendEmailRequestBtn.addEventListener('click', async () => {
                const email = debugEmailInput.value.trim();
                
                if (!email) {
                    debugResultDiv.innerHTML = '<div class="alert alert-warning">Please enter an email for testing</div>';
                    return;
                }
                
                if (!this.validateEmail(email)) {
                    debugResultDiv.innerHTML = '<div class="alert alert-warning">Please enter a valid email format</div>';
                    return;
                }
                
                try {
                    debugResultDiv.innerHTML = '<div class="alert alert-info">Searching for user with this email...</div>';
                    
                    // First check if we can find the user by email
                    const user = authService.findUserByEmail(email);
                    
                    if (!user) {
                        debugResultDiv.innerHTML = `<div class="alert alert-danger">Debug: No user found with email "${email}"</div>`;
                        return;
                    }
                    
                    // If found, show the username and try to send request
                    debugResultDiv.innerHTML = `<div class="alert alert-info">Found user: ${user.username}. Trying to send request...</div>`;
                    
                    const result = await authService.sendFriendRequestByEmail(email);
                    if (result.success) {
                        debugResultDiv.innerHTML = `<div class="alert alert-success">Friend request sent to ${user.username} (${email}) successfully!</div>`;
                        debugEmailInput.value = '';
                    }
                } catch (error) {
                    debugResultDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
                    console.error('Friend request by email error:', error);
                }
            });
        }
    }
}