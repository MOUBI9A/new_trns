/**
 * Pong Game
 * Classic arcade game with both 2-player and AI modes
 */
import { gameCustomizer } from '../services/GameCustomizer.js';

export default class PongGame {
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
        this.score = { player1: 0, player2: 0 };
        this.winner = null;
        
        // Paddles
        this.player1 = {
            x: 0,
            y: (this.canvas.height - this.paddleHeight) / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            score: 0,
            moveUp: false,
            moveDown: false
        };
        
        this.player2 = {
            x: this.canvas.width - this.paddleWidth,
            y: (this.canvas.height - this.paddleHeight) / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            score: 0,
            moveUp: false,
            moveDown: false
        };
        
        // AI properties
        this.aiUpdateInterval = 1000; // AI updates position once per second
        this.lastAiUpdate = 0;
        this.aiTargetY = this.canvas.height / 2;
        
        // Power-ups (if enabled)
        this.powerUps = [];
        this.activePowerUps = {
            player1: {},
            player2: {}
        };
        
        // Sounds (optional)
        this.sounds = {
            hit: null,
            score: null,
            powerup: null
        };
        
        // Try to load sounds if available
        try {
            this.sounds.hit = new Audio('../assets/sounds/pong-hit.mp3');
            this.sounds.score = new Audio('../assets/sounds/pong-score.mp3');
            this.sounds.powerup = new Audio('../assets/sounds/powerup.mp3');
            // Set volume based on settings
            const volume = gameCustomizer.getSettings('global').soundVolume;
            this.updateSoundVolume(volume);
        } catch(e) {
            console.log("Sound files could not be loaded, continuing without sound");
        }
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.resetBall = this.resetBall.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        // Initialize event listeners
        this.setupEventListeners();
    }
    
    /**
     * Load customization settings for the game
     */
    loadCustomSettings() {
        const settings = gameCustomizer.getSettings('pong');
        
        // Ball settings
        this.initialBallSpeed = settings.ballSpeed;
        
        // Initial ball setup
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 10,
            speed: this.initialBallSpeed,
            velocityX: this.initialBallSpeed,
            velocityY: this.initialBallSpeed,
            color: settings.ballColor,
            trail: settings.showTrails ? [] : null
        };
        
        // Paddle settings
        this.paddleHeight = settings.paddleSize;
        this.paddleWidth = 10;
        this.paddleSpeed = 8;
        this.paddleColor = settings.paddleColor;
        
        // Game settings
        this.scoreLimit = settings.scoreLimit;
        this.enablePowerUps = settings.enablePowerUps;
        this.powerUpTypes = settings.powerUpTypes;
        this.backgroundColor = settings.backgroundColor;
        this.enableSounds = settings.enableSounds;
    }
    
    /**
     * Update the game settings
     * @param {Object} newSettings - New settings to apply
     */
    updateSettings(newSettings) {
        gameCustomizer.updateSettings('pong', newSettings);
        this.loadCustomSettings();
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
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    
    removeEventListeners() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
    
    handleKeyDown(e) {
        if (!this.gameRunning) return;
        
        // Player 1 controls (W, S)
        if (e.key === 'w' || e.key === 'W') {
            this.player1.moveUp = true;
        }
        if (e.key === 's' || e.key === 'S') {
            this.player1.moveDown = true;
        }
        
        // Player 2 controls (Up, Down) - only in 2P mode
        if (!this.singlePlayerMode) {
            if (e.key === 'ArrowUp') {
                this.player2.moveUp = true;
                e.preventDefault(); // Prevent scrolling with arrow keys
            }
            if (e.key === 'ArrowDown') {
                this.player2.moveDown = true;
                e.preventDefault(); // Prevent scrolling with arrow keys
            }
        }
    }
    
    handleKeyUp(e) {
        // Player 1 controls (W, S)
        if (e.key === 'w' || e.key === 'W') {
            this.player1.moveUp = false;
        }
        if (e.key === 's' || e.key === 'S') {
            this.player1.moveDown = false;
        }
        
        // Player 2 controls (Up, Down)
        if (e.key === 'ArrowUp') {
            this.player2.moveUp = false;
            e.preventDefault(); // Prevent scrolling with arrow keys
        }
        if (e.key === 'ArrowDown') {
            this.player2.moveDown = false;
            e.preventDefault(); // Prevent scrolling with arrow keys
        }
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        
        // Randomize direction
        this.ball.velocityX = -this.ball.velocityX;
        this.ball.velocityY = Math.random() * 10 - 5; // Random Y velocity between -5 and 5
        
        // Reset ball trail if enabled
        if (this.ball.trail) {
            this.ball.trail = [];
        }
    }
    
    updateAI(timestamp) {
        // Only update AI decision once per second
        if (timestamp - this.lastAiUpdate >= this.aiUpdateInterval) {
            this.lastAiUpdate = timestamp;
            
            // Simple AI: track the ball's y position
            this.aiTargetY = this.ball.y;
        }
        
        // Move paddle toward target position
        const paddleCenter = this.player2.y + (this.player2.height / 2);
        
        // Add some buffering to prevent jittery movement
        if (paddleCenter < this.aiTargetY - 10) {
            this.player2.moveUp = false;
            this.player2.moveDown = true;
        } else if (paddleCenter > this.aiTargetY + 10) {
            this.player2.moveUp = true;
            this.player2.moveDown = false;
        } else {
            this.player2.moveUp = false;
            this.player2.moveDown = false;
        }
    }
    
    updatePaddles() {
        // Apply any active power-ups
        const p1SpeedMult = this.activePowerUps.player1.speed ? 1.5 : 1;
        const p2SpeedMult = this.activePowerUps.player2.speed ? 1.5 : 1;
        const p1Frozen = this.activePowerUps.player1.freeze ? true : false;
        const p2Frozen = this.activePowerUps.player2.freeze ? true : false;
        
        // Player 1 paddle movement
        if (!p1Frozen) {
            if (this.player1.moveUp && this.player1.y > 0) {
                this.player1.y -= this.paddleSpeed * p1SpeedMult;
            }
            if (this.player1.moveDown && this.player1.y < this.canvas.height - this.player1.height) {
                this.player1.y += this.paddleSpeed * p1SpeedMult;
            }
        }
        
        // Player 2 paddle movement
        if (!p2Frozen) {
            if (this.player2.moveUp && this.player2.y > 0) {
                this.player2.y -= this.paddleSpeed * p2SpeedMult;
            }
            if (this.player2.moveDown && this.player2.y < this.canvas.height - this.player2.height) {
                this.player2.y += this.paddleSpeed * p2SpeedMult;
            }
        }
    }
    
    /**
     * Update and check for power-up collisions
     */
    updatePowerUps() {
        if (!this.enablePowerUps) return;
        
        // Random chance to spawn a power-up
        if (Math.random() < 0.002 && this.powerUps.length < 3) {
            const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];
            this.powerUps.push({
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                radius: 15,
                type: type,
                active: true,
                duration: 5000, // 5 seconds
                startTime: null
            });
        }
        
        // Check for ball collision with power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (!powerUp.active) continue;
            
            // Check collision with ball
            const dx = powerUp.x - this.ball.x;
            const dy = powerUp.y - this.ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < powerUp.radius + this.ball.radius) {
                // Determine which player gets the power-up based on ball direction
                const targetPlayer = this.ball.velocityX > 0 ? 'player1' : 'player2';
                
                // Activate power-up
                powerUp.active = false;
                this.activePowerUps[targetPlayer][powerUp.type] = true;
                powerUp.startTime = performance.now();
                
                // Play sound
                if (this.enableSounds && this.sounds.powerup) {
                    try {
                        this.sounds.powerup.play().catch(e => console.log("Audio play failed:", e));
                    } catch(e) {}
                }
                
                // Handle size power-up immediately
                if (powerUp.type === 'size') {
                    if (targetPlayer === 'player1') {
                        this.player1.height = this.paddleHeight * 1.5;
                    } else {
                        this.player2.height = this.paddleHeight * 1.5;
                    }
                }
            }
        }
        
        // Update active power-ups and remove expired ones
        const now = performance.now();
        for (const player of ['player1', 'player2']) {
            for (const powerUp of this.powerUps) {
                if (!powerUp.active && powerUp.startTime && now - powerUp.startTime > powerUp.duration) {
                    // Reset power-up effects
                    if (powerUp.type === 'size') {
                        if (player === 'player1') {
                            this.player1.height = this.paddleHeight;
                        } else {
                            this.player2.height = this.paddleHeight;
                        }
                    }
                    this.activePowerUps[player][powerUp.type] = false;
                    
                    // Remove this power-up
                    const index = this.powerUps.indexOf(powerUp);
                    if (index !== -1) {
                        this.powerUps.splice(index, 1);
                    }
                }
            }
        }
    }
    
    updateBall() {
        // Update ball trail if enabled
        if (this.ball.trail) {
            this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
            // Keep trail at reasonable length
            if (this.ball.trail.length > 10) {
                this.ball.trail.shift();
            }
        }
        
        // Ball movement
        this.ball.x += this.ball.velocityX;
        this.ball.y += this.ball.velocityY;
        
        // Ceiling and floor collision
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.velocityY = -this.ball.velocityY;
            
            // Play hit sound
            if (this.enableSounds && this.sounds.hit) {
                try {
                    this.sounds.hit.play().catch(e => console.log("Audio play failed:", e));
                } catch(e) {}
            }
        }
        
        // Check which player the ball is heading towards
        const player = this.ball.velocityX < 0 ? this.player1 : this.player2;
        
        // Paddle collision detection
        if (this.ball.x - this.ball.radius < player.x + player.width && 
            this.ball.x + this.ball.radius > player.x && 
            this.ball.y > player.y && 
            this.ball.y < player.y + player.height) {
            
            // Calculate collision point on paddle (normalized from -1 to 1)
            const collidePoint = (this.ball.y - (player.y + player.height / 2)) / (player.height / 2);
            
            // Calculate angle of reflection (pi/4 = 45 degrees)
            const angleRad = collidePoint * Math.PI / 4;
            
            // Calculate direction based on which player hit the ball
            const direction = this.ball.velocityX < 0 ? 1 : -1;
            
            // Change velocity based on which paddle was hit
            this.ball.velocityX = direction * this.ball.speed * Math.cos(angleRad);
            this.ball.velocityY = this.ball.speed * Math.sin(angleRad);
            
            // Increase speed slightly after each hit
            this.ball.speed += 0.2;
            
            // Play hit sound
            if (this.enableSounds && this.sounds.hit) {
                try {
                    this.sounds.hit.play().catch(e => console.log("Audio play failed:", e));
                } catch(e) {}
            }
        }
        
        // Score points when ball goes past paddle
        if (this.ball.x - this.ball.radius < 0) {
            // Player 2 scores
            this.score.player2++;
            
            // Play score sound
            if (this.enableSounds && this.sounds.score) {
                try {
                    this.sounds.score.play().catch(e => console.log("Audio play failed:", e));
                } catch(e) {}
            }
            
            this.resetBall();
        } else if (this.ball.x + this.ball.radius > this.canvas.width) {
            // Player 1 scores
            this.score.player1++;
            
            // Play score sound
            if (this.enableSounds && this.sounds.score) {
                try {
                    this.sounds.score.play().catch(e => console.log("Audio play failed:", e));
                } catch(e) {}
            }
            
            this.resetBall();
        }
        
        // Check for winner (based on score limit from settings)
        if (this.score.player1 >= this.scoreLimit) {
            this.winner = "Player 1";
            this.gameRunning = false;
        } else if (this.score.player2 >= this.scoreLimit) {
            this.winner = this.singlePlayerMode ? "Computer" : "Player 2";
            this.gameRunning = false;
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw court divider
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 15]);
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw paddles
        this.ctx.fillStyle = this.paddleColor;
        // Draw with special effects if power-ups are active
        if (this.activePowerUps.player1.freeze) {
            this.ctx.fillStyle = '#00ffff'; // Ice blue for frozen
        } else if (this.activePowerUps.player1.speed) {
            this.ctx.fillStyle = '#ffff00'; // Yellow for speed boost
        }
        this.ctx.fillRect(this.player1.x, this.player1.y, this.player1.width, this.player1.height);
        
        // Reset color for player 2
        this.ctx.fillStyle = this.paddleColor;
        if (this.activePowerUps.player2.freeze) {
            this.ctx.fillStyle = '#00ffff';
        } else if (this.activePowerUps.player2.speed) {
            this.ctx.fillStyle = '#ffff00';
        }
        this.ctx.fillRect(this.player2.x, this.player2.y, this.player2.width, this.player2.height);
        
        // Draw ball trail if enabled
        if (this.ball.trail) {
            for (let i = 0; i < this.ball.trail.length; i++) {
                const point = this.ball.trail[i];
                const alpha = i / this.ball.trail.length; // Fade out older points
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, this.ball.radius * (0.5 + alpha * 0.5), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
                this.ctx.fill();
                this.ctx.closePath();
            }
        }
        
        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.ball.color;
        this.ctx.fill();
        this.ctx.closePath();
        
        // Draw power-ups
        if (this.enablePowerUps) {
            this.powerUps.forEach(powerUp => {
                if (!powerUp.active) return;
                
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
                
                // Different colors for different power-up types
                switch(powerUp.type) {
                    case 'speed':
                        this.ctx.fillStyle = '#ffff00';
                        break;
                    case 'size':
                        this.ctx.fillStyle = '#00ff00';
                        break;
                    case 'freeze':
                        this.ctx.fillStyle = '#00ffff';
                        break;
                    default:
                        this.ctx.fillStyle = '#ffffff';
                }
                
                this.ctx.fill();
                this.ctx.closePath();
                
                // Draw power-up icon or text
                this.ctx.font = '12px Arial';
                this.ctx.fillStyle = '#000';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(powerUp.type.charAt(0).toUpperCase(), powerUp.x, powerUp.y + 4);
            });
        }
        
        // Draw score
        this.ctx.font = '48px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.score.player1, this.canvas.width / 4, 60);
        this.ctx.fillText(this.score.player2, 3 * this.canvas.width / 4, 60);
        
        // Draw winner message
        if (this.winner) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '36px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${this.winner} wins!`, this.canvas.width / 2, this.canvas.height / 2 - 30);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Click "Restart" to play again', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
        
        // Draw game mode indicator
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.singlePlayerMode ? "1P Mode" : "2P Mode", 10, 20);
        
        // Draw controls info
        this.ctx.font = '14px Arial';
        this.ctx.fillText("Player 1: W/S", 10, this.canvas.height - 30);
        
        if (!this.singlePlayerMode) {
            this.ctx.textAlign = 'right';
            this.ctx.fillText("Player 2: ↑/↓", this.canvas.width - 10, this.canvas.height - 30);
        }
        
        // Draw paused message if game is paused
        if (this.gamePaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '36px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Paused', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Click "Resume" to continue', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
    }
    
    gameLoop(timestamp) {
        if (this.gameRunning && !this.gamePaused) {
            // Update game state
            this.updatePaddles();
            
            // In single player mode, update AI
            if (this.singlePlayerMode) {
                this.updateAI(timestamp);
            }
            
            this.updateBall();
            
            // Update power-ups if enabled
            if (this.enablePowerUps) {
                this.updatePowerUps();
            }
            
            // Draw everything
            this.draw();
            
            // Continue the loop
            requestAnimationFrame(this.gameLoop);
        } else {
            // If game is not running or is paused, just draw the current state
            this.draw();
        }
    }
    
    start(singlePlayer = true) {
        // Reset game state
        this.score = { player1: 0, player2: 0 };
        this.winner = null;
        this.singlePlayerMode = singlePlayer;
        this.gamePaused = false;
        
        // Reset power-ups
        this.powerUps = [];
        this.activePowerUps = {
            player1: {},
            player2: {}
        };
        
        // Reset paddles
        this.player1.y = (this.canvas.height - this.paddleHeight) / 2;
        this.player1.height = this.paddleHeight;
        this.player2.y = (this.canvas.height - this.paddleHeight) / 2;
        this.player2.height = this.paddleHeight;
        
        // Reset ball and its speed (fixes issue with restart)
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.speed = this.initialBallSpeed; // Reset to initial speed
        this.ball.velocityX = this.initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
        this.ball.velocityY = this.initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
        if (this.ball.trail) {
            this.ball.trail = [];
        }
        
        // Start the game
        this.gameRunning = true;
        requestAnimationFrame(this.gameLoop);
    }
    
    pause() {
        if (this.gameRunning && !this.gamePaused) {
            this.gamePaused = true;
            // Draw pause indicator
            this.draw();
        }
    }
    
    resume() {
        if (this.gameRunning && this.gamePaused) {
            this.gamePaused = false;
            // Resume game loop
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
        this.gamePaused = false;
        this.removeEventListeners();
    }
}