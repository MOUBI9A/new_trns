import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';
import TicTacToe from '../games/TicTacToe.js';

export default class TicTacToeGameView extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Tic Tac Toe');
        this.tttGame = null;
    }
    
    async getHtml() {
        return `
            <div class="view-container fade-in">
                <h1 class="section-title">Tic Tac Toe</h1>
                
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
                        </div>
                        
                        <div class="ttt-container text-center">
                            <canvas id="ttt-canvas" width="450" height="450" class="border"></canvas>
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
                                <li>Click on a cell to place your mark (X or O)</li>
                                <li>First player to align three of their marks in a row, column, or diagonal wins</li>
                                <li>If all cells are filled without a winner, the game ends in a draw</li>
                                <li>In single-player mode, you play against the computer AI</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    afterRender() {
        // Initialize game object
        this.tttGame = new TicTacToe('ttt-canvas');
        
        // Draw initial canvas state
        this.tttGame.draw();
        
        // Set up button event listeners
        const singlePlayerBtn = document.getElementById('singleplayer-btn');
        const multiPlayerBtn = document.getElementById('multiplayer-btn');
        const player2Input = document.getElementById('player2-input');
        const player2NameInput = document.getElementById('player2-name');
        const startGameBtn = document.getElementById('start-game-btn');
        const restartGameBtn = document.getElementById('restart-game-btn');
        
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
            this.tttGame.start(singlePlayerMode);
            
            // Set opponent name for match history
            this.player2Name = singlePlayerMode ? "Computer" : 
                (player2NameInput.value.trim() || "Player 2");
            
            // Track game in user history
            if (authService.isAuthenticated()) {
                authService.addGameToHistory({
                    title: "Tic Tac Toe",
                    mode: singlePlayerMode ? "Single Player" : "Two Players",
                    score: 0
                });
                
                // Override the game's checkWin method to record match
                const originalCheckWin = this.tttGame.checkWin;
                this.tttGame.checkWin = () => {
                    const result = originalCheckWin.call(this.tttGame);
                    
                    // Only record results if the game is actually over
                    if ((result || this.tttGame.getIsDraw()) && !this.tttGame.gameRunning) {
                        setTimeout(() => {
                            this.recordMatchResult(result, singlePlayerMode);
                        }, 500);
                    }
                    
                    return result;
                };
            }
        });
        
        // Restart game
        restartGameBtn.addEventListener('click', () => {
            const singlePlayerMode = singlePlayerBtn.classList.contains('active');
            this.tttGame.start(singlePlayerMode);
            
            // Set opponent name for match history
            this.player2Name = singlePlayerMode ? "Computer" : 
                (player2NameInput.value.trim() || "Player 2");
        });
    }
    
    // Record match result for authenticated users
    recordMatchResult(winner, singlePlayerMode) {
        if (!authService.isAuthenticated()) return;
        
        let resultMessage = '';
        let matchResult = '';
        
        if (winner) {
            const isPlayer1Winner = winner === 'X'; // Player 1 is X
            resultMessage = isPlayer1Winner ? "You Win!" : (singlePlayerMode ? "Computer Wins!" : "Player 2 Wins!");
            matchResult = isPlayer1Winner ? "win" : "loss";
        } else {
            resultMessage = "It's a Draw!";
            matchResult = "draw";
        }
        
        // Update modal with results
        document.getElementById('result-message').textContent = resultMessage;
        
        // Record match in history
        authService.addMatchToHistory({
            game: "Tic Tac Toe",
            opponent: this.player2Name,
            result: matchResult,
            score: {
                player1: winner === 'X' ? 1 : 0,
                player2: winner === 'O' ? 1 : 0
            }
        });
        
        // Show match result modal
        this.matchResultModal.show();
    }
    
    // Clean up when view is destroyed
    onDestroy() {
        if (this.tttGame) {
            this.tttGame.stop();
        }
    }
} 