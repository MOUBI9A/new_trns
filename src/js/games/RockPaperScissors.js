/**
 * Rock Paper Scissors Game
 * Classic game with both 2-player and AI modes
 */
import { gameCustomizer } from '../services/GameCustomizer.js';

export default class RockPaperScissorsGame {
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
        this.player1Choice = null;
        this.player2Choice = null;
        this.roundResult = null;
        this.score = { player1: 0, player2: 0 };
        this.roundCount = 0;
        this.winner = null;
        
        // UI elements
        this.buttonSize = 80;
        this.buttonPadding = 20;
        
        // Calculate button positions
        const startX = (this.canvas.width - (this.buttonSize * this.choices.length + this.buttonPadding * (this.choices.length - 1))) / 2;
        const buttonY = this.canvas.height - this.buttonSize - 50;
        
        this.buttons = this.choices.map((type, index) => ({
            type,
            x: startX + index * (this.buttonSize + this.buttonPadding),
            y: buttonY,
            width: this.buttonSize,
            height: this.buttonSize
        }));
        
        // Try to load sounds if available
        this.sounds = {
            select: null,
            win: null,
            lose: null,
            draw: null
        };
        
        try {
            this.sounds.select = new Audio('../assets/sounds/rps-select.mp3');
            this.sounds.win = new Audio('../assets/sounds/rps-win.mp3');
            this.sounds.lose = new Audio('../assets/sounds/rps-lose.mp3');
            this.sounds.draw = new Audio('../assets/sounds/rps-draw.mp3');
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
        const settings = gameCustomizer.getSettings('rockPaperScissors');
        
        // Game settings
        this.maxRounds = settings.rounds;
        this.enableSounds = settings.enableSounds;
        this.enableAnimations = settings.enableAnimations;
        this.showHints = settings.showHints;
        
        // Style settings
        this.player1Color = settings.playerOneColor;
        this.player2Color = settings.playerTwoColor;
        this.backgroundColor = settings.backgroundColor;
        
        // Game options
        this.enableExtendedOptions = settings.enableExtendedOptions;
        this.choices = settings.enableExtendedOptions ? 
            settings.extendedOptions : 
            settings.standardOptions;
        
        // Set up outcomes based on current choices
        this.setupOutcomes();
    }
    
    /**
     * Set up win/lose relationships between choices
     */
    setupOutcomes() {
        this.outcomes = {};
        
        // Standard Rock Paper Scissors rules
        this.outcomes.rock = { beats: ['scissors'], losesTo: ['paper'] };
        this.outcomes.paper = { beats: ['rock'], losesTo: ['scissors'] };
        this.outcomes.scissors = { beats: ['paper'], losesTo: ['rock'] };
        
        // Extended rules for Rock Paper Scissors Lizard Spock
        if (this.enableExtendedOptions) {
            this.outcomes.rock.beats.push('lizard');
            this.outcomes.rock.losesTo.push('spock');
            
            this.outcomes.paper.beats.push('spock');
            this.outcomes.paper.losesTo.push('lizard');
            
            this.outcomes.scissors.beats.push('lizard');
            this.outcomes.scissors.losesTo.push('spock');
            
            this.outcomes.lizard = { 
                beats: ['paper', 'spock'], 
                losesTo: ['rock', 'scissors'] 
            };
            
            this.outcomes.spock = { 
                beats: ['scissors', 'rock'], 
                losesTo: ['paper', 'lizard'] 
            };
        }
    }
    
    /**
     * Update the game settings
     * @param {Object} newSettings - New settings to apply
     */
    updateSettings(newSettings) {
        gameCustomizer.updateSettings('rockPaperScissors', newSettings);
        this.loadCustomSettings();
        
        // If we changed from standard to extended options or vice versa, we need to recalculate button positions
        if (newSettings.enableExtendedOptions !== undefined) {
            // Calculate button positions
            const startX = (this.canvas.width - (this.buttonSize * this.choices.length + this.buttonPadding * (this.choices.length - 1))) / 2;
            const buttonY = this.canvas.height - this.buttonSize - 50;
            
            this.buttons = this.choices.map((type, index) => ({
                type,
                x: startX + index * (this.buttonSize + this.buttonPadding),
                y: buttonY,
                width: this.buttonSize,
                height: this.buttonSize
            }));
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
            
            // Play draw sound
            if (this.enableSounds && this.sounds.draw) {
                try {
                    this.sounds.draw.play().catch(e => console.log("Audio play failed:", e));
                } catch(e) {}
            }
        } else if (this.outcomes[this.player1Choice].beats.includes(this.player2Choice)) {
            this.roundResult = 'player1';
            this.score.player1++;
            
            // Play win sound for player 1
            if (this.enableSounds && this.sounds.win) {
                try {
                    this.sounds.win.play().catch(e => console.log("Audio play failed:", e));
                } catch(e) {}
            }
        } else {
            this.roundResult = 'player2';
            this.score.player2++;
            
            // Play lose sound for player 1
            if (this.enableSounds && this.sounds.lose) {
                try {
                    this.sounds.lose.play().catch(e => console.log("Audio play failed:", e));
                } catch(e) {}
            }
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
                
            case 'lizard':
                // Draw lizard (diamond shape with eye)
                this.ctx.beginPath();
                this.ctx.moveTo(x + size/2, y + 10);
                this.ctx.lineTo(x + size - 10, y + size/2);
                this.ctx.lineTo(x + size/2, y + size - 10);
                this.ctx.lineTo(x + 10, y + size/2);
                this.ctx.closePath();
                this.ctx.stroke();
                
                // Eye
                this.ctx.beginPath();
                this.ctx.arc(x + size/2 - 10, y + size/2 - 10, 5, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Tongue
                this.ctx.beginPath();
                this.ctx.moveTo(x + size/2, y + size/2 + 15);
                this.ctx.lineTo(x + size/2 + 10, y + size/2 + 25);
                this.ctx.stroke();
                break;
                
            case 'spock':
                // Draw Spock (hand shape)
                this.ctx.beginPath();
                
                // Palm
                this.ctx.moveTo(x + size/4, y + size - 10);
                this.ctx.lineTo(x + 3*size/4, y + size - 10);
                this.ctx.lineTo(x + 3*size/4, y + 2*size/3);
                this.ctx.lineTo(x + size/4, y + 2*size/3);
                this.ctx.closePath();
                this.ctx.stroke();
                
                // Fingers
                // Index and middle
                this.ctx.beginPath();
                this.ctx.moveTo(x + size/3, y + 2*size/3);
                this.ctx.lineTo(x + size/3, y + size/4);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(x + size/2, y + 2*size/3);
                this.ctx.lineTo(x + size/2, y + size/5);
                this.ctx.stroke();
                
                // Ring and pinky
                this.ctx.beginPath();
                this.ctx.moveTo(x + 2*size/3, y + 2*size/3);
                this.ctx.lineTo(x + 2*size/3, y + size/3);
                this.ctx.stroke();
                
                // Thumb
                this.ctx.beginPath();
                this.ctx.moveTo(x + size/4, y + 2*size/3);
                this.ctx.lineTo(x + 10, y + size/2);
                this.ctx.stroke();
                break;
        }
    }
    
    draw() {
        // Clear canvas with customized background color
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw title
        this.ctx.font = '28px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        const titleText = this.enableExtendedOptions ? 
            'Rock Paper Scissors Lizard Spock' : 
            'Rock Paper Scissors';
        this.ctx.fillText(titleText, this.canvas.width / 2, 40);
        
        // Draw scores
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        const player1Text = 'Player 1: ' + this.score.player1;
        const player2Text = (this.singlePlayerMode ? 'Computer: ' : 'Player 2: ') + this.score.player2;
        
        this.ctx.fillStyle = this.player1Color;
        this.ctx.fillText(player1Text, this.canvas.width / 4, 80);
        
        this.ctx.fillStyle = this.player2Color;
        this.ctx.fillText(player2Text, 3 * this.canvas.width / 4, 80);
        
        // Draw round counter
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#333';
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
                
                // Draw hints if enabled
                if (this.showHints) {
                    this.ctx.font = '12px Arial';
                    let hintText = "";
                    switch(button.type) {
                        case 'rock':
                            hintText = this.enableExtendedOptions ? 
                                "Crushes scissors & lizard" : 
                                "Crushes scissors";
                            break;
                        case 'paper':
                            hintText = this.enableExtendedOptions ? 
                                "Covers rock & disproves Spock" : 
                                "Covers rock";
                            break;
                        case 'scissors':
                            hintText = this.enableExtendedOptions ? 
                                "Cuts paper & decapitates lizard" : 
                                "Cuts paper";
                            break;
                        case 'lizard':
                            hintText = "Eats paper & poisons Spock";
                            break;
                        case 'spock':
                            hintText = "Smashes scissors & vaporizes rock";
                            break;
                    }
                    this.ctx.fillText(hintText, button.x + button.width / 2, button.y + button.height + 40);
                }
            }
        }
        // Player 2's turn in two-player mode
        else if (this.gameRunning && !this.singlePlayerMode && this.player1Choice && !this.player2Choice && !this.gamePaused) {
            this.ctx.font = '18px Arial';
            this.ctx.fillStyle = '#333';
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
                
                // Draw hints if enabled (same as above)
                if (this.showHints) {
                    this.ctx.font = '12px Arial';
                    let hintText = "";
                    switch(button.type) {
                        case 'rock':
                            hintText = this.enableExtendedOptions ? 
                                "Crushes scissors & lizard" : 
                                "Crushes scissors";
                            break;
                        case 'paper':
                            hintText = this.enableExtendedOptions ? 
                                "Covers rock & disproves Spock" : 
                                "Covers rock";
                            break;
                        case 'scissors':
                            hintText = this.enableExtendedOptions ? 
                                "Cuts paper & decapitates lizard" : 
                                "Cuts paper";
                            break;
                        case 'lizard':
                            hintText = "Eats paper & poisons Spock";
                            break;
                        case 'spock':
                            hintText = "Smashes scissors & vaporizes rock";
                            break;
                    }
                    this.ctx.fillText(hintText, button.x + button.width / 2, button.y + button.height + 40);
                }
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
            
            // Draw player 1's choice with customized color
            this.drawIcon(this.player1Choice, player1X, choiceY, choiceSize, this.player1Color);
            
            // Draw player 2's choice with customized color
            this.drawIcon(this.player2Choice, player2X, choiceY, choiceSize, this.player2Color);
            
            // Draw vs text
            this.ctx.font = '36px Arial';
            this.ctx.fillStyle = '#333';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('VS', this.canvas.width / 2, choiceY + choiceSize / 2 + 10);
            
            // Draw result
            if (this.roundResult) {
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                
                let resultText = '';
                if (this.roundResult === 'draw') {
                    resultText = "It's a draw!";
                    this.ctx.fillStyle = '#6c757d';
                } else if (this.roundResult === 'player1') {
                    resultText = "Player 1 wins this round!";
                    this.ctx.fillStyle = this.player1Color;
                } else {
                    resultText = this.singlePlayerMode ? 
                        "Computer wins this round!" : 
                        "Player 2 wins this round!";
                    this.ctx.fillStyle = this.player2Color;
                }
                
                this.ctx.fillText(resultText, this.canvas.width / 2, choiceY + choiceSize + 40);
                
                // Draw instruction to continue
                if (this.gameRunning) {
                    this.ctx.font = '18px Arial';
                    this.ctx.fillStyle = '#333';
                    this.ctx.fillText('Click anywhere to continue', this.canvas.width / 2, choiceY + choiceSize + 70);
                }
                
                // Show reason for win if animations enabled
                if (this.enableAnimations && this.roundResult !== 'draw') {
                    const winner = this.roundResult === 'player1' ? this.player1Choice : this.player2Choice;
                    const loser = this.roundResult === 'player1' ? this.player2Choice : this.player1Choice;
                    
                    let reasonText = "";
                    
                    // Create reason text based on what beats what
                    switch(winner) {
                        case 'rock':
                            reasonText = loser === 'scissors' ? "Rock crushes Scissors" : "Rock crushes Lizard";
                            break;
                        case 'paper':
                            reasonText = loser === 'rock' ? "Paper covers Rock" : "Paper disproves Spock";
                            break;
                        case 'scissors':
                            reasonText = loser === 'paper' ? "Scissors cut Paper" : "Scissors decapitate Lizard";
                            break;
                        case 'lizard':
                            reasonText = loser === 'paper' ? "Lizard eats Paper" : "Lizard poisons Spock";
                            break;
                        case 'spock':
                            reasonText = loser === 'scissors' ? "Spock smashes Scissors" : "Spock vaporizes Rock";
                            break;
                    }
                    
                    this.ctx.font = '20px Arial';
                    this.ctx.fillStyle = this.roundResult === 'player1' ? this.player1Color : this.player2Color;
                    this.ctx.fillText(reasonText, this.canvas.width / 2, choiceY + choiceSize + 100);
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