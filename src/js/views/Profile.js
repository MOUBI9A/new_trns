import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';

export default class Profile extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Profile');
        this.currentUser = authService.getCurrentUser();
        this.isEditing = false;
    }

    async getHtml() {
        // Get user data
        const user = this.currentUser;
        const displayName = user.displayName || user.username;
        const username = user.username;
        const email = user.email || 'Not provided';
        const joinDate = new Date(user.joinDate || Date.now()).toLocaleDateString();
        
        // Avatar HTML
        let avatarHtml = '';
        if (user.avatar) {
            avatarHtml = `<img src="${user.avatar}" alt="Profile" class="profile-avatar rounded-circle">`;
        } else {
            avatarHtml = `<div class="profile-avatar-placeholder d-flex align-items-center justify-content-center bg-light rounded-circle">
                <i class="bi bi-person-circle" style="font-size: 4rem;"></i>
            </div>`;
        }
        
        return `
            <div class="view-container fade-in">
                <h1 class="section-title">Your Profile</h1>
                
                <div class="row">
                    <!-- User Info Section -->
                    <div class="col-lg-12 mb-4">
                        <div class="card">
                            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">User Information</h5>
                                <button id="edit-profile-btn" class="btn btn-sm btn-light">
                                    <i class="bi bi-pencil-square"></i> Edit
                                </button>
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
                                                <span class="badge bg-success">Online</span>
                                            </div>
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
                                            <div class="row mb-3">
                                                <div class="col-sm-3 fw-bold">Email:</div>
                                                <div class="col-sm-9">${email}</div>
                                            </div>
                                            <div class="row mb-3">
                                                <div class="col-sm-3 fw-bold">Joined:</div>
                                                <div class="col-sm-9">${joinDate}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Edit Profile Section (Hidden by default) -->
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
                                                </div>
                                                <div class="mb-3">
                                                    <label for="profile-username" class="form-label">Username</label>
                                                    <input type="text" class="form-control" id="profile-username" value="${username}" disabled>
                                                </div>
                                                <div class="mb-3">
                                                    <label for="profile-email" class="form-label">Email</label>
                                                    <input type="email" class="form-control" id="profile-email" value="${email}" disabled>
                                                </div>
                                                <div class="edit-controls">
                                                    <button type="button" id="cancel-edit-btn" class="btn btn-outline-secondary">Cancel</button>
                                                    <button type="submit" class="btn btn-primary">Save Changes</button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Match History Section -->
                    <div class="col-lg-12">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">Match History</h5>
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
                    alert('Please select an image file.');
                    return;
                }
                
                if (file.size > 2 * 1024 * 1024) { // 2MB max
                    alert('Image must be less than 2MB.');
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
                            placeholder.innerHTML = `<img src="${base64Image}" alt="Preview" id="avatar-preview-img" class="profile-avatar rounded-circle">
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
                
                // Get avatar - either from img src or null if not changed
                let avatar = null;
                const avatarImg = document.querySelector('.avatar-preview img');
                if (avatarImg) {
                    avatar = avatarImg.src;
                }
                
                // Validate
                if (!displayName) {
                    alert('Display name cannot be empty.');
                    return;
                }
                
                // Update profile
                const updates = {
                    displayName: displayName
                };
                
                if (avatar) {
                    updates.avatar = avatar;
                }
                
                this.updateProfile(updates);
                
                // Return to profile view
                profileInfoSection.classList.remove('d-none');
                profileEditSection.classList.add('d-none');
            });
        }
    }
    
    // Populate user profile data
    populateProfileData() {
        // Add any additional data loading if needed
    }
    
    // Populate match history
    populateMatchHistory() {
        const matchHistory = document.getElementById('match-history');
        
        // Get user's stats and match history from auth service
        const stats = authService.getUserStats();
        const history = authService.getMatchHistory();
        
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
                        <p class="mt-3">Play games to see your statistics!</p>
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
                            <div class="game-history-empty">
                                <i class="bi bi-exclamation-circle"></i>
                                <p>No match history yet. Play some games to see your stats!</p>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                matchHistory.innerHTML = '';
                
                try {
                    // Sort by date descending (using playedAt property, not date)
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
                        
                        matchHistory.innerHTML += `
                            <tr>
                                <td>${date}</td>
                                <td>${match.game || 'Unknown game'}</td>
                                <td>${match.opponent || 'Unknown opponent'}</td>
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
                // Use the router's navigation instead of page reload
                window.navigateTo('/profile');
            }
        } catch (error) {
            alert('Error updating profile: ' + error.message);
        }
    }
} 