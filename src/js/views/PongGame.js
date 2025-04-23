import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';
import PongGame from '../games/Pong.js';

export default class PongGameView extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Pong');
        this.pongGame = null;
    }
    
    async getHtml() {
        return `
            <div class="view-container fade-in">
                <h1 class="section-title">Pong Game</h1>
                
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
                        
                        <div class="pong-container text-center">
                            <canvas id="pong-canvas" width="800" height="500" class="border"></canvas>
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
                                        <p id="result-score">5 - 3</p>
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
                                <li><strong>Player 1:</strong> Use W and S keys to move the paddle up and down</li>
                                <li><strong>Player 2 (Two Player Mode):</strong> Use Arrow Up and Arrow Down keys</li>
                                <li>First player to reach 5 points wins!</li>
                            </ul>
                        </div>
                        
                        <div class="mt-4 text-center">
                            <hr>
                            <h5>Want to compete?</h5>
                            <a href="/games/pong/tournament" class="btn btn-outline-primary" data-link>
                                <i class="bi bi-trophy"></i> Join a Tournament
                            </a>
                            <p class="text-muted mt-2">Play offline tournaments with 2-8 players</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    afterRender() {
        // Initialize game object
        this.pongGame = new PongGame('pong-canvas');
        
        // Draw initial canvas state
        this.pongGame.draw();
        
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
            this.pongGame.start(singlePlayerMode);
            
            // Update pause button to show it's available
            pauseGameBtn.disabled = false;
            pauseGameBtn.textContent = 'Pause';
            
            // Track game in user history
            if (authService.isAuthenticated()) {
                // Save basic game info
                authService.addGameToHistory({
                    title: "Pong",
                    mode: singlePlayerMode ? "Single Player" : "Two Players",
                    score: 0
                });
                
                // Set up opponent name for match history
                this.player2Name = singlePlayerMode ? "Computer" : 
                    (player2NameInput.value.trim() || "Player 2");
                
                // Override the original update ball method to catch game completion
                const originalUpdateBall = this.pongGame.updateBall;
                this.pongGame.updateBall = () => {
                    originalUpdateBall.call(this.pongGame);
                    
                    // Check if the game is over (someone reached 5 points)
                    if (this.pongGame.score.player1 >= 5 || this.pongGame.score.player2 >= 5) {
                        // Determine winner
                        const isWinner = this.pongGame.score.player1 > this.pongGame.score.player2;
                        const resultText = isWinner ? "You Win!" : (singlePlayerMode ? "Computer Wins!" : "Player 2 Wins!");
                        
                        // Update modal with results
                        document.getElementById('result-message').textContent = resultText;
                        document.getElementById('result-score').textContent = 
                            `${this.pongGame.score.player1} - ${this.pongGame.score.player2}`;
                        
                        // Record match in history
                        if (authService.isAuthenticated()) {
                            authService.addMatchToHistory({
                                game: "Pong",
                                opponent: this.player2Name,
                                result: isWinner ? "win" : "loss",
                                score: {
                                    player1: this.pongGame.score.player1,
                                    player2: this.pongGame.score.player2
                                }
                            });
                        }
                        
                        // Show result modal
                        this.matchResultModal.show();
                        
                        // Reset the game
                        this.pongGame.gameRunning = false;
                    }
                };
            }
        });
        
        // Restart game
        restartGameBtn.addEventListener('click', () => {
            const singlePlayerMode = singlePlayerBtn.classList.contains('active');
            this.pongGame.start(singlePlayerMode);
            
            // Reset pause button
            pauseGameBtn.disabled = false;
            pauseGameBtn.textContent = 'Pause';
            
            // Set up opponent name for match history
            this.player2Name = singlePlayerMode ? "Computer" : 
                (player2NameInput.value.trim() || "Player 2");
        });
        
        // Pause/Resume game
        pauseGameBtn.addEventListener('click', () => {
            if (!this.pongGame.gameRunning) {
                return; // No game running, do nothing
            }
            
            if (this.pongGame.gamePaused) {
                // Resume the game
                this.pongGame.resume();
                pauseGameBtn.textContent = 'Pause';
            } else {
                // Pause the game
                this.pongGame.pause();
                pauseGameBtn.textContent = 'Resume';
            }
        });
    }
    
    // Clean up when view is destroyed
    onDestroy() {
        if (this.pongGame) {
            this.pongGame.stop();
        }
    }
} 