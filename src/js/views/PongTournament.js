import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';
import PongGame from '../games/Pong.js';
import PongTournament from '../games/PongTournament.js';

export default class PongTournamentView extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Pong Tournament');
        this.tournament = new PongTournament();
        this.pongGame = null;
        this.currentMatchIndex = -1;
        this.tournamentStarted = false;
        this.gameInProgress = false;
    }
    
    async getHtml() {
        return `
            <div class="view-container fade-in">
                <h1 class="section-title">Pong Tournament</h1>
                
                <div class="card mb-4">
                    <div class="card-body">
                        <!-- Tournament Setup -->
                        <div id="tournament-setup" class="mb-4">
                            <h3>Player Registration</h3>
                            <p>Register 2, 4, or 8 players for the tournament.</p>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <div class="input-group mb-2">
                                        <input type="text" class="form-control" id="player-name" placeholder="Player name" maxlength="20">
                                        <button class="btn btn-primary" id="add-player-btn">Add Player</button>
                                    </div>
                                    <small class="text-muted">Enter player names (2-8 players)</small>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <h5>Registered Players: <span id="player-count">0</span>/8</h5>
                                <ul class="list-group" id="player-list">
                                    <!-- Player list will be added here -->
                                </ul>
                            </div>
                            
                            <button class="btn btn-success" id="start-tournament-btn" disabled>Start Tournament</button>
                        </div>
                        
                        <!-- Tournament Bracket -->
                        <div id="tournament-bracket" class="mb-4" style="display: none;">
                            <h3>Tournament Bracket</h3>
                            <div class="tournament-container">
                                <div class="bracket-container" id="bracket-display">
                                    <!-- Bracket will be rendered here -->
                                </div>
                            </div>
                        </div>
                        
                        <!-- Current Match Display -->
                        <div id="current-match-display" class="mb-4" style="display: none;">
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h4 class="mb-0">Current Match</h4>
                                </div>
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="text-center">
                                            <h3 id="player1-name">Player 1</h3>
                                            <h2 id="player1-score">0</h2>
                                        </div>
                                        <div class="match-vs">
                                            <h2>VS</h2>
                                        </div>
                                        <div class="text-center">
                                            <h3 id="player2-name">Player 2</h3>
                                            <h2 id="player2-score">0</h2>
                                        </div>
                                    </div>
                                    
                                    <div class="text-center mt-3">
                                        <button class="btn btn-primary btn-lg" id="play-match-btn">Play Match</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Game Arena (hidden until match starts) -->
                        <div id="game-arena" style="display: none;">
                            <div class="text-center mb-3">
                                <button class="btn btn-warning btn-lg" id="end-game-btn">End Game</button>
                            </div>
                            
                            <div class="pong-container text-center">
                                <canvas id="pong-canvas" width="800" height="500" class="border"></canvas>
                            </div>
                        </div>
                        
                        <!-- Tournament Winner -->
                        <div id="tournament-winner" class="mb-4" style="display: none;">
                            <div class="card bg-success text-white">
                                <div class="card-body text-center">
                                    <h3 class="mb-3">Tournament Winner!</h3>
                                    <h1 id="winner-name">Player Name</h1>
                                    <p class="mt-3">Congratulations to the champion!</p>
                                    <button class="btn btn-light mt-3" id="new-tournament-btn">Start New Tournament</button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Tournament History -->
                        <div class="mt-5">
                            <h3>Tournament History</h3>
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Players</th>
                                            <th>Winner</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tournament-history">
                                        <!-- Tournament history will be added here -->
                                    </tbody>
                                </table>
                            </div>
                            <button class="btn btn-sm btn-outline-danger" id="clear-history-btn">Clear History</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    afterRender() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize tournament history
        this.loadTournamentHistory();
    }
    
    setupEventListeners() {
        // Player registration
        const playerNameInput = document.getElementById('player-name');
        const addPlayerBtn = document.getElementById('add-player-btn');
        const startTournamentBtn = document.getElementById('start-tournament-btn');
        
        addPlayerBtn.addEventListener('click', () => {
            const playerName = playerNameInput.value.trim();
            if (playerName) {
                if (this.tournament.addPlayer(playerName)) {
                    this.updatePlayerList();
                    playerNameInput.value = '';
                    
                    // Enable start button if we have at least 2 players
                    if (this.tournament.getPlayerCount() >= 2) {
                        startTournamentBtn.disabled = false;
                    }
                } else {
                    alert('Maximum 8 players allowed');
                }
            }
        });
        
        // Allow enter key to add player
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addPlayerBtn.click();
            }
        });
        
        // Start tournament
        startTournamentBtn.addEventListener('click', () => {
            this.startTournament();
        });
        
        // Play match
        const playMatchBtn = document.getElementById('play-match-btn');
        playMatchBtn.addEventListener('click', () => {
            this.startMatch();
        });
        
        // End game/match
        const endGameBtn = document.getElementById('end-game-btn');
        endGameBtn.addEventListener('click', () => {
            this.endMatch();
        });
        
        // Start new tournament
        const newTournamentBtn = document.getElementById('new-tournament-btn');
        newTournamentBtn.addEventListener('click', () => {
            this.resetTournament();
        });
        
        // Clear history
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all tournament history?')) {
                PongTournament.clearTournamentHistory();
                this.loadTournamentHistory();
            }
        });
    }
    
    updatePlayerList() {
        const playerList = document.getElementById('player-list');
        const playerCount = document.getElementById('player-count');
        
        // Update count
        playerCount.textContent = this.tournament.getPlayerCount();
        
        // Clear and rebuild list
        playerList.innerHTML = '';
        
        this.tournament.players.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span>${player.alias}</span>
                <button class="btn btn-sm btn-outline-danger remove-player" data-index="${index}">
                    <i class="bi bi-x"></i>
                </button>
            `;
            playerList.appendChild(li);
        });
        
        // Add remove event listeners
        document.querySelectorAll('.remove-player').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                this.tournament.players.splice(index, 1);
                this.updatePlayerList();
                
                // Disable start button if we have fewer than 2 players
                if (this.tournament.getPlayerCount() < 2) {
                    document.getElementById('start-tournament-btn').disabled = true;
                }
            });
        });
    }
    
    startTournament() {
        // Generate bracket
        if (this.tournament.generateBracket()) {
            this.tournamentStarted = true;
            
            // Hide setup, show bracket
            document.getElementById('tournament-setup').style.display = 'none';
            document.getElementById('tournament-bracket').style.display = 'block';
            
            // Render the bracket
            this.renderBracket();
            
            // Setup the next match
            this.setupNextMatch();
        } else {
            alert('Failed to generate tournament bracket. Ensure you have at least 2 players.');
        }
    }
    
    renderBracket() {
        const bracketDisplay = document.getElementById('bracket-display');
        bracketDisplay.innerHTML = '';
        
        // Determine bracket size and rounds
        const playerCount = this.tournament.getPlayerCount();
        let bracketSize = 2;
        if (playerCount > 2) bracketSize = 4;
        if (playerCount > 4) bracketSize = 8;
        
        const totalRounds = Math.log2(bracketSize);
        
        // Create round columns
        const bracketHtml = document.createElement('div');
        bracketHtml.className = 'd-flex justify-content-between';
        
        for (let round = 1; round <= totalRounds; round++) {
            const roundColumn = document.createElement('div');
            roundColumn.className = 'round-column';
            
            const roundTitle = document.createElement('h5');
            roundTitle.textContent = round === totalRounds ? 'Final' : 
                                    round === totalRounds - 1 ? 'Semi-Finals' : 
                                    `Round ${round}`;
            roundColumn.appendChild(roundTitle);
            
            // Calculate matches in this round
            const matchesInRound = bracketSize / Math.pow(2, round);
            
            // Create match containers with appropriate spacing
            const matchContainerHeight = 500; // Total height
            const matchHeight = 80; // Height of each match box
            const availableSpace = matchContainerHeight - (matchesInRound * matchHeight);
            const spacing = availableSpace / (matchesInRound + 1);
            
            const matchContainer = document.createElement('div');
            matchContainer.className = 'match-container';
            matchContainer.style.height = `${matchContainerHeight}px`;
            
            // Add matches for this round
            for (let match = 1; match <= matchesInRound; match++) {
                // Find the match in the bracket
                const bracketMatch = this.tournament.bracket.find(
                    m => m.round === round && m.match === match
                );
                
                if (bracketMatch) {
                    const matchCard = document.createElement('div');
                    matchCard.className = 'match-card';
                    
                    // Set position for this match
                    const topPosition = match * spacing + (match - 1) * matchHeight;
                    matchCard.style.top = `${topPosition}px`;
                    
                    // Add player information
                    const player1Name = bracketMatch.player1 ? bracketMatch.player1.alias : 'TBD';
                    const player2Name = bracketMatch.player2 ? bracketMatch.player2.alias : 'TBD';
                    
                    let matchClass = '';
                    if (bracketMatch.complete) {
                        matchClass = 'completed-match';
                    } else if (this.isNextMatch(bracketMatch)) {
                        matchClass = 'next-match';
                    }
                    
                    // Create player info
                    matchCard.innerHTML = `
                        <div class="match-content ${matchClass}">
                            <div class="match-player ${bracketMatch.winner === bracketMatch.player1 ? 'match-winner' : ''}">
                                <span>${player1Name}</span>
                                <span class="match-score">${bracketMatch.score.player1}</span>
                            </div>
                            <div class="match-player ${bracketMatch.winner === bracketMatch.player2 ? 'match-winner' : ''}">
                                <span>${player2Name}</span>
                                <span class="match-score">${bracketMatch.score.player2}</span>
                            </div>
                        </div>
                    `;
                    
                    matchContainer.appendChild(matchCard);
                }
            }
            
            roundColumn.appendChild(matchContainer);
            bracketHtml.appendChild(roundColumn);
        }
        
        bracketDisplay.appendChild(bracketHtml);
        
        // Add some CSS for the bracket
        const style = document.createElement('style');
        style.innerHTML = `
            .bracket-container {
                padding: 20px;
                overflow-x: auto;
            }
            .round-column {
                min-width: 200px;
                text-align: center;
                padding: 0 10px;
            }
            .match-container {
                position: relative;
                margin-top: 10px;
            }
            .match-card {
                position: absolute;
                width: 100%;
            }
            .match-content {
                border: 1px solid #ddd;
                border-radius: 4px;
                background-color: #f8f9fa;
                padding: 10px;
                margin: 5px 0;
            }
            .match-player {
                display: flex;
                justify-content: space-between;
                padding: 5px;
                border-bottom: 1px solid #eee;
            }
            .match-player:last-child {
                border-bottom: none;
            }
            .match-score {
                font-weight: bold;
            }
            .match-winner {
                font-weight: bold;
                color: #28a745;
            }
            .completed-match {
                background-color: #e8f4f8;
            }
            .next-match {
                background-color: #fff3cd;
                border: 2px solid #ffc107;
            }
        `;
        document.head.appendChild(style);
    }
    
    isNextMatch(match) {
        const nextMatch = this.tournament.getNextMatch();
        return nextMatch && 
               nextMatch.round === match.round && 
               nextMatch.match === match.match;
    }
    
    setupNextMatch() {
        // Get the next match from the tournament
        const nextMatch = this.tournament.getNextMatch();
        
        if (nextMatch) {
            // Find the index of this match in the bracket array
            this.currentMatchIndex = this.tournament.bracket.findIndex(m => 
                m.round === nextMatch.round && m.match === nextMatch.match);
            
            // Show the current match display
            document.getElementById('current-match-display').style.display = 'block';
            
            // Update player names and scores
            document.getElementById('player1-name').textContent = nextMatch.player1 ? nextMatch.player1.alias : 'TBD';
            document.getElementById('player2-name').textContent = nextMatch.player2 ? nextMatch.player2.alias : 'TBD';
            document.getElementById('player1-score').textContent = nextMatch.score.player1;
            document.getElementById('player2-score').textContent = nextMatch.score.player2;
            
            // Enable/disable play button based on if both players are set
            const playButton = document.getElementById('play-match-btn');
            playButton.disabled = !(nextMatch.player1 && nextMatch.player2);
        } else {
            // No more matches, tournament is complete
            this.tournamentComplete();
        }
    }
    
    startMatch() {
        // Hide match display, show game arena
        document.getElementById('current-match-display').style.display = 'none';
        document.getElementById('game-arena').style.display = 'block';
        
        // Get current match
        const currentMatch = this.tournament.bracket[this.currentMatchIndex];
        
        // Initialize Pong game
        this.pongGame = new PongGame('pong-canvas');
        
        // Start in 2P mode
        this.pongGame.start(false);
        
        // Mark game as in progress
        this.gameInProgress = true;
        
        // Update game score callback to track when a match is complete
        const originalUpdateBall = this.pongGame.updateBall;
        
        this.pongGame.updateBall = () => {
            originalUpdateBall.call(this.pongGame);
            
            // Check for game complete
            if (this.pongGame.score.player1 >= 5 || this.pongGame.score.player2 >= 5) {
                // Game is complete, update match result
                this.tournament.recordMatchResult(
                    this.currentMatchIndex,
                    this.pongGame.score.player1,
                    this.pongGame.score.player2
                );
                
                // Record match in user history
                if (authService.isAuthenticated() && currentMatch.player1 && currentMatch.player2) {
                    const isWinner = this.pongGame.score.player1 > this.pongGame.score.player2;
                    const opponent = isWinner ? currentMatch.player2.alias : currentMatch.player1.alias;
                    
                    authService.addMatchToHistory({
                        game: "Pong Tournament",
                        opponent: opponent,
                        result: isWinner ? "win" : "loss",
                        score: {
                            player1: this.pongGame.score.player1,
                            player2: this.pongGame.score.player2
                        }
                    });
                }
                
                // End the match
                this.endMatch();
            }
            
            // Update current score display
            if (this.gameInProgress) {
                document.getElementById('player1-score').textContent = this.pongGame.score.player1;
                document.getElementById('player2-score').textContent = this.pongGame.score.player2;
            }
        };
        
        // Update auth service to track the game played
        if (authService.isAuthenticated()) {
            authService.addGameToHistory({
                title: "Pong Tournament Match",
                mode: "Tournament",
                score: 0
            });
        }
    }
    
    endMatch() {
        // Stop the game
        if (this.pongGame) {
            this.pongGame.stop();
            this.pongGame = null;
        }
        
        // Mark game as not in progress
        this.gameInProgress = false;
        
        // Hide game arena
        document.getElementById('game-arena').style.display = 'none';
        
        // Re-render bracket with updated scores
        this.renderBracket();
        
        // Setup the next match
        this.setupNextMatch();
    }
    
    tournamentComplete() {
        // Show winner display
        document.getElementById('tournament-winner').style.display = 'block';
        
        // Hide match display
        document.getElementById('current-match-display').style.display = 'none';
        
        // Update winner name
        document.getElementById('winner-name').textContent = this.tournament.winner.alias;
        
        // Update tournament history
        this.loadTournamentHistory();
    }
    
    resetTournament() {
        // Create new tournament
        this.tournament = new PongTournament();
        this.tournamentStarted = false;
        this.gameInProgress = false;
        
        // Reset UI
        document.getElementById('tournament-setup').style.display = 'block';
        document.getElementById('tournament-bracket').style.display = 'none';
        document.getElementById('current-match-display').style.display = 'none';
        document.getElementById('game-arena').style.display = 'none';
        document.getElementById('tournament-winner').style.display = 'none';
        
        // Reset player list
        this.updatePlayerList();
        
        // Disable start button
        document.getElementById('start-tournament-btn').disabled = true;
    }
    
    loadTournamentHistory() {
        const tournaments = PongTournament.getTournamentHistory();
        const historyTable = document.getElementById('tournament-history');
        
        if (tournaments.length === 0) {
            historyTable.innerHTML = '<tr><td colspan="3">No tournament history found</td></tr>';
            return;
        }
        
        // Sort tournaments by date (newest first)
        tournaments.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Generate history rows
        historyTable.innerHTML = '';
        
        tournaments.forEach(tournament => {
            const date = new Date(tournament.date);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${tournament.players.length} players</td>
                <td>${tournament.winner ? tournament.winner.alias : 'Unknown'}</td>
            `;
            
            historyTable.appendChild(row);
        });
    }
    
    // Clean up when view is destroyed
    onDestroy() {
        if (this.pongGame) {
            this.pongGame.stop();
        }
    }
} 