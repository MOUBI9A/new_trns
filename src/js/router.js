/**
 * Game Hub SPA - Router
 * Handles client-side routing for the single page application
 */

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
import OAuthSuccess from './views/OAuthSuccess.js';
import authService from './services/AuthService.js';
import app from './app.js';

// Define routes
const routes = [
    { path: '/', view: Home },
    { path: '/games', view: Games, requiresAuth: true },
    { path: '/profile', view: Profile, requiresAuth: true },
    { path: '/friends', view: Friends, requiresAuth: true },
    { path: '/login', view: Login },
    { path: '/games/pong', view: PongGameView },
    { path: '/games/tictactoe', view: TicTacToeGameView },
    { path: '/games/rockpaperscissors', view: RockPaperScissorsGameView },
    { path: '/pong-tournament', view: PongTournamentView },
    { path: '/oauth-success', view: OAuthSuccess }
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
        // Escape special characters in the route path before replacing segments
        const escapedPath = route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pathPattern = escapedPath.replace(/:\w+/g, '([^/]+)');
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
    try {
        document.querySelector('#app').innerHTML = await view.getHtml();
    } catch (error) {
        console.error('Error rendering view:', error);
        document.querySelector('#app').innerHTML = `
            <div class="alert alert-danger my-5" role="alert">
                <h4 class="alert-heading">Error Loading Page</h4>
                <p>There was a problem loading this page. Please try again later.</p>
                <hr>
                <p class="mb-0">If the problem persists, please contact support.</p>
            </div>
        `;
    }
    
    // Call the afterRender method if it exists (for any post-render logic)
    if (typeof view.afterRender === 'function') {
        try {
            await view.afterRender();
        } catch (error) {
            console.error('Error in afterRender:', error);
        }
    }
    
    // Update active state in navigation
    updateNav(location.pathname);
    
    // Dispatch navigation event
    document.dispatchEvent(new CustomEvent('navigation:changed', { 
        detail: { path: location.pathname }
    }));
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
window.navigateTo = url => {
    history.pushState(null, null, url);
    router();
};