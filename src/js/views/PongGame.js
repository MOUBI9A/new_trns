import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';
import Pong from '../games/Pong.js';

export default class PongGameView extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Pong');
        this.pongGame = null;
        this.gameOptions = {
            enableAI: false,
            aiDifficulty: 'medium'
        };
    }
    
    async getHtml() {
        return `
            <div class="view-container fade-in">
                <h1 class="section-title">Pong Game</h1>
                
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="mb-3 text-center">
                            <div class="btn-group" role="group" aria-label="Game mode selection">
                                <button type="button" class="btn btn-primary active" id="singleplayer-btn">vs AI</button>
                                <button type="button" class="btn btn-outline-primary" id="multiplayer-btn">Two Players</button>
                            </div>
                        </div>
                        
                        <!-- AI difficulty settings (for singleplayer only) -->
                        <div id="ai-settings" class="mb-3 text-center">
                            <div class="row justify-content-center">
                                <div class="col-md-6">
                                    <label class="form-label">AI Difficulty</label>
                                    <div class="btn-group w-100" role="group" aria-label="AI difficulty selection">
                                        <input type="radio" class="btn-check" name="ai-difficulty" id="ai-easy" autocomplete="off">
                                        <label class="btn btn-outline-success" for="ai-easy">Easy</label>
                                        
                                        <input type="radio" class="btn-check" name="ai-difficulty" id="ai-medium" autocomplete="off" checked>
                                        <label class="btn btn-outline-warning" for="ai-medium">Medium</label>
                                        
                                        <input type="radio" class="btn-check" name="ai-difficulty" id="ai-hard" autocomplete="off">
                                        <label class="btn btn-outline-danger" for="ai-hard">Hard</label>
                                    </div>
                                </div>
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
                                        <div id="result-auth-message" class="alert alert-success mt-3">
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
                                <li id="player2-controls"><strong>AI Opponent:</strong> Computer-controlled</li>
                                <li>First player to reach 5 points wins!</li>
                                <li>Press SPACE to start/pause the game</li>
                            </ul>
                        </div>
                        
                        <div class="mt-4 text-center">
                            <hr>
                            <h5>Want to compete?</h5>
                            <a href="/pong-tournament" class="btn btn-outline-primary" data-link>
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
        // Initialize game object with default settings
        this.pongGame = new Pong('pong-canvas', {
            enableAI: true, // Default to AI mode
            aiDifficulty: 'medium'
        });
        
        // Draw initial canvas state
        this.pongGame.drawStartScreen();
        
        // Set up button event listeners
        const singlePlayerBtn = document.getElementById('singleplayer-btn');
        const multiPlayerBtn = document.getElementById('multiplayer-btn');
        const aiSettings = document.getElementById('ai-settings');
        const player2Input = document.getElementById('player2-input');
        const player2Controls = document.getElementById('player2-controls');
        const player2NameInput = document.getElementById('player2-name');
        const startGameBtn = document.getElementById('start-game-btn');
        const restartGameBtn = document.getElementById('restart-game-btn');
        const pauseGameBtn = document.getElementById('pause-game-btn');
        
        // AI difficulty buttons
        const aiEasyBtn = document.getElementById('ai-easy');
        const aiMediumBtn = document.getElementById('ai-medium');
        const aiHardBtn = document.getElementById('ai-hard');
        
        // Initialize modal
        this.matchResultModal = new bootstrap.Modal(document.getElementById('match-result-modal'));
        
        // Show/hide auth message based on login status
        document.getElementById('result-auth-message').style.display = 
            authService.isAuthenticated() ? 'block' : 'none';
        
        // Game mode toggle
        singlePlayerBtn.addEventListener('click', () => {
            singlePlayerBtn.classList.add('active');
            singlePlayerBtn.classList.remove('btn-outline-primary');
            singlePlayerBtn.classList.add('btn-primary');
            
            multiPlayerBtn.classList.remove('active');
            multiPlayerBtn.classList.add('btn-outline-primary');
            multiPlayerBtn.classList.remove('btn-primary');
            
            // Show AI settings, hide player 2 input
            aiSettings.style.display = 'block';
            player2Input.style.display = 'none';
            
            // Update control instructions
            player2Controls.innerHTML = '<strong>AI Opponent:</strong> Computer-controlled';
            
            // Update game options
            this.gameOptions.enableAI = true;
            if (this.pongGame) {
                this.pongGame.toggleAI(true);
                this.pongGame.drawStartScreen();
            }
        });
        
        multiPlayerBtn.addEventListener('click', () => {
            multiPlayerBtn.classList.add('active');
            multiPlayerBtn.classList.remove('btn-outline-primary');
            multiPlayerBtn.classList.add('btn-primary');
            
            singlePlayerBtn.classList.remove('active');
            singlePlayerBtn.classList.add('btn-outline-primary');
            singlePlayerBtn.classList.remove('btn-primary');
            
            // Hide AI settings, show player 2 input
            aiSettings.style.display = 'none';
            player2Input.style.display = 'block';
            
            // Update control instructions
            player2Controls.innerHTML = '<strong>Player 2:</strong> Use Arrow Up and Arrow Down keys';
            
            // Update game options
            this.gameOptions.enableAI = false;
            if (this.pongGame) {
                this.pongGame.toggleAI(false);
                this.pongGame.drawStartScreen();
            }
        });
        
        // AI difficulty settings
        aiEasyBtn.addEventListener('change', () => {
            if (aiEasyBtn.checked) {
                this.gameOptions.aiDifficulty = 'easy';
                if (this.pongGame) {
                    this.pongGame.setAIDifficulty('easy');
                }
            }
        });
        
        aiMediumBtn.addEventListener('change', () => {
            if (aiMediumBtn.checked) {
                this.gameOptions.aiDifficulty = 'medium';
                if (this.pongGame) {
                    this.pongGame.setAIDifficulty('medium');
                }
            }
        });
        
        aiHardBtn.addEventListener('change', () => {
            if (aiHardBtn.checked) {
                this.gameOptions.aiDifficulty = 'hard';
                if (this.pongGame) {
                    this.pongGame.setAIDifficulty('hard');
                }
            }
        });
        
        // Start game
        startGameBtn.addEventListener('click', () => {
            // Apply current game options
            this.pongGame.settings.enableAI = this.gameOptions.enableAI;
            this.pongGame.setAIDifficulty(this.gameOptions.aiDifficulty);
            
            // Start the game
            this.pongGame.start();
            
            // Set up opponent name for match history
            this.player2Name = this.gameOptions.enableAI 
                ? `AI (${this.gameOptions.aiDifficulty})` 
                : (player2NameInput.value.trim() || "Player 2");
        });
        
        // Restart game
        restartGameBtn.addEventListener('click', () => {
            if (this.pongGame) {
                this.pongGame.stop();
                // Apply current settings
                this.pongGame.settings.enableAI = this.gameOptions.enableAI;
                this.pongGame.setAIDifficulty(this.gameOptions.aiDifficulty);
                this.pongGame.drawStartScreen();
            }
        });
        
        // Pause/Resume game
        pauseGameBtn.addEventListener('click', () => {
            if (this.pongGame && this.pongGame.state.playing) {
                this.pongGame.togglePause();
                pauseGameBtn.textContent = this.pongGame.state.paused ? 'Resume' : 'Pause';
            }
        });
        
        // Listen for game win event
        document.getElementById('pong-canvas').addEventListener('game:win', (e) => {
            const winner = e.detail.player;
            const score = e.detail.score;
            
            // Player 1 is always the human player
            const isWinner = winner === 'left';
            
            const resultText = isWinner 
                ? "You Win!" 
                : (this.gameOptions.enableAI ? `AI (${this.gameOptions.aiDifficulty}) Wins!` : "Player 2 Wins!");
            
            // Update modal with results
            document.getElementById('result-message').textContent = resultText;
            document.getElementById('result-score').textContent = `${score.left} - ${score.right}`;
            
            // Record match in history if user is authenticated
            if (authService.isAuthenticated()) {
                authService.addMatchToHistory({
                    game: "Pong",
                    opponent: this.player2Name,
                    result: isWinner ? "win" : "loss",
                    score: {
                        player: score.left,
                        opponent: score.right
                    }
                });
            }
            
            // Show result modal
            this.matchResultModal.show();
        });
    }
    
    // Clean up when view is destroyed
    onDestroy() {
        if (this.pongGame) {
            this.pongGame.destroy();
            this.pongGame = null;
        }
    }
}