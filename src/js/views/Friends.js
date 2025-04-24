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
    }

    async getHtml() {
        return `
            <div class="view-container fade-in">
                <h1 class="section-title">Friends</h1>
                
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
                                <div class="d-flex mb-3">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                                        <input type="text" class="form-control" id="friend-search" placeholder="Search for users to add">
                                        <button class="btn btn-primary" id="add-friend-btn">Add</button>
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
        
        return this.friendsList.map(friend => `
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
                            <i class="bi ${friend.online ? 'bi-circle-fill' : 'bi-clock-history'}"></i>
                            ${friend.online ? 'Online now' : 'Last seen ' + this.formatLastSeen(friend.lastSeen)}
                        </small>
                    </div>
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
        `).join('');
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
        
        // Handle challenge to game
        this.setupChallengeButtons();
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
}