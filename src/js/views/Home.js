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
                </style>
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