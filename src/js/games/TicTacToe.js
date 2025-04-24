/**
 * Tic Tac Toe Game
 * Classic game with both 2-player and AI modes
 */
import { gameCustomizer } from '../services/GameCustomizer.js';

export default class TicTacToeGame {
    constructor(canvasId) {
        // Canvas setup
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Load customization settings
        this.loadCustomSettings();
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.singlePlayerMode = true; // Default to single player
        this.currentPlayer = 'X'; // X always starts
        this.winner = null;
        this.isDraw = false;
        this.winningPattern = null;
        
        // Calculate cell size based on canvas
        this.cellSize = Math.min(
            this.canvas.width / this.boardSize,
            this.canvas.height / this.boardSize
        );
        
        // Initialize board and cell positions
        this.resetBoard();
        
        // Try to load sounds if available
        this.sounds = {
            place: null,
            win: null,
            draw: null
        };
        
        try {
            this.sounds.place = new Audio('../assets/sounds/ttt-place.mp3');
            this.sounds.win = new Audio('../assets/sounds/ttt-win.mp3');
            this.sounds.draw = new Audio('../assets/sounds/ttt-draw.mp3');
            // Set volume based on settings
            const volume = gameCustomizer.getSettings('global').soundVolume;
            this.updateSoundVolume(volume);
        } catch(e) {
            console.log("Sound files could not be loaded, continuing without sound");
        }
        
        // Bind methods
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        // Initialize event listeners
        this.setupEventListeners();
    }
    
    /**
     * Load customization settings for the game
     */
    loadCustomSettings() {
        const settings = gameCustomizer.getSettings('ticTacToe');
        
        // Board settings
        this.boardSize = settings.boardSize;
        this.winLength = settings.winLength;
        
        // Style settings
        this.playerXColor = settings.playerXColor;
        this.playerOColor = settings.playerOColor;
        this.backgroundColor = settings.backgroundColor;
        
        // AI settings
        this.aiDifficulty = settings.aiDifficulty;
        
        // Feature settings
        this.enableAnimations = settings.enableAnimations;
        this.enableSounds = settings.enableSounds;
        this.showHints = settings.showHints;
    }
    
    /**
     * Update the game settings
     * @param {Object} newSettings - New settings to apply
     */
    updateSettings(newSettings) {
        gameCustomizer.updateSettings('ticTacToe', newSettings);
        this.loadCustomSettings();
        
        // If board size changed, we need to reset the board
        if (newSettings.boardSize !== undefined || newSettings.winLength !== undefined) {
            this.resetBoard();
        }
    }
    
    /**
     * Update sound volume across all sound effects
     * @param {number} volume - Volume level (0 to 1)
     */
    updateSoundVolume(volume) {
        if (!this.sounds) return;
        
        Object.keys(this.sounds).forEach(key => {
            if (this.sounds[key]) {
                this.sounds[key].volume = volume;
            }
        });
    }
    
    /**
     * Initialize or reset the board and cell positions
     */
    resetBoard() {
        // Board setup based on board size
        this.board = Array(this.boardSize * this.boardSize).fill(null);
        
        // Store the cell positions for easier reference
        this.cellPositions = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.cellPositions.push({
                    x: col * this.cellSize,
                    y: row * this.cellSize,
                    width: this.cellSize,
                    height: this.cellSize
                });
            }
        }
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', this.handleCanvasClick);
    }
    
    removeEventListeners() {
        this.canvas.removeEventListener('click', this.handleCanvasClick);
    }
    
    handleCanvasClick(e) {
        if (!this.gameRunning || this.gamePaused || this.winner || this.isDraw) return;
        
        // Get click position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Find which cell was clicked
        for (let i = 0; i < this.cellPositions.length; i++) {
            const cell = this.cellPositions[i];
            if (
                x >= cell.x && 
                x <= cell.x + cell.width && 
                y >= cell.y && 
                y <= cell.y + cell.height
            ) {
                // If cell is empty, make a move
                if (this.board[i] === null) {
                    this.makeMove(i);
                    break;
                }
            }
        }
    }
    
    makeMove(cellIndex) {
        // Place current player's mark
        this.board[cellIndex] = this.currentPlayer;
        
        // Play sound effect
        if (this.enableSounds && this.sounds.place) {
            try {
                this.sounds.place.play().catch(e => console.log("Audio play failed:", e));
            } catch(e) {}
        }
        
        // Check for win or draw
        if (this.checkWin()) {
            this.winner = this.currentPlayer;
            this.gameRunning = false;
            
            // Play win sound
            if (this.enableSounds && this.sounds.win) {
                try {
                    this.sounds.win.play().catch(e => console.log("Audio play failed:", e));
                } catch(e) {}
            }
        } else if (this.checkDraw()) {
            this.isDraw = true;
            this.gameRunning = false;
            
            // Play draw sound
            if (this.enableSounds && this.sounds.draw) {
                try {
                    this.sounds.draw.play().catch(e => console.log("Audio play failed:", e));
                } catch(e) {}
            }
        } else {
            // Switch players
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            
            // If single player mode and it's O's turn, make AI move
            if (this.singlePlayerMode && this.currentPlayer === 'O') {
                setTimeout(() => {
                    this.makeAIMove();
                }, 500); // Small delay for better user experience
            }
        }
    }
    
    makeAIMove() {
        if (!this.gameRunning) return;
        
        // Different AI difficulty levels
        switch (this.aiDifficulty) {
            case 'easy':
                this.makeRandomMove();
                break;
            case 'medium':
                this.makeMediumAIMove();
                break;
            case 'hard':
                this.makeHardAIMove();
                break;
            default:
                this.makeMediumAIMove();
        }
    }
    
    // Easy AI - just makes random moves
    makeRandomMove() {
        const emptyCells = this.board
            .map((cell, index) => cell === null ? index : null)
            .filter(cell => cell !== null);
        
        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            this.makeMove(emptyCells[randomIndex]);
        }
    }
    
    // Medium AI - tries to win or block, otherwise random
    makeMediumAIMove() {
        // First try to find a winning move
        const winningMove = this.findWinningMove('O');
        if (winningMove !== -1) {
            this.makeMove(winningMove);
            return;
        }
        
        // Then try to block player's winning move
        const blockingMove = this.findWinningMove('X');
        if (blockingMove !== -1) {
            this.makeMove(blockingMove);
            return;
        }
        
        // If center is free, take it
        if (this.boardSize % 2 === 1) { // Only for odd-sized boards
            const centerIndex = Math.floor(this.board.length / 2);
            if (this.board[centerIndex] === null) {
                this.makeMove(centerIndex);
                return;
            }
        }
        
        // Otherwise, choose a random empty cell
        this.makeRandomMove();
    }
    
    // Hard AI - implements minimax algorithm for optimal play
    makeHardAIMove() {
        // Using minimax algorithm for optimal play
        let bestScore = -Infinity;
        let bestMove = -1;
        
        // For each empty cell, calculate the minimax score
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === null) {
                // Try this move
                this.board[i] = 'O';
                
                // Calculate score using minimax
                const score = this.minimax(0, false);
                
                // Undo the move
                this.board[i] = null;
                
                // Update best move if this is better
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        // Make the best move
        if (bestMove !== -1) {
            this.makeMove(bestMove);
        } else {
            // Fallback to random move if something went wrong
            this.makeRandomMove();
        }
    }
    
    // Minimax algorithm for AI decision making
    minimax(depth, isMaximizing) {
        // Check for terminal states
        const result = this.checkGameEnd();
        if (result !== null) {
            if (result === 'O') return 10 - depth; // AI wins
            if (result === 'X') return depth - 10; // Human wins
            return 0; // Draw
        }
        
        if (isMaximizing) {
            // AI's turn (maximizing)
            let bestScore = -Infinity;
            for (let i = 0; i < this.board.length; i++) {
                if (this.board[i] === null) {
                    this.board[i] = 'O';
                    bestScore = Math.max(bestScore, this.minimax(depth + 1, false));
                    this.board[i] = null;
                }
            }
            return bestScore;
        } else {
            // Human's turn (minimizing)
            let bestScore = Infinity;
            for (let i = 0; i < this.board.length; i++) {
                if (this.board[i] === null) {
                    this.board[i] = 'X';
                    bestScore = Math.min(bestScore, this.minimax(depth + 1, true));
                    this.board[i] = null;
                }
            }
            return bestScore;
        }
    }
    
    // Helper for minimax to check game result
    checkGameEnd() {
        // Check for a winner
        if (this.checkWin()) {
            return this.currentPlayer;
        }
        
        // Check for a draw
        if (this.checkDraw()) {
            return 'draw';
        }
        
        // Game is still ongoing
        return null;
    }
    
    findWinningMove(player) {
        // Check each empty cell to see if it creates a win
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === null) {
                // Temporarily place the mark
                this.board[i] = player;
                
                // Check if this creates a win
                const isWinningMove = this.checkWin();
                
                // Undo the move
                this.board[i] = null;
                
                if (isWinningMove) {
                    return i;
                }
            }
        }
        
        return -1; // No winning move found
    }
    
    checkWin() {
        // Generate all possible winning patterns based on board size and win length
        const winPatterns = this.getWinPatterns();
        
        // Check each winning pattern
        for (const pattern of winPatterns) {
            const first = this.board[pattern[0]];
            if (!first) continue; // Skip if empty
            
            let isWin = true;
            for (let i = 1; i < pattern.length; i++) {
                if (this.board[pattern[i]] !== first) {
                    isWin = false;
                    break;
                }
            }
            
            if (isWin) {
                this.winningPattern = pattern;
                return true;
            }
        }
        
        return false;
    }
    
    // Generate all possible winning patterns based on board size and win length
    getWinPatterns() {
        const patterns = [];
        
        // Rows
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col <= this.boardSize - this.winLength; col++) {
                const pattern = [];
                for (let i = 0; i < this.winLength; i++) {
                    pattern.push(row * this.boardSize + col + i);
                }
                patterns.push(pattern);
            }
        }
        
        // Columns
        for (let col = 0; col < this.boardSize; col++) {
            for (let row = 0; row <= this.boardSize - this.winLength; row++) {
                const pattern = [];
                for (let i = 0; i < this.winLength; i++) {
                    pattern.push((row + i) * this.boardSize + col);
                }
                patterns.push(pattern);
            }
        }
        
        // Diagonals (top-left to bottom-right)
        for (let row = 0; row <= this.boardSize - this.winLength; row++) {
            for (let col = 0; col <= this.boardSize - this.winLength; col++) {
                const pattern = [];
                for (let i = 0; i < this.winLength; i++) {
                    pattern.push((row + i) * this.boardSize + col + i);
                }
                patterns.push(pattern);
            }
        }
        
        // Diagonals (bottom-left to top-right)
        for (let row = this.winLength - 1; row < this.boardSize; row++) {
            for (let col = 0; col <= this.boardSize - this.winLength; col++) {
                const pattern = [];
                for (let i = 0; i < this.winLength; i++) {
                    pattern.push((row - i) * this.boardSize + col + i);
                }
                patterns.push(pattern);
            }
        }
        
        return patterns;
    }
    
    checkDraw() {
        // Game is a draw if all cells are filled and no winner
        return !this.board.includes(null);
    }
    
    // Method to check if game is a draw for external calls
    getIsDraw() {
        return this.isDraw;
    }
    
    // Get potential moves for hint feature
    getHintMoves() {
        if (!this.showHints || !this.gameRunning) return [];
        
        let hintMoves = [];
        
        // If it's the player's turn in single player mode or any turn in multiplayer
        if (!this.singlePlayerMode || this.currentPlayer === 'X') {
            // Check for winning moves
            const winningMove = this.findWinningMove(this.currentPlayer);
            if (winningMove !== -1) {
                hintMoves.push({
                    index: winningMove,
                    type: 'win'
                });
            }
            
            // Check for blocking moves
            const opponentMark = this.currentPlayer === 'X' ? 'O' : 'X';
            const blockingMove = this.findWinningMove(opponentMark);
            if (blockingMove !== -1) {
                hintMoves.push({
                    index: blockingMove,
                    type: 'block'
                });
            }
        }
        
        return hintMoves;
    }
    
    start(singlePlayer = true) {
        // Reset game state
        this.board = Array(this.boardSize * this.boardSize).fill(null);
        this.currentPlayer = 'X'; // X always starts
        this.winner = null;
        this.isDraw = false;
        this.winningPattern = null;
        this.singlePlayerMode = singlePlayer;
        this.gamePaused = false;
        
        // Start the game
        this.gameRunning = true;
        requestAnimationFrame(this.gameLoop);
    }
    
    pause() {
        if (this.gameRunning && !this.gamePaused) {
            this.gamePaused = true;
            this.draw();
        }
    }
    
    resume() {
        if (this.gameRunning && this.gamePaused) {
            this.gamePaused = false;
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    togglePause() {
        if (this.gamePaused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    
    stop() {
        this.gameRunning = false;
        this.removeEventListeners();
    }
    
    gameLoop() {
        if (this.gameRunning && !this.gamePaused) {
            this.draw();
            requestAnimationFrame(this.gameLoop);
        } else {
            this.draw();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        // Draw vertical lines
        for (let i = 1; i < this.boardSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let i = 1; i < this.boardSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // Draw X's and O's
        this.ctx.lineWidth = 3;
        const padding = this.cellSize * 0.2; // 20% padding
        
        for (let i = 0; i < this.board.length; i++) {
            const cell = this.cellPositions[i];
            const mark = this.board[i];
            
            if (mark === 'X') {
                // Draw X
                this.ctx.strokeStyle = this.playerXColor;
                this.ctx.beginPath();
                this.ctx.moveTo(cell.x + padding, cell.y + padding);
                this.ctx.lineTo(cell.x + cell.width - padding, cell.y + cell.height - padding);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(cell.x + cell.width - padding, cell.y + padding);
                this.ctx.lineTo(cell.x + padding, cell.y + cell.height - padding);
                this.ctx.stroke();
            } else if (mark === 'O') {
                // Draw O
                this.ctx.strokeStyle = this.playerOColor;
                this.ctx.beginPath();
                this.ctx.ellipse(
                    cell.x + cell.width / 2,
                    cell.y + cell.height / 2,
                    cell.width / 2 - padding,
                    cell.height / 2 - padding,
                    0, 0, 2 * Math.PI
                );
                this.ctx.stroke();
            }
        }
        
        // Draw hints if enabled
        if (this.showHints && this.gameRunning) {
            const hints = this.getHintMoves();
            for (const hint of hints) {
                const cell = this.cellPositions[hint.index];
                
                // Draw hint highlight
                this.ctx.fillStyle = hint.type === 'win' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
                this.ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
            }
        }
        
        // Highlight winning cells if there is a winner
        if (this.winner && this.winningPattern) {
            this.ctx.lineWidth = 5;
            this.ctx.strokeStyle = '#28a745'; // Green
            
            this.ctx.beginPath();
            const startCell = this.cellPositions[this.winningPattern[0]];
            const endCell = this.cellPositions[this.winningPattern[this.winningPattern.length - 1]];
            this.ctx.moveTo(startCell.x + startCell.width / 2, startCell.y + startCell.height / 2);
            this.ctx.lineTo(endCell.x + endCell.width / 2, endCell.y + endCell.height / 2);
            this.ctx.stroke();
        }
        
        // Draw status text
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#333';
        
        if (this.winner) {
            // Draw winner message
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '30px Arial';
            this.ctx.fillStyle = '#fff';
            const winnerText = this.winner === 'X' ? 'Player 1' : (this.singlePlayerMode ? 'Computer' : 'Player 2');
            this.ctx.fillText(`${winnerText} wins!`, this.canvas.width / 2, this.canvas.height / 2 - 15);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click "Restart" to play again', this.canvas.width / 2, this.canvas.height / 2 + 20);
        } else if (this.isDraw) {
            // Draw draw message
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '30px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('It\'s a draw!', this.canvas.width / 2, this.canvas.height / 2 - 15);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click "Restart" to play again', this.canvas.width / 2, this.canvas.height / 2 + 20);
        } else if (this.gamePaused) {
            // Draw pause message
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '30px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('Game Paused', this.canvas.width / 2, this.canvas.height / 2 - 15);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click "Resume" to continue', this.canvas.width / 2, this.canvas.height / 2 + 20);
        } else if (this.gameRunning) {
            // Draw current player indicator at the bottom
            const currentPlayerText = this.currentPlayer === 'X' ? 'Player 1 (X)' : (this.singlePlayerMode ? 'Computer (O)' : 'Player 2 (O)');
            this.ctx.fillText(`Current turn: ${currentPlayerText}`, this.canvas.width / 2, this.canvas.height - 20);
            
            // Draw game mode indicator at the top
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(this.singlePlayerMode ? "1P Mode" : "2P Mode", 10, 20);
        }
    }
}