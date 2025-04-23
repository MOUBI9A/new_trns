/**
 * Rock Paper Scissors Game
 * Classic game with both 2-player and AI modes
 */
export default class RockPaperScissorsGame {
    constructor(canvasId) {
        // Canvas setup
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.singlePlayerMode = true; // Default to single player
        this.player1Choice = null;
        this.player2Choice = null;
        this.roundResult = null;
        this.score = { player1: 0, player2: 0 };
        this.roundCount = 0;
        this.maxRounds = 5; // Best of 5
        this.winner = null;
        
        // Choices and outcomes
        this.choices = ['rock', 'paper', 'scissors'];
        this.outcomes = {
            'rock': { beats: 'scissors', losesTo: 'paper' },
            'paper': { beats: 'rock', losesTo: 'scissors' },
            'scissors': { beats: 'paper', losesTo: 'rock' }
        };
        
        // UI elements
        this.buttonSize = 80;
        this.buttonPadding = 20;
        
        // Calculate button positions
        const startX = (this.canvas.width - (this.buttonSize * 3 + this.buttonPadding * 2)) / 2;
        const buttonY = this.canvas.height - this.buttonSize - 50;
        
        this.buttons = [
            {
                type: 'rock',
                x: startX,
                y: buttonY,
                width: this.buttonSize,
                height: this.buttonSize
            },
            {
                type: 'paper',
                x: startX + this.buttonSize + this.buttonPadding,
                y: buttonY,
                width: this.buttonSize,
                height: this.buttonSize
            },
            {
                type: 'scissors',
                x: startX + (this.buttonSize + this.buttonPadding) * 2,
                y: buttonY,
                width: this.buttonSize,
                height: this.buttonSize
            }
        ];
        
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
        if (!this.gameRunning || this.gamePaused) return;
        
        // Get click position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if player1 already made a choice and waiting for player2 (in 2P mode)
        if (!this.singlePlayerMode && this.player1Choice && !this.player2Choice) {
            for (const button of this.buttons) {
                if (
                    x >= button.x && 
                    x <= button.x + button.width && 
                    y >= button.y && 
                    y <= button.y + button.height
                ) {
                    this.player2Choice = button.type;
                    this.resolveRound();
                    break;
                }
            }
        }
        // Check if no choices made yet
        else if (!this.player1Choice) {
            for (const button of this.buttons) {
                if (
                    x >= button.x && 
                    x <= button.x + button.width && 
                    y >= button.y && 
                    y <= button.y + button.height
                ) {
                    this.player1Choice = button.type;
                    
                    // In single player mode, AI makes a choice
                    if (this.singlePlayerMode) {
                        setTimeout(() => {
                            this.makeAIChoice();
                            this.resolveRound();
                        }, 1000);
                    }
                    break;
                }
            }
        }
        // If both players made choices, click anywhere to continue to next round
        else if (this.player1Choice && this.player2Choice && this.roundResult) {
            this.prepareNextRound();
        }
    }
    
    makeAIChoice() {
        // In single player mode, randomly select an option
        const randomIndex = Math.floor(Math.random() * this.choices.length);
        this.player2Choice = this.choices[randomIndex];
    }
    
    resolveRound() {
        this.roundCount++;
        
        if (this.player1Choice === this.player2Choice) {
            this.roundResult = 'draw';
        } else if (this.outcomes[this.player1Choice].beats === this.player2Choice) {
            this.roundResult = 'player1';
            this.score.player1++;
        } else {
            this.roundResult = 'player2';
            this.score.player2++;
        }
        
        // Check if we have an overall winner
        if (this.roundCount >= this.maxRounds || 
            this.score.player1 > Math.floor(this.maxRounds / 2) || 
            this.score.player2 > Math.floor(this.maxRounds / 2)) {
            
            if (this.score.player1 > this.score.player2) {
                this.winner = 'player1';
            } else if (this.score.player2 > this.score.player1) {
                this.winner = 'player2';
            } else {
                this.winner = 'draw';
            }
            
            this.gameRunning = false;
        }
    }
    
    prepareNextRound() {
        // If game is over, do nothing
        if (!this.gameRunning) return;
        
        // Reset choices for next round
        this.player1Choice = null;
        this.player2Choice = null;
        this.roundResult = null;
    }
    
    start(singlePlayer = true) {
        // Reset game state
        this.player1Choice = null;
        this.player2Choice = null;
        this.roundResult = null;
        this.score = { player1: 0, player2: 0 };
        this.roundCount = 0;
        this.singlePlayerMode = singlePlayer;
        this.winner = null;
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
    
    drawIcon(type, x, y, size, color = '#333') {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        
        switch (type) {
            case 'rock':
                // Draw a rock (circle)
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2 - 5, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2 - 10, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
                
            case 'paper':
                // Draw a paper (rectangle)
                this.ctx.strokeRect(x + 5, y + 5, size - 10, size - 10);
                // Draw lines to represent paper
                this.ctx.beginPath();
                this.ctx.moveTo(x + 15, y + 20);
                this.ctx.lineTo(x + size - 15, y + 20);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(x + 15, y + 40);
                this.ctx.lineTo(x + size - 15, y + 40);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(x + 15, y + 60);
                this.ctx.lineTo(x + size - 15, y + 60);
                this.ctx.stroke();
                break;
                
            case 'scissors':
                // Draw scissors
                // Handle
                this.ctx.beginPath();
                this.ctx.moveTo(x + 10, y + size - 10);
                this.ctx.lineTo(x + size - 10, y + 10);
                this.ctx.stroke();
                
                // Blades
                this.ctx.beginPath();
                this.ctx.moveTo(x + size - 30, y + 10);
                this.ctx.lineTo(x + size - 10, y + 30);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(x + size - 10, y + 10);
                this.ctx.lineTo(x + size - 30, y + 30);
                this.ctx.stroke();
                break;
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw title
        this.ctx.font = '28px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Rock Paper Scissors', this.canvas.width / 2, 40);
        
        // Draw scores
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        const player1Text = 'Player 1: ' + this.score.player1;
        const player2Text = (this.singlePlayerMode ? 'Computer: ' : 'Player 2: ') + this.score.player2;
        
        this.ctx.fillText(player1Text, this.canvas.width / 4, 80);
        this.ctx.fillText(player2Text, 3 * this.canvas.width / 4, 80);
        
        // Draw round counter
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Round: ${this.roundCount} / ${this.maxRounds}`, this.canvas.width / 2, 110);
        
        // Draw choice buttons
        if (this.gameRunning && !this.player1Choice && !this.gamePaused) {
            this.ctx.font = '18px Arial';
            if (this.singlePlayerMode) {
                this.ctx.fillText('Choose your move:', this.canvas.width / 2, this.buttons[0].y - 20);
            } else {
                this.ctx.fillText('Player 1: Choose your move', this.canvas.width / 2, this.buttons[0].y - 20);
            }
            
            for (const button of this.buttons) {
                // Draw button outline
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = '#333';
                this.ctx.strokeRect(button.x, button.y, button.width, button.height);
                
                // Draw icon
                this.drawIcon(button.type, button.x, button.y, button.width);
                
                // Draw label
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    button.type.charAt(0).toUpperCase() + button.type.slice(1),
                    button.x + button.width / 2,
                    button.y + button.height + 20
                );
            }
        }
        // Player 2's turn in two-player mode
        else if (this.gameRunning && !this.singlePlayerMode && this.player1Choice && !this.player2Choice && !this.gamePaused) {
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Player 2: Choose your move', this.canvas.width / 2, this.buttons[0].y - 20);
            
            for (const button of this.buttons) {
                // Draw button outline
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = '#333';
                this.ctx.strokeRect(button.x, button.y, button.width, button.height);
                
                // Draw icon
                this.drawIcon(button.type, button.x, button.y, button.width);
                
                // Draw label
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    button.type.charAt(0).toUpperCase() + button.type.slice(1),
                    button.x + button.width / 2,
                    button.y + button.height + 20
                );
            }
        }
        
        // Draw choices and result
        if (this.player1Choice && this.player2Choice) {
            const choiceSize = 120;
            const player1X = this.canvas.width / 4 - choiceSize / 2;
            const player2X = 3 * this.canvas.width / 4 - choiceSize / 2;
            const choiceY = 150;
            
            // Draw choice background circles
            this.ctx.fillStyle = '#e9ecef';
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width / 4, choiceY + choiceSize / 2, choiceSize / 2 + 10, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(3 * this.canvas.width / 4, choiceY + choiceSize / 2, choiceSize / 2 + 10, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw player 1's choice
            this.drawIcon(this.player1Choice, player1X, choiceY, choiceSize, '#007bff');
            
            // Draw player 2's choice
            this.drawIcon(this.player2Choice, player2X, choiceY, choiceSize, '#dc3545');
            
            // Draw vs text
            this.ctx.font = '36px Arial';
            this.ctx.fillStyle = '#333';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('VS', this.canvas.width / 2, choiceY + choiceSize / 2 + 10);
            
            // Draw result
            if (this.roundResult) {
                this.ctx.font = '24px Arial';
                this.ctx.fillStyle = '#333';
                this.ctx.textAlign = 'center';
                
                let resultText = '';
                if (this.roundResult === 'draw') {
                    resultText = "It's a draw!";
                    this.ctx.fillStyle = '#6c757d';
                } else if (this.roundResult === 'player1') {
                    resultText = "Player 1 wins this round!";
                    this.ctx.fillStyle = '#007bff';
                } else {
                    resultText = this.singlePlayerMode ? 
                        "Computer wins this round!" : 
                        "Player 2 wins this round!";
                    this.ctx.fillStyle = '#dc3545';
                }
                
                this.ctx.fillText(resultText, this.canvas.width / 2, choiceY + choiceSize + 40);
                
                // Draw instruction to continue
                if (this.gameRunning) {
                    this.ctx.font = '18px Arial';
                    this.ctx.fillStyle = '#333';
                    this.ctx.fillText('Click anywhere to continue', this.canvas.width / 2, choiceY + choiceSize + 70);
                }
            }
        }
        
        // Draw game over message
        if (this.winner) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '36px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            
            let winnerText = '';
            if (this.winner === 'draw') {
                winnerText = "It's a draw!";
            } else if (this.winner === 'player1') {
                winnerText = "Player 1 wins!";
            } else {
                winnerText = this.singlePlayerMode ? "Computer wins!" : "Player 2 wins!";
            }
            
            this.ctx.fillText(winnerText, this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score.player1} - ${this.score.player2}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click "Restart" to play again', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
        
        // Draw paused message
        if (this.gamePaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '36px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Paused', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Click "Resume" to continue', this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }
} 