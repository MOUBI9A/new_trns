import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';
import RockPaperScissorsGame from '../games/RockPaperScissors.js';

export default class RockPaperScissorsGameView extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Rock Paper Scissors');
        this.rpsGame = null;
    }
    
    async getHtml() {
        return `
            <div class="view-container fade-in">
                <h1 class="section-title">Rock Paper Scissors</h1>
                
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="mb-3 text-center">
                            <div class="btn-group" role="group" aria-label="Game mode selection">
                                <button type="button" class="btn btn-primary active" id="singleplayer-btn">Single Player</button>
                                <button type="button" class="btn btn-outline-primary" id="multiplayer-btn">Two Players</button>
                            </div>
                        </div>
                        
                        <!-- Player 2 name input (for multiplayer only) -->
                        <div id="player2-input" class="mb-3 text-center" style="display: none;">
                            <div class="row justify-content-center">
                                <div class="col-md-6">
                                    <div class="input-group">
                                        <span class="input-group-text">Player 2 Name</span>
                                        <input type="text" class="form-control" id="player2-name" placeholder="Enter name">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="text-center mb-3">
                            <button class="btn btn-success btn-lg" id="start-game-btn">Start Game</button>
                            <button class="btn btn-warning btn-lg" id="restart-game-btn">Restart</button>
                            <button class="btn btn-info btn-lg" id="pause-game-btn">Pause</button>
                        </div>
                        
                        <div class="rps-container text-center">
                            <canvas id="rps-canvas" width="600" height="500" class="border"></canvas>
                        </div>
                        
                        <!-- Match Result Modal -->
                        <div class="modal fade" id="match-result-modal" tabindex="-1" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title">Match Result</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <div class="modal-body text-center">
                                        <h4 id="result-message">Player 1 Wins!</h4>
                                        <p id="result-score">3 - 1</p>
                                        <div class="alert alert-success mt-3">
                                            Match recorded in your profile history!
                                        </div>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <h5>How to Play:</h5>
                            <ul>
                                <li>Click on rock, paper, or scissors to make your choice</li>
                                <li><strong>Rock</strong> beats Scissors, <strong>Paper</strong> beats Rock, <strong>Scissors</strong> beats Paper</li>
                                <li>First to win the best of 5 rounds wins the game</li>
                                <li>In two-player mode, players take turns making their choices</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    afterRender() {
        // Initialize game object
        this.rpsGame = new RockPaperScissorsGame('rps-canvas');
        
        // Draw initial canvas state
        this.rpsGame.draw();
        
        // Set up button event listeners
        const singlePlayerBtn = document.getElementById('singleplayer-btn');
        const multiPlayerBtn = document.getElementById('multiplayer-btn');
        const player2Input = document.getElementById('player2-input');
        const player2NameInput = document.getElementById('player2-name');
        const startGameBtn = document.getElementById('start-game-btn');
        const restartGameBtn = document.getElementById('restart-game-btn');
        const pauseGameBtn = document.getElementById('pause-game-btn');
        
        // Initialize modal
        this.matchResultModal = new bootstrap.Modal(document.getElementById('match-result-modal'));
        
        // Game mode toggle
        singlePlayerBtn.addEventListener('click', () => {
            singlePlayerBtn.classList.add('active');
            singlePlayerBtn.classList.remove('btn-outline-primary');
            singlePlayerBtn.classList.add('btn-primary');
            
            multiPlayerBtn.classList.remove('active');
            multiPlayerBtn.classList.add('btn-outline-primary');
            multiPlayerBtn.classList.remove('btn-primary');
            
            // Hide player 2 input
            player2Input.style.display = 'none';
        });
        
        multiPlayerBtn.addEventListener('click', () => {
            multiPlayerBtn.classList.add('active');
            multiPlayerBtn.classList.remove('btn-outline-primary');
            multiPlayerBtn.classList.add('btn-primary');
            
            singlePlayerBtn.classList.remove('active');
            singlePlayerBtn.classList.add('btn-outline-primary');
            singlePlayerBtn.classList.remove('btn-primary');
            
            // Show player 2 input
            player2Input.style.display = 'block';
        });
        
        // Start game
        startGameBtn.addEventListener('click', () => {
            const singlePlayerMode = singlePlayerBtn.classList.contains('active');
            this.rpsGame.start(singlePlayerMode);
            
            // Update pause button to show it's available
            pauseGameBtn.disabled = false;
            pauseGameBtn.textContent = 'Pause';
            
            // Set opponent name for match history
            this.player2Name = singlePlayerMode ? "Computer" : 
                (player2NameInput.value.trim() || "Player 2");
            
            // Track game in user history
            if (authService.isAuthenticated()) {
                authService.addGameToHistory({
                    title: "Rock Paper Scissors",
                    mode: singlePlayerMode ? "Single Player" : "Two Players",
                    score: 0
                });
                
                // Override the game's winner determination to record match
                const originalProcessAdvancement = this.rpsGame.processAdvancement;
                this.rpsGame.processAdvancement = () => {
                    originalProcessAdvancement.call(this.rpsGame);
                    
                    // Check if tournament is complete
                    if (this.rpsGame.winner) {
                        // Determine result
                        const isWinner = this.rpsGame.winner === 'player1';
                        const resultText = isWinner ? "You Win!" : (singlePlayerMode ? "Computer Wins!" : "Player 2 Wins!");
                        
                        // Update modal with results
                        document.getElementById('result-message').textContent = resultText;
                        document.getElementById('result-score').textContent = 
                            `${this.rpsGame.score.player1} - ${this.rpsGame.score.player2}`;
                        
                        // Record match in history
                        authService.addMatchToHistory({
                            game: "Rock Paper Scissors",
                            opponent: this.player2Name,
                            result: isWinner ? "win" : "loss",
                            score: {
                                player1: this.rpsGame.score.player1,
                                player2: this.rpsGame.score.player2
                            }
                        });
                        
                        // Show match result modal after a short delay
                        setTimeout(() => {
                            this.matchResultModal.show();
                        }, 1000);
                    }
                };
            }
        });
        
        // Restart game
        restartGameBtn.addEventListener('click', () => {
            const singlePlayerMode = singlePlayerBtn.classList.contains('active');
            this.rpsGame.start(singlePlayerMode);
            
            // Reset pause button
            pauseGameBtn.disabled = false;
            pauseGameBtn.textContent = 'Pause';
            
            // Set opponent name for match history
            this.player2Name = singlePlayerMode ? "Computer" : 
                (player2NameInput.value.trim() || "Player 2");
        });
        
        // Pause/Resume game
        pauseGameBtn.addEventListener('click', () => {
            if (!this.rpsGame.gameRunning) {
                return; // No game running, do nothing
            }
            
            if (this.rpsGame.gamePaused) {
                // Resume the game
                this.rpsGame.resume();
                pauseGameBtn.textContent = 'Pause';
            } else {
                // Pause the game
                this.rpsGame.pause();
                pauseGameBtn.textContent = 'Resume';
            }
        });
    }
    
    // Clean up when view is destroyed
    onDestroy() {
        if (this.rpsGame) {
            this.rpsGame.stop();
        }
    }
} 