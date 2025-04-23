import Home from './views/Home.js';
import Games from './views/Games.js';
import Profile from './views/Profile.js';
import Login from './views/Login.js';
import NotFound from './views/NotFound.js';
import PongGameView from './views/PongGame.js';
import TicTacToeGameView from './views/TicTacToeGame.js';
import RockPaperScissorsGameView from './views/RockPaperScissorsGame.js';
import PongTournamentView from './views/PongTournament.js';
import authService from './services/AuthService.js';

// Define routes
const routes = [
    { path: '/', view: Home },
    { path: '/games', view: Games, requiresAuth: true },
    { path: '/profile', view: Profile, requiresAuth: true },
    { path: '/login', view: Login },
    { path: '/games/pong', view: PongGameView, requiresAuth: true },
    { path: '/games/tictactoe', view: TicTacToeGameView, requiresAuth: true },
    { path: '/games/rockpaperscissors', view: RockPaperScissorsGameView, requiresAuth: true },
    { path: '/games/pong/tournament', view: PongTournamentView, requiresAuth: true }
];

// Router functionality
const router = async () => {
    // Test each route for potential match
    const potentialMatches = routes.map(route => {
        return {
            route: route,
            isMatch: location.pathname === route.path
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

    // If no match, use "Not Found" route
    if (!match) {
        // Check if we're accessing a route directly from browser URL
        // If so, redirect to home page instead of showing Not Found
        if (document.referrer === '') {
            history.pushState(null, null, '/');
            return router();
        }
        
        match = {
            route: { path: '/not-found', view: NotFound },
            isMatch: true
        };
    }

    // Check if route requires authentication
    if (match.route.requiresAuth && !authService.isAuthenticated()) {
        // Redirect to login page if not authenticated
        history.pushState(null, null, '/login');
        return router();
    }

    // Initialize the matching view
    const view = new match.route.view();

    // Render the view in the app container
    document.querySelector('#app').innerHTML = await view.getHtml();
    
    // Call the afterRender method if it exists (for any post-render logic)
    if (typeof view.afterRender === 'function') {
        view.afterRender();
    }
    
    // Update active state in navigation
    updateNav(location.pathname);
    
    // Update auth state in navbar
    updateAuthState();
};

// Update active navigation links
const updateNav = (currentPath) => {
    document.querySelectorAll('[data-link]').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
};

// Update auth state in navbar
const updateAuthState = () => {
    const authElement = document.getElementById('auth-section');
    if (authElement) {
        if (authService.isAuthenticated()) {
            const currentUser = authService.getCurrentUser();
            const displayName = currentUser.displayName || currentUser.username;
            
            let avatarHtml = '';
            if (currentUser.avatar) {
                avatarHtml = `<img src="${currentUser.avatar}" alt="Avatar" class="rounded-circle me-2" width="32" height="32">`;
            } else {
                avatarHtml = `<span class="avatar-placeholder me-2"><i class="bi bi-person-circle"></i></span>`;
            }
            
            authElement.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="navbar-text me-3 d-none d-md-inline">
                        Welcome, ${displayName}
                    </span>
                    <a href="/profile" class="avatar-link me-2" data-link>
                        ${avatarHtml}
                    </a>
                    <button id="logout-btn" class="btn btn-outline-light">
                        <i class="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                </div>
            `;
            
            // Add logout event listener
            document.getElementById('logout-btn').addEventListener('click', () => {
                authService.logout();
                navigateTo('/');
            });
            
            // Add direct event listener to all avatar elements to ensure proper navigation
            const avatarLinkContainer = document.querySelector('.avatar-link');
            if (avatarLinkContainer) {
                // First remove any existing click event to prevent duplicates
                avatarLinkContainer.removeEventListener('click', profileNavigationHandler);
                
                // Add the click handler to the container
                avatarLinkContainer.addEventListener('click', profileNavigationHandler);
                
                // Also add click handlers to any child elements inside the avatar link
                const avatarChildren = avatarLinkContainer.querySelectorAll('*');
                avatarChildren.forEach(child => {
                    child.addEventListener('click', profileNavigationHandler);
                });
            }
        } else {
            authElement.innerHTML = `
                <a href="/login" class="btn btn-outline-light" data-link>
                    <i class="bi bi-box-arrow-in-right me-2"></i>Login
                </a>
            `;
            
            // Add direct event listener to the login button to ensure proper navigation
            const loginBtn = authElement.querySelector('a[href="/login"]');
            if (loginBtn) {
                loginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Stop event bubbling
                    history.pushState(null, null, '/login');
                    router();
                });
            }
        }
    }
};

// Profile navigation handler function to be used by event listeners
function profileNavigationHandler(e) {
    e.preventDefault();
    e.stopPropagation(); // Stop event bubbling
    history.pushState(null, null, '/profile');
    router();
}

// Handle navigation
window.addEventListener('popstate', router);

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]')) {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });

    router();
});

// Navigation function
const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

// Define a global navigation function
window.navigateTo = (url) => {
    history.pushState(null, null, url);
    router();
}; 