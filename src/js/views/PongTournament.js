import AbstractView from './AbstractView.js';
import PongTournament from '../games/PongTournament.js';
import Pong from '../games/Pong.js';
import authService from '../services/AuthService.js';

export default class PongTournamentView extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Pong Tournament');
        this.tournament = new PongTournament();
        this.pongGame = null;
        this.currentMatchIndex = -1;
        this.tournamentStarted = false;
        
        // Check if there's a tournament in progress
        this.tournamentInProgress = false;
    }
    
    async getHtml() {
        return `
            <div class="view-container fade-in">
                <div class="row mb-4">
                    <div class="col">
                        <h1 class="section-title">Pong Tournament</h1>
                        <p class="lead">Create a tournament, add players, and compete against your friends!</p>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-lg-8">
                        <!-- Tournament setup and game area -->
                        <div class="card mb-4">
                            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    <i class="bi bi-trophy me-2"></i>Tournament
                                </h5>
                                <div>
                                    <button id="reset-tournament" class="btn btn-sm btn-outline-light" style="display: none;">
                                        <i class="bi bi-arrow-repeat me-1"></i>Reset Tournament
                                    </button>
                                </div>
                            </div>
                            <div class="card-body">
                                <!-- Player registration before tournament starts -->
                                <div id="player-registration" class="mb-4">
                                    <h5 class="mb-3">Player Registration</h5>
                                    <div class="row g-2 mb-3">
                                        <div class="col">
                                            <div class="input-group">
                                                <input type="text" id="player-name" class="form-control" placeholder="Enter player name">
                                                <button id="add-player" class="btn btn-primary">
                                                    <i class="bi bi-plus"></i> Add Player
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div id="players-list" class="mb-3">
                                        <div class="alert alert-info">
                                            No players added yet. Add at least 2 players to start the tournament.
                                        </div>
                                    </div>
                                    
                                    <button id="start-tournament" class="btn btn-success" disabled>
                                        <i class="bi bi-flag-fill me-2"></i>Start Tournament
                                    </button>
                                </div>
                                
                                <!-- Tournament bracket (shown after tournament starts) -->
                                <div id="tournament-bracket" style="display: none;" class="mb-4"></div>
                                
                                <!-- Active match area -->
                                <div id="match-area" style="display: none;">
                                    <h5 class="mb-3">Current Match</h5>
                                    <div id="current-match-info" class="text-center mb-3">
                                        <div class="h5">
                                            <span id="player1-name"></span> 
                                            <span class="text-muted">VS</span> 
                                            <span id="player2-name"></span>
                                        </div>
                                        <div class="text-muted">Round <span id="current-round">1</span></div>
                                    </div>
                                    
                                    <div id="game-container" class="mb-3">
                                        <div class="ratio ratio-16x9 bg-dark">
                                            <canvas id="pong-canvas"></canvas>
                                        </div>
                                    </div>
                                    
                                    <div id="game-controls" class="d-flex justify-content-center">
                                        <button id="start-match" class="btn btn-primary mx-2">
                                            <i class="bi bi-play-fill me-2"></i>Start Match
                                        </button>
                                        <button id="end-match" class="btn btn-warning mx-2" style="display: none;">
                                            <i class="bi bi-flag-fill me-2"></i>End Match
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Tournament result (shown when tournament is complete) -->
                                <div id="tournament-result" style="display: none;" class="text-center">
                                    <div class="py-4">
                                        <i class="bi bi-trophy-fill text-warning" style="font-size: 4rem;"></i>
                                        <h3 class="mt-3">Tournament Complete!</h3>
                                        <h4 class="mb-4">Winner: <span id="tournament-winner" class="text-success"></span></h4>
                                        <button id="new-tournament" class="btn btn-primary">
                                            <i class="bi bi-plus-circle me-2"></i>Start New Tournament
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <!-- Tournament history -->
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">
                                    <i class="bi bi-clock-history me-2"></i>Tournament History
                                </h5>
                            </div>
                            <div class="card-body">
                                <div id="tournament-history" class="small">
                                    <div class="text-center py-4 text-muted">
                                        <i class="bi bi-clock" style="font-size: 1.5rem;"></i>
                                        <p class="mt-2">Tournament history will appear here</p>
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
        // Set up the Pong canvas
        this.canvas = document.getElementById('pong-canvas');
        
        // Initialize controls
        this.setupEventListeners();
        
        // Load tournament history
        this.loadTournamentHistory();
    }
    
    setupEventListeners() {
        // Add player button
        const addPlayerBtn = document.getElementById('add-player');
        const playerNameInput = document.getElementById('player-name');
        
        addPlayerBtn.addEventListener('click', () => {
            this.addPlayer();
        });
        
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPlayer();
            }
        });
        
        // Start tournament button
        document.getElementById('start-tournament').addEventListener('click', () => {
            this.startTournament();
        });
        
        // Reset tournament button
        document.getElementById('reset-tournament').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the tournament? All progress will be lost.')) {
                this.resetTournament();
            }
        });
        
        // Start match button
        document.getElementById('start-match').addEventListener('click', () => {
            this.startMatch();
        });
        
        // End match button
        document.getElementById('end-match').addEventListener('click', () => {
            this.endMatch();
        });
        
        // New tournament button (after tournament ends)
        document.getElementById('new-tournament').addEventListener('click', () => {
            this.resetTournament();
        });
    }
    
    addPlayer() {
        const playerNameInput = document.getElementById('player-name');
        const playerName = playerNameInput.value.trim();
        
        if (playerName) {
            try {
                // Check if the current user is logged in and attempting to add themselves
                let userId = null;
                const isCurrentUser = authService.isAuthenticated() && 
                    playerName.toLowerCase() === authService.getCurrentUser().username.toLowerCase();
                    
                if (isCurrentUser) {
                    userId = authService.getCurrentUser().username;
                }
                
                // Add player to the tournament
                this.tournament.addPlayer(playerName, userId);
                
                // Clear input
                playerNameInput.value = '';
                
                // Update player list
                this.updatePlayerList();
                
                // Enable start button if at least 2 players
                document.getElementById('start-tournament').disabled = this.tournament.state.players.length < 2;
            } catch (error) {
                alert(error.message);
            }
        }
    }
    
    updatePlayerList() {
        const playersListDiv = document.getElementById('players-list');
        const players = this.tournament.state.players;
        
        if (players.length === 0) {
            playersListDiv.innerHTML = `
                <div class="alert alert-info">
                    No players added yet. Add at least 2 players to start the tournament.
                </div>
            `;
            return;
        }
        
        let html = '<ul class="list-group">';
        players.forEach(player => {
            // Check if player is the logged-in user
            const isCurrentUser = authService.isAuthenticated() && 
                player.userId === authService.getCurrentUser().username;
                
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${player.name}
                    ${isCurrentUser ? '<span class="badge bg-primary">You</span>' : ''}
                    <button class="btn btn-sm btn-outline-danger remove-player" data-player-id="${player.id}">
                        <i class="bi bi-x"></i>
                    </button>
                </li>
            `;
        });
        html += '</ul>';
        
        playersListDiv.innerHTML = html;
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-player').forEach(button => {
            button.addEventListener('click', () => {
                const playerId = button.getAttribute('data-player-id');
                this.tournament.removePlayer(playerId);
                this.updatePlayerList();
                document.getElementById('start-tournament').disabled = this.tournament.state.players.length < 2;
            });
        });
    }
    
    startTournament() {
        if (this.tournament.state.players.length < 2) {
            alert('Add at least 2 players to start the tournament');
            return;
        }
        
        // Start the tournament
        const firstMatch = this.tournament.start();
        if (!firstMatch) {
            alert('Failed to start tournament');
            return;
        }
        
        // Hide registration and show bracket
        document.getElementById('player-registration').style.display = 'none';
        document.getElementById('tournament-bracket').style.display = 'block';
        document.getElementById('match-area').style.display = 'block';
        document.getElementById('reset-tournament').style.display = 'inline-block';
        
        // Set tournament started flag
        this.tournamentStarted = true;
        
        // Render bracket
        this.renderBracket();
        
        // Set up the first match
        this.setupNextMatch();
    }
    
    renderBracket() {
        const bracketData = this.tournament.getBracketData();
        const bracketDiv = document.getElementById('tournament-bracket');
        
        let html = '';
        
        // Generate bracket display
        if (bracketData.rounds.length > 0) {
            html += '<div class="tournament-bracket">';
            
            bracketData.rounds.forEach((round, roundIndex) => {
                html += `
                    <div class="round">
                        <h6 class="text-center mb-3">Round ${round.round}</h6>
                        <div class="matches">
                `;
                
                round.matches.forEach(match => {
                    // Style differently based on match status
                    let matchClass = '';
                    if (match.winner) {
                        matchClass = 'completed';
                    } else if (this.isNextMatch(match)) {
                        matchClass = 'current';
                    }
                    
                    html += `
                        <div class="match ${matchClass}">
                            <div class="player ${match.winner === match.player1 ? 'winner' : ''}">
                                ${match.player1}
                                ${match.winner ? `<span class="score">${match.score.player1}</span>` : ''}
                            </div>
                            <div class="player ${match.winner === match.player2 ? 'winner' : ''}">
                                ${match.player2}
                                ${match.winner ? `<span class="score">${match.score.player2}</span>` : ''}
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            });
            
            // Show champion if tournament is complete
            if (bracketData.completed && bracketData.champion) {
                html += `
                    <div class="round">
                        <h6 class="text-center mb-3">Champion</h6>
                        <div class="matches">
                            <div class="match champion">
                                <div class="player winner">
                                    ${bracketData.champion.name}
                                    <i class="bi bi-trophy-fill text-warning ms-2"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        } else {
            html = '<div class="alert alert-info">Tournament bracket will appear here when the tournament starts.</div>';
        }
        
        // Add styles for the bracket
        html += `
            <style>
                .tournament-bracket {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    justify-content: flex-start;
                    overflow-x: auto;
                    padding-bottom: 15px;
                }
                .round {
                    min-width: 180px;
                    flex-shrink: 0;
                }
                .matches {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .match {
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .match.current {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
                }
                .match.completed {
                    background-color: #f8f9fa;
                }
                .match.champion {
                    border-color: #ffc107;
                    background-color: #fff8e1;
                }
                .player {
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px solid #ddd;
                }
                .player:last-child {
                    border-bottom: none;
                }
                .player.winner {
                    font-weight: bold;
                    background-color: #d1e7dd;
                }
                .score {
                    font-weight: bold;
                }
            </style>
        `;
        
        bracketDiv.innerHTML = html;
    }
    
    isNextMatch(match) {
        if (!this.tournament.state.matches) return false;
        
        const currentMatch = this.tournament.state.matches[this.tournament.state.currentMatchIndex];
        if (!currentMatch) return false;
        
        return match.id === currentMatch.id;
    }
    
    setupNextMatch() {
        const currentMatch = this.tournament.state.matches[this.tournament.state.currentMatchIndex];
        
        if (!currentMatch) {
            // Tournament is over
            this.tournamentComplete();
            return;
        }
        
        // Update round display
        document.getElementById('current-round').textContent = currentMatch.round;
        
        // Update player names
        document.getElementById('player1-name').textContent = currentMatch.player1.name;
        document.getElementById('player2-name').textContent = currentMatch.player2.name;
        
        // Show/hide appropriate buttons
        document.getElementById('start-match').style.display = 'inline-block';
        document.getElementById('end-match').style.display = 'none';
        
        // Re-render the bracket to highlight the current match
        this.renderBracket();
        
        // Add match to history display
        this.addHistoryItem(`Match started: ${currentMatch.player1.name} vs ${currentMatch.player2.name} (Round ${currentMatch.round})`);
    }
    
    startMatch() {
        // Initialize the Pong game
        this.pongGame = new Pong('pong-canvas', {
            scoreLimit: 5,  // First to 5 points wins
            ballSpeed: 7,   // Slightly faster for tournaments
            paddleSize: 100
        });
        
        // Initialize the canvas for first draw
        this.pongGame.drawStartScreen();
        
        // Switch buttons
        document.getElementById('start-match').style.display = 'none';
        document.getElementById('end-match').style.display = 'inline-block';
        
        // Listen for win event
        this.canvas.addEventListener('game:win', (e) => {
            const winner = e.detail.player;
            const score = e.detail.score;
            
            // Update the tournament with the match result
            const player1Score = score.left;
            const player2Score = score.right;
            
            setTimeout(() => {
                this.endMatch(player1Score, player2Score);
            }, 2000); // Give players a moment to see the win screen
        });
        
        // Start the game
        this.pongGame.start();
    }
    
    endMatch(player1Score = 0, player2Score = 0) {
        // Clean up the game
        if (this.pongGame) {
            this.pongGame.destroy();
            this.pongGame = null;
        }
        
        // Get the current match
        const currentMatch = this.tournament.state.matches[this.tournament.state.currentMatchIndex];
        
        // If no scores were provided (manual end), get from game state
        if (player1Score === 0 && player2Score === 0 && this.pongGame) {
            player1Score = this.pongGame.state.scoreLeft;
            player2Score = this.pongGame.state.scoreRight;
            
            // If neither player has scored, just end with arbitrary scores
            if (player1Score === 0 && player2Score === 0) {
                player1Score = 5;
                player2Score = 0;
            }
        }
        
        // Ensure a winner (in case of manual end)
        if (player1Score === player2Score) {
            player1Score += 1; // Arbitrary winner if tied
        }
        
        // Record match result
        const nextMatch = this.tournament.recordMatchResult(player1Score, player2Score);
        
        // Update history
        const winner = player1Score > player2Score ? currentMatch.player1.name : currentMatch.player2.name;
        this.addHistoryItem(`Match ended: ${currentMatch.player1.name} ${player1Score} - ${player2Score} ${currentMatch.player2.name} (${winner} wins)`);
        
        // Switch buttons back
        document.getElementById('end-match').style.display = 'none';
        document.getElementById('start-match').style.display = 'inline-block';
        
        // Update UI for next match
        if (nextMatch) {
            this.setupNextMatch();
        } else {
            this.tournamentComplete();
        }
        
        // Re-render the bracket
        this.renderBracket();
        
        // Try to save the tournament
        this.saveTournament();
    }
    
    tournamentComplete() {
        const champion = this.tournament.getChampion();
        
        if (champion) {
            // Show the winner
            document.getElementById('tournament-winner').textContent = champion.name;
            
            // Update history
            this.addHistoryItem(`Tournament complete! Champion: ${champion.name}`);
            
            // Hide match area and show result
            document.getElementById('match-area').style.display = 'none';
            document.getElementById('tournament-result').style.display = 'block';
            
            // Save tournament
            this.saveTournament();
        }
    }
    
    resetTournament() {
        // Reset all state
        this.tournament = new PongTournament();
        this.pongGame = null;
        this.currentMatchIndex = -1;
        this.tournamentStarted = false;
        
        // Reset UI
        document.getElementById('player-registration').style.display = 'block';
        document.getElementById('tournament-bracket').style.display = 'none';
        document.getElementById('match-area').style.display = 'none';
        document.getElementById('tournament-result').style.display = 'none';
        document.getElementById('start-tournament').disabled = true;
        document.getElementById('reset-tournament').style.display = 'none';
        
        // Clear player list
        this.updatePlayerList();
        
        // Clear history (but keep from other tournaments)
        document.getElementById('tournament-history').innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="bi bi-clock" style="font-size: 1.5rem;"></i>
                <p class="mt-2">Tournament history will appear here</p>
            </div>
        `;
        
        // Load past tournament history
        this.loadTournamentHistory();
    }
    
    async saveTournament() {
        try {
            await this.tournament.save();
        } catch (error) {
            console.error('Error saving tournament:', error);
        }
    }
    
    async loadTournamentHistory() {
        try {
            const historyData = await this.tournament.loadHistory();
            
            if (historyData && historyData.length > 0) {
                const historyDiv = document.getElementById('tournament-history');
                
                let html = '<div class="tournament-history-items">';
                
                // Sort by most recent first
                const sortedHistory = [...historyData].sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                
                sortedHistory.forEach(tournament => {
                    const date = new Date(tournament.timestamp).toLocaleDateString();
                    const time = new Date(tournament.timestamp).toLocaleTimeString();
                    
                    html += `
                        <div class="tournament-history-item mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge bg-primary">${date}</span>
                                <small>${time}</small>
                            </div>
                            <div class="mt-1">
                                <strong>Players:</strong> ${tournament.players.length}
                            </div>
                            <div>
                                <strong>Winner:</strong> 
                                ${tournament.completed ? 
                                    tournament.players.find(p => p.wins === Math.max(...tournament.players.map(p => p.wins)))?.name || 'Unknown' : 
                                    'Tournament not completed'}
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
                historyDiv.innerHTML = html;
            }
        } catch (error) {
            console.error('Error loading tournament history:', error);
        }
    }
    
    addHistoryItem(message) {
        const historyDiv = document.getElementById('tournament-history');
        const historyItems = historyDiv.querySelector('.tournament-history-items') || document.createElement('div');
        historyItems.className = 'tournament-history-items';
        
        // Remove placeholder if present
        const placeholder = historyDiv.querySelector('.text-center');
        if (placeholder) {
            historyDiv.removeChild(placeholder);
        }
        
        // Create new history item
        const item = document.createElement('div');
        item.className = 'history-item mb-2 pb-2 border-bottom';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'text-muted mb-1 small';
        timestamp.textContent = new Date().toLocaleTimeString();
        
        const messageEl = document.createElement('div');
        messageEl.innerHTML = message;
        
        item.appendChild(timestamp);
        item.appendChild(messageEl);
        
        // Add to history
        historyItems.prepend(item);
        historyDiv.appendChild(historyItems);
        
        // Scroll to top if needed
        historyDiv.scrollTop = 0;
    }
    
    // Clean up when view is destroyed
    onDestroy() {
        // Clean up Pong game
        if (this.pongGame) {
            this.pongGame.destroy();
            this.pongGame = null;
        }
        
        // Remove event listeners
        // Note: This is a simplified cleanup, a full implementation would track and remove all listeners
    }
}