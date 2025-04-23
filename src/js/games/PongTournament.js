/**
 * Pong Tournament
 * Handles offline tournament functionality for the Pong game
 */
export default class PongTournament {
    constructor() {
        this.players = [];
        this.bracket = [];
        this.currentMatchIndex = 0;
        this.tournamentComplete = false;
        this.winner = null;
        this.tournamentId = Date.now(); // Unique ID for this tournament
    }
    
    /**
     * Add a player to the tournament
     * @param {string} alias - Player's name/alias
     */
    addPlayer(alias) {
        if (this.players.length < 8) {
            this.players.push({
                id: this.players.length + 1,
                alias: alias,
                score: 0,
                wins: 0,
                losses: 0
            });
            return true;
        }
        return false; // Max 8 players
    }
    
    /**
     * Get the number of players currently registered
     */
    getPlayerCount() {
        return this.players.length;
    }
    
    /**
     * Generate the tournament bracket based on the number of players
     */
    generateBracket() {
        if (this.players.length < 2) {
            return false; // Need at least 2 players
        }
        
        // Reset the bracket
        this.bracket = [];
        this.currentMatchIndex = 0;
        this.tournamentComplete = false;
        this.winner = null;
        
        // Determine the bracket size based on player count (power of 2)
        let bracketSize = 1;
        while (bracketSize < this.players.length) {
            bracketSize *= 2;
        }
        
        // Calculate number of rounds
        const totalRounds = Math.log2(bracketSize);
        
        // Create a shuffled copy of players to randomize matchups
        const shuffledPlayers = [...this.players].sort(() => Math.random() - 0.5);
        
        // Generate first round with byes as needed
        const firstRoundMatches = bracketSize / 2;
        const byeCount = bracketSize - shuffledPlayers.length;
        
        for (let i = 0; i < firstRoundMatches; i++) {
            // Determine players for this match
            const player1Idx = i;
            const player2Idx = bracketSize - 1 - i;
            
            const player1 = player1Idx < shuffledPlayers.length ? shuffledPlayers[player1Idx] : null;
            const player2 = player2Idx < shuffledPlayers.length ? shuffledPlayers[player2Idx] : null;
            
            // Create the match
            const match = {
                round: 1,
                match: i + 1,
                player1: player1,
                player2: player2,
                winner: null,
                complete: false,
                score: {
                    player1: 0,
                    player2: 0
                }
            };
            
            // Handle byes
            if (!player1 && player2) {
                // Player 2 gets a bye
                match.winner = player2;
                match.complete = true;
                match.score = { player1: 0, player2: 5 };
            } else if (player1 && !player2) {
                // Player 1 gets a bye
                match.winner = player1;
                match.complete = true;
                match.score = { player1: 5, player2: 0 };
            } else if (!player1 && !player2) {
                // This should never happen in a proper tournament, but handle it anyway
                match.complete = true;
            }
            
            this.bracket.push(match);
        }
        
        // Create placeholder matches for future rounds
        for (let round = 2; round <= totalRounds; round++) {
            const matchesInRound = bracketSize / Math.pow(2, round);
            
            for (let match = 1; match <= matchesInRound; match++) {
                this.bracket.push({
                    round: round,
                    match: match,
                    player1: null,
                    player2: null,
                    winner: null,
                    complete: false,
                    score: {
                        player1: 0,
                        player2: 0
                    }
                });
            }
        }
        
        // Process initial advancements from byes
        this.processAdvancement();
        
        return true;
    }
    
    /**
     * Process any automatic advancements after matches are completed
     */
    processAdvancement() {
        let changesOccurred = false;
        
        // Process each match to see if winners need to advance
        for (let i = 0; i < this.bracket.length; i++) {
            const match = this.bracket[i];
            
            // Only process completed matches with a winner that haven't been processed yet
            if (match.complete && match.winner) {
                // Calculate the next match's information
                const nextRound = match.round + 1;
                const nextMatchNumber = Math.ceil(match.match / 2);
                
                // Find the next match in the bracket
                const nextMatchIndex = this.bracket.findIndex(m => 
                    m.round === nextRound && m.match === nextMatchNumber);
                
                // If we found a next match and the winner hasn't been placed yet
                if (nextMatchIndex !== -1) {
                    const nextMatch = this.bracket[nextMatchIndex];
                    
                    // Determine if this winner goes to player1 or player2 slot
                    // Player 1 slot if coming from odd match number, player 2 slot if from even
                    if (match.match % 2 === 1 && !nextMatch.player1) {
                        this.bracket[nextMatchIndex].player1 = match.winner;
                        changesOccurred = true;
                    } else if (match.match % 2 === 0 && !nextMatch.player2) {
                        this.bracket[nextMatchIndex].player2 = match.winner;
                        changesOccurred = true;
                    }
                    
                    // After updating players, check if the next match can be auto-completed
                    const updatedNextMatch = this.bracket[nextMatchIndex];
                    
                    // Check for byes
                    if (updatedNextMatch.player1 && !updatedNextMatch.player2) {
                        // Player 1 gets a bye
                        updatedNextMatch.winner = updatedNextMatch.player1;
                        updatedNextMatch.complete = true;
                        updatedNextMatch.score = { player1: 5, player2: 0 };
                        changesOccurred = true;
                    } else if (!updatedNextMatch.player1 && updatedNextMatch.player2) {
                        // Player 2 gets a bye
                        updatedNextMatch.winner = updatedNextMatch.player2;
                        updatedNextMatch.complete = true;
                        updatedNextMatch.score = { player1: 0, player2: 5 };
                        changesOccurred = true;
                    }
                }
            }
        }
        
        // If we made any changes, process again recursively
        if (changesOccurred) {
            this.processAdvancement();
        }
        
        // Check if tournament is complete (final match has a winner)
        const finalRound = Math.log2(this.getFinalBracketSize());
        const finalMatch = this.bracket.find(m => m.round === finalRound && m.match === 1);
        
        if (finalMatch && finalMatch.complete && finalMatch.winner) {
            this.tournamentComplete = true;
            this.winner = finalMatch.winner;
            this.saveTournamentResults();
        }
    }
    
    /**
     * Calculate the final bracket size (next power of 2)
     */
    getFinalBracketSize() {
        let size = 1;
        while (size < this.players.length) {
            size *= 2;
        }
        return size;
    }
    
    /**
     * Get the next match to be played
     */
    getNextMatch() {
        // Find the first incomplete match that has both players assigned
        const nextMatch = this.bracket.find(m => 
            !m.complete && m.player1 && m.player2);
        
        if (nextMatch) {
            return nextMatch;
        }
        
        return null;
    }
    
    /**
     * Get the index of the next match to be played
     */
    getNextMatchIndex() {
        const nextMatch = this.getNextMatch();
        if (nextMatch) {
            return this.bracket.indexOf(nextMatch);
        }
        return -1;
    }
    
    /**
     * Record the result of a match
     * @param {number} matchIndex - Index of the match in the bracket
     * @param {Object} player1Score - Score for player 1
     * @param {Object} player2Score - Score for player 2
     */
    recordMatchResult(matchIndex, player1Score, player2Score) {
        if (matchIndex >= 0 && matchIndex < this.bracket.length) {
            const match = this.bracket[matchIndex];
            
            match.score.player1 = player1Score;
            match.score.player2 = player2Score;
            match.complete = true;
            
            // Determine winner
            if (player1Score > player2Score) {
                match.winner = match.player1;
                if (match.player1) match.player1.wins++;
                if (match.player2) match.player2.losses++;
            } else {
                match.winner = match.player2;
                if (match.player2) match.player2.wins++;
                if (match.player1) match.player1.losses++;
            }
            
            // Process advancement
            this.processAdvancement();
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Save tournament results to localStorage
     */
    saveTournamentResults() {
        if (this.tournamentComplete) {
            // Get existing tournaments or initialize empty array
            let tournaments = JSON.parse(localStorage.getItem('pongTournaments') || '[]');
            
            // Add this tournament
            tournaments.push({
                id: this.tournamentId,
                date: new Date().toISOString(),
                players: this.players,
                winner: this.winner,
                bracket: this.bracket
            });
            
            // Save back to localStorage
            localStorage.setItem('pongTournaments', JSON.stringify(tournaments));
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Get all past tournament results from localStorage
     */
    static getTournamentHistory() {
        return JSON.parse(localStorage.getItem('pongTournaments') || '[]');
    }
    
    /**
     * Clear tournament history from localStorage
     */
    static clearTournamentHistory() {
        localStorage.removeItem('pongTournaments');
    }
} 