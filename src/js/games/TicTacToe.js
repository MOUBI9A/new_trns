/**
 * Tic Tac Toe Game
 * Classic game with both 2-player and AI modes
 */
export default class TicTacToeGame {
    constructor(canvasId) {
        // Canvas setup
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.singlePlayerMode = true; // Default to single player
        this.currentPlayer = 'X'; // X always starts
        this.winner = null;
        this.isDraw = false;
        
        // Board setup
        this.boardSize = 3;
        this.board = Array(this.boardSize * this.boardSize).fill(null);
        
        // Calculate cell size based on canvas
        this.cellSize = Math.min(
            this.canvas.width / this.boardSize,
            this.canvas.height / this.boardSize
        );
        
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
        
        // Bind methods
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        // Initialize event listeners
        this.setupEventListeners();
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
        
        // Check for win or draw
        if (this.checkWin()) {
            this.winner = this.currentPlayer;
            this.gameRunning = false;
        } else if (this.checkDraw()) {
            this.isDraw = true;
            this.gameRunning = false;
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
        
        // Simple AI: first try to find a winning move
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
        if (this.board[4] === null) {
            this.makeMove(4);
            return;
        }
        
        // Otherwise, choose a random empty cell
        const emptyCells = this.board
            .map((cell, index) => cell === null ? index : null)
            .filter(cell => cell !== null);
            
        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            this.makeMove(emptyCells[randomIndex]);
        }
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
        // Define all possible winning combinations
        const winPatterns = [
            // Rows
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            // Columns
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            // Diagonals
            [0, 4, 8], [2, 4, 6]
        ];
        
        // Check each winning pattern
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (
                this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]
            ) {
                this.winningPattern = pattern;
                return true;
            }
        }
        
        return false;
    }
    
    checkDraw() {
        // Game is a draw if all cells are filled and no winner
        return !this.board.includes(null);
    }
    
    // Method to check if game is a draw for external calls
    getIsDraw() {
        return this.isDraw;
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
        this.ctx.fillStyle = '#fff';
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
                this.ctx.strokeStyle = '#007bff'; // Blue
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
                this.ctx.strokeStyle = '#dc3545'; // Red
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
        
        // Highlight winning cells if there is a winner
        if (this.winner && this.winningPattern) {
            this.ctx.lineWidth = 5;
            this.ctx.strokeStyle = '#28a745'; // Green
            
            this.ctx.beginPath();
            const startCell = this.cellPositions[this.winningPattern[0]];
            const endCell = this.cellPositions[this.winningPattern[2]];
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