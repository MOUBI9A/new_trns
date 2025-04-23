import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';

export default class Home extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Home');
        this.isAuthenticated = authService.isAuthenticated();
        this.currentUser = authService.getCurrentUser();
    }

    async getHtml() {
        // Get login/logout button HTML based on authentication status
        const authButtonsHtml = this.isAuthenticated 
            ? `<div class="d-grid gap-3 d-sm-flex justify-content-sm-center mb-5">
                <a href="/games" class="btn btn-primary btn-lg px-4 gap-3" data-link>
                    <i class="bi bi-controller me-2"></i>Browse Games
                </a>
                <a href="/profile" class="btn btn-outline-light btn-lg px-4" data-link>
                    <i class="bi bi-person-circle me-2"></i>My Profile
                </a>
                <button id="home-logout-btn" class="btn btn-outline-danger btn-lg px-4">
                    <i class="bi bi-box-arrow-right me-2"></i>Logout
                </button>
              </div>`
            : `<div class="d-grid gap-3 d-sm-flex justify-content-sm-center mb-5">
                <a href="/games" class="btn btn-primary btn-lg px-4 gap-3" data-link>
                    <i class="bi bi-controller me-2"></i>Browse Games
                </a>
                <a href="/login" class="btn btn-outline-light btn-lg px-4" data-link>
                    <i class="bi bi-person me-2"></i>Login / Register
                </a>
              </div>`;
        
        // Get personalized greeting if authenticated
        const greetingText = this.isAuthenticated
            ? `Welcome back, ${this.currentUser.displayName || this.currentUser.username}!`
            : 'Welcome to Game Hub';

        // Get player stats dashboard if authenticated
        const dashboardHtml = this.isAuthenticated
            ? this.getDashboardHtml()
            : '';

        return `
            <div class="view-container fade-in">
                <div class="home-hero position-relative">
                    <div class="position-absolute top-0 start-0 w-100 h-100" style="
                        background: url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80') center/cover no-repeat;
                        filter: brightness(0.5);
                        z-index: -1;
                    "></div>
                    
                    <div class="container py-5 text-white text-center">
                        <div class="row justify-content-center">
                            <div class="col-lg-8">
                                <h1 class="display-3 fw-bold mb-4">${greetingText}</h1>
                                <p class="lead mb-5">Your destination for classic browser games. Challenge yourself or play with friends in our growing collection of games.</p>
                                
                                ${authButtonsHtml}
                            </div>
                        </div>
                    </div>
                </div>
                
                ${dashboardHtml}
                
                <div class="container py-5">
                    <div class="row g-4 py-3">
                        <div class="col-md-4">
                            <div class="text-center p-4">
                                <div class="feature-icon bg-primary bg-gradient text-white rounded-circle mb-3">
                                    <i class="bi bi-joystick fs-2"></i>
                                </div>
                                <h3>Classic Games</h3>
                                <p>Enjoy timeless classics like Pong, Tic Tac Toe and Rock Paper Scissors.</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center p-4">
                                <div class="feature-icon bg-primary bg-gradient text-white rounded-circle mb-3">
                                    <i class="bi bi-people fs-2"></i>
                                </div>
                                <h3>Multiplayer</h3>
                                <p>Play with friends or challenge the computer for some serious competition.</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center p-4">
                                <div class="feature-icon bg-primary bg-gradient text-white rounded-circle mb-3">
                                    <i class="bi bi-trophy fs-2"></i>
                                </div>
                                <h3>Tournaments</h3>
                                <p>Set up tournaments with your friends and crown the ultimate champion.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center mt-3">
                        <h3 class="mb-4">Quick Start</h3>
                        <div class="row g-4 justify-content-center">
                            <div class="col-6 col-md-3">
                                <a href="/games/pong" class="text-decoration-none" data-link>
                                    <div class="card h-100 hover-scale">
                                        <div class="card-body py-4">
                                            <i class="bi bi-circle-fill text-dark" style="font-size: 2rem;"></i>
                                            <h5 class="card-title mt-3">Pong</h5>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div class="col-6 col-md-3">
                                <a href="/games/tictactoe" class="text-decoration-none" data-link>
                                    <div class="card h-100 hover-scale">
                                        <div class="card-body py-4">
                                            <i class="bi bi-grid-3x3 text-primary" style="font-size: 2rem;"></i>
                                            <h5 class="card-title mt-3">Tic Tac Toe</h5>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div class="col-6 col-md-3">
                                <a href="/games/rockpaperscissors" class="text-decoration-none" data-link>
                                    <div class="card h-100 hover-scale">
                                        <div class="card-body py-4">
                                            <i class="bi bi-scissors text-danger" style="font-size: 2rem;"></i>
                                            <h5 class="card-title mt-3">Rock Paper Scissors</h5>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            <div class="col-6 col-md-3">
                                <a href="/games/pong/tournament" class="text-decoration-none" data-link>
                                    <div class="card h-100 hover-scale">
                                        <div class="card-body py-4">
                                            <i class="bi bi-trophy text-warning" style="font-size: 2rem;"></i>
                                            <h5 class="card-title mt-3">Tournament</h5>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <style>
                    .home-hero {
                        min-height: 60vh;
                        display: flex;
                        align-items: center;
                    }
                    .feature-icon {
                        width: 70px;
                        height: 70px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .hover-scale {
                        transition: transform 0.3s ease;
                    }
                    .hover-scale:hover {
                        transform: scale(1.05);
                    }
                    .stat-card {
                        border-left: 4px solid;
                        transition: transform 0.2s;
                    }
                    .stat-card:hover {
                        transform: translateY(-5px);
                    }
                    .win-card {
                        border-left-color: var(--bs-success);
                    }
                    .loss-card {
                        border-left-color: var(--bs-danger);
                    }
                    .total-card {
                        border-left-color: var(--bs-primary);
                    }
                    .recent-match {
                        border-left: 4px solid transparent;
                        transition: all 0.2s;
                    }
                    .recent-match:hover {
                        background-color: rgba(0,0,0,0.05);
                    }
                    .match-win {
                        border-left-color: var(--bs-success);
                    }
                    .match-loss {
                        border-left-color: var(--bs-danger);
                    }
                    .match-draw {
                        border-left-color: var(--bs-warning);
                    }
                </style>
            </div>
        `;
    }
    
    getDashboardHtml() {
        // Get user statistics
        const stats = authService.getUserStats();
        const matchHistory = authService.getMatchHistory();
        
        // If no stats or no matches played, return empty string
        if (!stats || stats.totalMatches === 0) {
            return `
                <div class="container mt-4">
                    <div class="card bg-light">
                        <div class="card-body text-center py-5">
                            <i class="bi bi-controller mb-3" style="font-size: 3rem;"></i>
                            <h3>Welcome to your Game Hub!</h3>
                            <p class="lead">You haven't played any games yet. Start playing to see your statistics here!</p>
                            <a href="/games" class="btn btn-primary" data-link>Play Now</a>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Calculate win percentage
        const winPercentage = stats.totalMatches > 0 
            ? Math.round((stats.wins / stats.totalMatches) * 100) 
            : 0;
        
        // Get recent matches (top 3)
        const recentMatches = matchHistory.slice(0, 3).map(match => {
            const date = match.playedAt ? new Date(match.playedAt).toLocaleDateString() : 'Unknown';
            const resultClass = match.result === 'win' ? 'match-win' : 
                              match.result === 'loss' ? 'match-loss' : 'match-draw';
            const resultText = match.result === 'win' ? 'Victory' : 
                             match.result === 'loss' ? 'Defeat' : 'Draw';
            const resultIcon = match.result === 'win' ? 'trophy' : 
                             match.result === 'loss' ? 'x-circle' : 'slash-circle';
            const resultColor = match.result === 'win' ? 'text-success' : 
                              match.result === 'loss' ? 'text-danger' : 'text-warning';
            
            let scoreDisplay = '';
            if (match.score) {
                scoreDisplay = `${match.score.player1} - ${match.score.player2}`;
            }
            
            return `
                <div class="recent-match ${resultClass} p-3 mb-2 rounded">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">${match.game || 'Unknown game'}</h6>
                            <small class="text-muted">vs. ${match.opponent || 'Unknown'} · ${date}</small>
                        </div>
                        <div class="text-end">
                            <div class="${resultColor} mb-1">
                                <i class="bi bi-${resultIcon} me-1"></i> ${resultText}
                            </div>
                            ${scoreDisplay ? `<small class="text-muted">${scoreDisplay}</small>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Get game breakdown
        const gameBreakdown = Object.entries(stats.byGame || {}).map(([game, gameStats]) => {
            const gameWinRate = gameStats.totalMatches > 0 
                ? Math.round((gameStats.wins / gameStats.totalMatches) * 100) 
                : 0;
            
            let gameIcon = '';
            if (game === 'Pong') gameIcon = 'circle-fill';
            else if (game === 'Tic Tac Toe') gameIcon = 'grid-3x3';
            else if (game === 'Rock Paper Scissors') gameIcon = 'scissors';
            else gameIcon = 'controller';
            
            return `
                <div class="col-md-4 mb-3">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-2">
                                <i class="bi bi-${gameIcon} me-2" style="font-size: 1.25rem;"></i>
                                <h6 class="mb-0">${game}</h6>
                            </div>
                            <div class="d-flex justify-content-between">
                                <div>Played: ${gameStats.totalMatches}</div>
                                <div class="text-success">Won: ${gameStats.wins}</div>
                            </div>
                            <div class="progress mt-2" style="height: 8px;">
                                <div class="progress-bar bg-success" role="progressbar" 
                                     style="width: ${gameWinRate}%;" 
                                     aria-valuenow="${gameWinRate}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div class="text-end mt-1">
                                <small>${gameWinRate}% win rate</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Return dashboard HTML with stats cards and recent matches
        return `
            <div class="container mt-4">
                <div class="row">
                    <div class="col-12">
                        <div class="card shadow-sm mb-4">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0"><i class="bi bi-speedometer2 me-2"></i>Your Gaming Dashboard</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-8">
                                        <!-- Stats Summary -->
                                        <h5 class="border-bottom pb-2 mb-3">Stats Summary</h5>
                                        <div class="row g-3">
                                            <div class="col-md-4">
                                                <div class="card stat-card total-card h-100">
                                                    <div class="card-body">
                                                        <h6 class="card-title text-muted">Total Matches</h6>
                                                        <h2 class="display-5 fw-bold">${stats.totalMatches}</h2>
                                                        <div class="text-muted">
                                                            <small>Across all games</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="card stat-card win-card h-100">
                                                    <div class="card-body">
                                                        <h6 class="card-title text-muted">Victories</h6>
                                                        <h2 class="display-5 fw-bold">${stats.wins}</h2>
                                                        <div class="text-success">
                                                            <small>${winPercentage}% win rate</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="card stat-card loss-card h-100">
                                                    <div class="card-body">
                                                        <h6 class="card-title text-muted">Defeats</h6>
                                                        <h2 class="display-5 fw-bold">${stats.losses}</h2>
                                                        <div class="text-danger">
                                                            <small>${stats.draws} draws</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Game Breakdown -->
                                        <h5 class="border-bottom pb-2 mb-3 mt-4">Game Breakdown</h5>
                                        <div class="row">
                                            ${gameBreakdown || '<div class="col-12 text-center py-3 text-muted">No game data available</div>'}
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <!-- Recent Matches -->
                                        <h5 class="border-bottom pb-2 mb-3">Recent Matches</h5>
                                        ${recentMatches || '<div class="text-center py-3 text-muted">No recent matches</div>'}
                                        
                                        <div class="text-center mt-3">
                                            <a href="/profile" class="btn btn-outline-primary btn-sm" data-link>
                                                <i class="bi bi-list-ul me-1"></i> View All Matches
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    afterRender() {
        // Add logout functionality
        const logoutBtn = document.getElementById('home-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authService.logout();
                window.navigateTo('/');
            });
        }
        
        // Ensure quick start game links use client-side navigation
        document.querySelectorAll('.row.g-4.justify-content-center a[data-link]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Extract the href value and navigate to it
                const href = link.getAttribute('href');
                window.navigateTo(href);
            });
        });
    }
}