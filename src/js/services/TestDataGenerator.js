/**
 * Test Data Generator
 * Utility for generating test data for the Game Hub application
 */

import authService from './AuthService.js';

class TestDataGenerator {
    constructor() {
        this.games = ['Pong', 'Tic Tac Toe', 'Rock Paper Scissors'];
        this.opponents = ['Computer', 'Player 2', 'Guest', 'AI Bot', 'Friend'];
        this.results = ['win', 'loss', 'draw'];
    }

    /**
     * Generate a random match entry
     */
    generateRandomMatch(daysAgo = null) {
        const game = this.games[Math.floor(Math.random() * this.games.length)];
        const opponent = this.opponents[Math.floor(Math.random() * this.opponents.length)];
        const result = this.results[Math.floor(Math.random() * this.results.length)];
        
        // Create a date from now to X days ago
        let playedAt = new Date();
        if (daysAgo !== null) {
            playedAt.setDate(playedAt.getDate() - daysAgo);
        } else {
            // Random date within the last 30 days
            const randomDays = Math.floor(Math.random() * 30);
            playedAt.setDate(playedAt.getDate() - randomDays);
        }

        // Generate score based on the game and result
        let score = null;
        if (game === 'Pong') {
            if (result === 'win') {
                score = { player1: 11, player2: Math.floor(Math.random() * 10) };
            } else if (result === 'loss') {
                score = { player1: Math.floor(Math.random() * 10), player2: 11 };
            } else {
                // Draw is not typical in Pong but for testing purposes
                score = { player1: 10, player2: 10 };
            }
        } else if (game === 'Tic Tac Toe') {
            // For Tic Tac Toe, we'll just represent wins/losses
            if (result !== 'draw') {
                score = { player1: result === 'win' ? 1 : 0, player2: result === 'loss' ? 1 : 0 };
            } else {
                score = { player1: 0, player2: 0 };
            }
        } else if (game === 'Rock Paper Scissors') {
            // Best of 3 for RPS
            if (result === 'win') {
                score = { player1: 2, player2: Math.floor(Math.random() * 2) };
            } else if (result === 'loss') {
                score = { player1: Math.floor(Math.random() * 2), player2: 2 };
            } else {
                score = { player1: 1, player2: 1 };
            }
        }

        return {
            game,
            opponent,
            result,
            score,
            playedAt: playedAt.toISOString()
        };
    }

    /**
     * Generate multiple random matches
     */
    generateMatches(count = 10) {
        const matches = [];
        
        for (let i = 0; i < count; i++) {
            matches.push(this.generateRandomMatch());
        }
        
        return matches;
    }

    /**
     * Add random matches to current user's history
     */
    addRandomMatchesToHistory(count = 10) {
        if (!authService.isAuthenticated()) {
            console.error('User not authenticated. Cannot add matches.');
            return false;
        }
        
        try {
            for (let i = 0; i < count; i++) {
                const match = this.generateRandomMatch();
                authService.addMatchToHistory(match);
            }
            return true;
        } catch (error) {
            console.error('Error adding random matches:', error);
            return false;
        }
    }
    
    /**
     * Add chronological matches (one for each of the last X days)
     */
    addChronologicalMatches(days = 14) {
        if (!authService.isAuthenticated()) {
            console.error('User not authenticated. Cannot add matches.');
            return false;
        }
        
        try {
            for (let i = days - 1; i >= 0; i--) {
                const match = this.generateRandomMatch(i);
                authService.addMatchToHistory(match);
            }
            return true;
        } catch (error) {
            console.error('Error adding chronological matches:', error);
            return false;
        }
    }

    /**
     * Clear all match history for current user
     */
    clearMatchHistory() {
        if (!authService.isAuthenticated()) {
            console.error('User not authenticated. Cannot clear match history.');
            return false;
        }
        
        try {
            // Get current user
            const username = authService.getCurrentUser().username;
            const user = authService.loadUsers()[username];
            
            if (user) {
                // Reset match history and stats
                user.matchHistory = [];
                user.stats = {
                    totalMatches: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    byGame: {}
                };
                
                // Save changes
                const users = authService.loadUsers();
                users[username] = user;
                localStorage.setItem('game_hub_users', JSON.stringify(users));
                authService.saveSession(user);
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error clearing match history:', error);
            return false;
        }
    }
}

const testDataGenerator = new TestDataGenerator();
export default testDataGenerator;