/**
 * Pong Tournament class
 * Handles tournament logic, player management, and bracket generation
 */
export default class PongTournament {
    constructor() {
        this.state = {
            id: this.generateId(),
            players: [],
            matches: [],
            currentMatchIndex: -1,
            completed: false,
            startDate: null
        };
    }
    
    /**
     * Generate a unique ID for the tournament
     */
    generateId() {
        return 'trn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }
    
    /**
     * Add a player to the tournament
     * @param {string} name - Player's display name
     * @param {string|null} userId - Optional user ID if the player is a registered user
     */
    addPlayer(name, userId = null) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Player name cannot be empty');
        }
        
        // Check for duplicate player names
        if (this.state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            throw new Error('A player with this name already exists in the tournament');
        }
        
        // Create player object
        const player = {
            id: 'player_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: name.trim(),
            userId: userId,
            wins: 0,
            losses: 0
        };
        
        this.state.players.push(player);
        return player;
    }
    
    /**
     * Remove a player from the tournament
     * @param {string} playerId - ID of the player to remove
     */
    removePlayer(playerId) {
        if (this.state.matches.length > 0) {
            throw new Error('Cannot remove players after tournament has started');
        }
        
        const playerIndex = this.state.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            throw new Error('Player not found');
        }
        
        this.state.players.splice(playerIndex, 1);
    }
    
    /**
     * Start the tournament and generate matches
     */
    start() {
        if (this.state.players.length < 2) {
            throw new Error('At least 2 players are required to start a tournament');
        }
        
        if (this.state.matches.length > 0) {
            throw new Error('Tournament has already started');
        }
        
        // Randomize player order
        this.shufflePlayers();
        
        // Generate matches
        this.generateMatches();
        
        // Set tournament start time
        this.state.startDate = new Date().toISOString();
        
        // Set the current match to the first one
        this.state.currentMatchIndex = 0;
        
        return this.state.matches[0];
    }
    
    /**
     * Shuffle players array to randomize match-ups
     */
    shufflePlayers() {
        for (let i = this.state.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.state.players[i], this.state.players[j]] = [this.state.players[j], this.state.players[i]];
        }
    }
    
    /**
     * Generate matches for the tournament bracket
     */
    generateMatches() {
        const players = [...this.state.players];
        const matches = [];
        const rounds = this.calculateRequiredRounds(players.length);
        
        // Handle case where players count is not a power of 2
        const playerCount = players.length;
        const matchCount = Math.pow(2, rounds - 1);
        const byeCount = matchCount * 2 - playerCount;
        
        // First round
        let matchId = 1;
        let currentRound = 1;
        let roundMatches = [];
        
        // Create first round matches with byes if needed
        for (let i = 0; i < matchCount; i++) {
            // Check if this match should be a "bye"
            if (i < byeCount) {
                // Skip this match slot - player gets a bye
                continue;
            }
            
            const player1 = players.shift();
            const player2 = players.shift();
            
            if (!player1 || !player2) {
                // This shouldn't happen with correct calculations
                continue;
            }
            
            const match = {
                id: `match_${matchId++}`,
                round: currentRound,
                player1: player1,
                player2: player2,
                winner: null,
                loser: null,
                nextMatchId: this.calculateNextMatchId(currentRound, i, rounds),
                score: {
                    player1: 0,
                    player2: 0
                },
                completed: false
            };
            
            roundMatches.push(match);
            matches.push(match);
        }
        
        // Create placeholder matches for subsequent rounds
        for (let round = 2; round <= rounds; round++) {
            currentRound = round;
            const roundMatchCount = Math.pow(2, rounds - round);
            
            for (let i = 0; i < roundMatchCount; i++) {
                const match = {
                    id: `match_${matchId++}`,
                    round: currentRound,
                    player1: null, // Will be filled in as tournament progresses
                    player2: null,
                    winner: null,
                    loser: null,
                    nextMatchId: round < rounds ? this.calculateNextMatchId(currentRound, i, rounds) : null, // Final match has no next match
                    score: {
                        player1: 0,
                        player2: 0
                    },
                    completed: false
                };
                
                matches.push(match);
            }
        }
        
        this.state.matches = matches;
    }
    
    /**
     * Calculate how many rounds are needed for the tournament
     */
    calculateRequiredRounds(playerCount) {
        return Math.ceil(Math.log2(playerCount));
    }
    
    /**
     * Calculate the ID of the next match
     */
    calculateNextMatchId(currentRound, currentIndex, totalRounds) {
        // For the final round, there is no next match
        if (currentRound === totalRounds) {
            return null;
        }
        
        // Calculate the match number in the next round
        const nextRoundMatchIndex = Math.floor(currentIndex / 2);
        
        // Generate the match ID
        return `match_${Math.pow(2, totalRounds - currentRound - 1) + nextRoundMatchIndex + 1}`;
    }
    
    /**
     * Record the result of a match and advance the tournament
     * @param {number} player1Score - Score for player 1
     * @param {number} player2Score - Score for player 2
     * @returns {object|null} The next match or null if tournament is complete
     */
    recordMatchResult(player1Score, player2Score) {
        if (!this.state.matches || this.state.currentMatchIndex < 0) {
            throw new Error('No active match to record result for');
        }
        
        const currentMatch = this.state.matches[this.state.currentMatchIndex];
        if (!currentMatch) {
            throw new Error('Current match not found');
        }
        
        // Determine winner and loser
        let winner, loser;
        if (player1Score > player2Score) {
            winner = currentMatch.player1;
            loser = currentMatch.player2;
        } else {
            winner = currentMatch.player2;
            loser = currentMatch.player1;
        }
        
        // Update match with result
        currentMatch.score.player1 = player1Score;
        currentMatch.score.player2 = player2Score;
        currentMatch.winner = winner;
        currentMatch.loser = loser;
        currentMatch.completed = true;
        
        // Update player stats
        winner.wins += 1;
        loser.losses += 1;
        
        // Find the next match this winner advances to
        if (currentMatch.nextMatchId) {
            const nextMatch = this.state.matches.find(m => m.id === currentMatch.nextMatchId);
            if (nextMatch) {
                // Assign winner to next match
                if (!nextMatch.player1) {
                    nextMatch.player1 = winner;
                } else {
                    nextMatch.player2 = winner;
                }
            }
        }
        
        // Move to next match that has both players assigned
        let foundMatch = false;
        
        // First, increment current match index
        this.state.currentMatchIndex++;
        
        // Check if we're at the end of all matches
        if (this.state.currentMatchIndex >= this.state.matches.length) {
            this.state.currentMatchIndex = -1; // No more matches
            this.state.completed = true;
            return null;
        }
        
        // Find the next match that has both players
        while (this.state.currentMatchIndex < this.state.matches.length) {
            const nextMatch = this.state.matches[this.state.currentMatchIndex];
            
            if (nextMatch && nextMatch.player1 && nextMatch.player2 && !nextMatch.completed) {
                foundMatch = true;
                break;
            }
            
            this.state.currentMatchIndex++;
        }
        
        if (!foundMatch) {
            // If no match with both players found, tournament is over
            this.state.currentMatchIndex = -1;
            this.state.completed = true;
            return null;
        }
        
        return this.state.matches[this.state.currentMatchIndex];
    }
    
    /**
     * Get data formatted for rendering a tournament bracket
     */
    getBracketData() {
        if (!this.state.matches || this.state.matches.length === 0) {
            return { rounds: [], completed: false };
        }
        
        const rounds = [];
        const matchesByRound = {};
        
        // Group matches by round
        this.state.matches.forEach(match => {
            if (!matchesByRound[match.round]) {
                matchesByRound[match.round] = [];
            }
            
            // Format match for display
            const displayMatch = {
                id: match.id,
                round: match.round,
                player1: match.player1 ? match.player1.name : 'TBD',
                player2: match.player2 ? match.player2.name : 'TBD',
                winner: match.winner ? match.winner.name : null,
                score: match.score,
                completed: match.completed
            };
            
            matchesByRound[match.round].push(displayMatch);
        });
        
        // Create round objects
        Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b)).forEach(round => {
            rounds.push({
                round: parseInt(round),
                matches: matchesByRound[round]
            });
        });
        
        return {
            rounds,
            completed: this.state.completed,
            champion: this.getChampion()
        };
    }
    
    /**
     * Get the champion of the tournament (if completed)
     */
    getChampion() {
        if (!this.state.completed) {
            return null;
        }
        
        // Find the player with most wins
        return [...this.state.players].sort((a, b) => b.wins - a.wins)[0] || null;
    }
    
    /**
     * Save tournament to local storage
     */
    async save() {
        try {
            // Get existing tournaments
            const existingData = localStorage.getItem('pong_tournaments');
            let tournaments = [];
            
            if (existingData) {
                tournaments = JSON.parse(existingData);
            }
            
            // Create a tournament entry for history
            const tournamentData = {
                id: this.state.id,
                players: this.state.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    userId: p.userId,
                    wins: p.wins,
                    losses: p.losses
                })),
                completed: this.state.completed,
                startDate: this.state.startDate,
                endDate: this.state.completed ? new Date().toISOString() : null,
                matches: this.state.matches.length,
                timestamp: new Date().toISOString()
            };
            
            // Add to history, limiting to 20 tournaments
            tournaments.unshift(tournamentData);
            if (tournaments.length > 20) {
                tournaments = tournaments.slice(0, 20);
            }
            
            // Save to local storage
            localStorage.setItem('pong_tournaments', JSON.stringify(tournaments));
            
            return tournamentData;
        } catch (error) {
            console.error('Error saving tournament:', error);
            throw error;
        }
    }
    
    /**
     * Load tournament history from local storage
     */
    async loadHistory() {
        try {
            const data = localStorage.getItem('pong_tournaments');
            if (!data) return [];
            
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading tournament history:', error);
            return [];
        }
    }
}