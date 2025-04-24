import Home from './views/Home.js';
import Games from './views/Games.js';
import Profile from './views/Profile.js';
import Login from './views/Login.js';
import NotFound from './views/NotFound.js';
import PongGameView from './views/PongGame.js';
import TicTacToeGameView from './views/TicTacToeGame.js';
import RockPaperScissorsGameView from './views/RockPaperScissorsGame.js';
import PongTournamentView from './views/PongTournament.js';
import Friends from './views/Friends.js';
import authService from './services/AuthService.js';

// Define routes
const routes = [
    { path: '/', view: Home },
    { path: '/games', view: Games, requiresAuth: true },
    { path: '/profile', view: Profile, requiresAuth: true },
    { path: '/friends', view: Friends, requiresAuth: true },
    { path: '/login', view: Login },
    { path: '/games/pong', view: PongGameView, requiresAuth: true },
    { path: '/games/tictactoe', view: TicTacToeGameView, requiresAuth: true },
    { path: '/games/rockpaperscissors', view: RockPaperScissorsGameView, requiresAuth: true },
    { path: '/games/pong/tournament', view: PongTournamentView, requiresAuth: true }
];

// Router functionality
const router = async () => {
    // Parse current URL to check for parameters
    const url = location.pathname + location.search;
    
    // Test each route for potential match and extract parameters
    // This handles routes like /profile/username
    const potentialMatches = routes.map(route => {
        // Check for dynamic routes with parameters
        // e.g., /profile/:username
        const dynamicSegments = route.path.match(/:\w+/g) || [];
        const pathPattern = route.path.replace(/:\w+/g, '([^/]+)');
        const match = location.pathname.match(new RegExp(`^${pathPattern}$`));
        
        if (match) {
            // Extract parameters from URL
            const params = {};
            dynamicSegments.forEach((segment, i) => {
                const paramName = segment.substring(1); // Remove the colon
                params[paramName] = match[i + 1]; // +1 because the first match is the full string
            });
            
            // Extract query parameters
            const queryParams = {};
            const searchParams = new URLSearchParams(location.search);
            for (const [key, value] of searchParams.entries()) {
                queryParams[key] = value;
            }
            
            return {
                route,
                isMatch: true,
                params,
                queryParams
            };
        }
        
        // Standard route matching
        return {
            route: route,
            isMatch: location.pathname === route.path,
            params: {},
            queryParams: Object.fromEntries(new URLSearchParams(location.search))
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);
    
    // Special case for user profiles
    if (!match && location.pathname.startsWith('/profile/')) {
        const username = location.pathname.split('/')[2];
        if (username) {
            match = {
                route: { path: '/profile/:username', view: Profile },
                isMatch: true,
                params: { username },
                queryParams: Object.fromEntries(new URLSearchParams(location.search))
            };
        }
    }

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
            isMatch: true,
            params: {},
            queryParams: {}
        };
    }

    // Check if route requires authentication
    if (match.route.requiresAuth && !authService.isAuthenticated()) {
        // Redirect to login page if not authenticated
        history.pushState(null, null, '/login');
        return router();
    }

    // Initialize the matching view with the extracted parameters
    const view = new match.route.view(match.params, match.queryParams);

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
        const href = link.getAttribute('href');
        // Check if the current path starts with the link's href
        // This allows for sub-routes to highlight parent nav items
        if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
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
                <div class="dropdown">
                    <button class="btn btn-outline-light dropdown-toggle d-flex align-items-center" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        ${avatarHtml}
                        <span class="d-none d-md-inline">${displayName}</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                        <li><a class="dropdown-item" href="/profile" data-link>
                            <i class="bi bi-person me-2"></i>My Profile
                        </a></li>
                        <li><a class="dropdown-item" href="/friends" data-link>
                            <i class="bi bi-people me-2"></i>Friends
                            <span id="friend-request-badge" class="badge bg-danger ms-2 d-none">0</span>
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item" id="logout-btn">
                            <i class="bi bi-box-arrow-right me-2"></i>Logout
                        </button></li>
                    </ul>
                </div>
            `;
            
            // Add logout event listener
            document.getElementById('logout-btn').addEventListener('click', () => {
                authService.logout();
                navigateTo('/');
            });
            
            // Check for friend requests and update badge
            updateFriendRequestBadge();
            
        } else {
            authElement.innerHTML = `
                <a href="/login" class="btn btn-outline-light" data-link>
                    <i class="bi bi-box-arrow-in-right me-2"></i>Login
                </a>
            `;
        }
    }
};

// Update friend request badge
const updateFriendRequestBadge = () => {
    if (!authService.isAuthenticated()) return;
    
    const badge = document.getElementById('friend-request-badge');
    if (badge) {
        const requests = authService.getFriendRequests();
        if (requests && requests.length > 0) {
            badge.textContent = requests.length;
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    }
};

// Handle navigation
window.addEventListener('popstate', router);

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', e => {
        const navLink = e.target.matches('[data-link]') ? 
            e.target : e.target.closest('[data-link]');
            
        if (navLink) {
            e.preventDefault();
            navigateTo(navLink.href);
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

// Update friend request notifications periodically
if (authService.isAuthenticated()) {
    setInterval(updateFriendRequestBadge, 30000); // Check every 30 seconds
}