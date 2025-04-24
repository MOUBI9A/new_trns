/**
 * Game Hub SPA - App
 * Main application initialization
 */

import authService from './services/AuthService.js';

class App {
    constructor() {
        this.initializeApp();
        this.setupEventListeners();
    }

    /**
     * Initialize the application
     */
    async initializeApp() {
        // Update auth section UI based on authentication status
        this.updateAuthUI();
        
        // Listen for authentication changes
        document.addEventListener('auth:changed', () => {
            this.updateAuthUI();
        });
        
        console.log('App initialized successfully');
    }

    /**
     * Update the auth section UI based on authentication status
     */
    updateAuthUI() {
        const authSection = document.getElementById('auth-section');
        if (!authSection) return;

        if (authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            authSection.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-light dropdown-toggle" type="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
                        ${user.avatar ? 
                            `<img src="${user.avatar}" alt="Avatar" class="avatar-xs me-1 rounded-circle">` : 
                            `<i class="bi bi-person-circle me-1"></i>`}
                        ${user.username}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenu">
                        <li><a class="dropdown-item" href="/profile" data-link>
                            <i class="bi bi-person me-2"></i>Profile
                        </a></li>
                        <li><a class="dropdown-item" href="/friends" data-link>
                            <i class="bi bi-people me-2"></i>Friends
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item" id="logout-btn">
                            <i class="bi bi-box-arrow-right me-2"></i>Logout
                        </button></li>
                    </ul>
                </div>
            `;

            // Set up logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    try {
                        await authService.logout();
                        // Navigate to home after logout
                        window.navigateTo('/');
                        // Dispatch authentication change event
                        document.dispatchEvent(new CustomEvent('auth:changed'));
                    } catch (error) {
                        console.error('Error logging out:', error);
                        alert('Failed to logout. Please try again.');
                    }
                });
            }
        } else {
            authSection.innerHTML = `
                <a href="/login" class="btn btn-outline-light btn-sm" data-link>
                    <i class="bi bi-box-arrow-in-right me-1"></i>Login
                </a>
            `;
        }

        // Update navigation visibility based on auth status
        this.updateNavigation();
    }

    /**
     * Update navigation visibility based on authentication status
     */
    updateNavigation() {
        const isAuthenticated = authService.isAuthenticated();
        
        // Get all nav links that require authentication
        document.querySelectorAll('.nav-item').forEach(navItem => {
            const link = navItem.querySelector('a[data-link]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            
            // Hide certain links from non-authenticated users
            if (['/games', '/profile', '/friends'].includes(href)) {
                navItem.style.display = isAuthenticated ? '' : 'none';
            }
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for auth changes from other parts of the application
        document.addEventListener('auth:login', () => {
            this.updateAuthUI();
        });
        
        document.addEventListener('auth:logout', () => {
            this.updateAuthUI();
        });
    }
}

// Initialize the app
const app = new App();

export default app;