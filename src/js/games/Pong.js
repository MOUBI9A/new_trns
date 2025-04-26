/**
 * Classic Pong Game
 * A vanilla JavaScript implementation of the classic Pong arcade game
 */

class Pong {
    constructor(canvasId, options = {}) {
        // Get the canvas and context
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Default game settings
        this.settings = {
            ballSpeed: 5,
            paddleSpeed: 8,
            paddleSize: 100,
            scoreLimit: 5,
            ballColor: '#ffffff',
            paddleColor: '#ffffff',
            backgroundColor: '#000000',
            enableSounds: true,
            enableAI: false, // AI opponent setting
            aiDifficulty: 'medium', // 'easy', 'medium', 'hard'
            ...options
        };
        
        // Game state
        this.state = {
            playing: false,
            paused: false,
            scoreLeft: 0,
            scoreRight: 0,
            winner: null
        };
        
        // Game objects
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 10,
            speedX: this.settings.ballSpeed,
            speedY: this.settings.ballSpeed / 2
        };
        
        this.paddleLeft = {
            x: 20,
            y: this.canvas.height / 2 - this.settings.paddleSize / 2,
            width: 10,
            height: this.settings.paddleSize,
            speed: this.settings.paddleSpeed,
            moveUp: false,
            moveDown: false
        };
        
        this.paddleRight = {
            x: this.canvas.width - 30,
            y: this.canvas.height / 2 - this.settings.paddleSize / 2,
            width: 10,
            height: this.settings.paddleSize,
            speed: this.settings.paddleSpeed,
            moveUp: false,
            moveDown: false
        };
        
        // AI state
        this.ai = {
            lastUpdateTime: 0,
            updateInterval: 1000, // Update AI decision once per second
            targetY: this.canvas.height / 2,
            reactionDelay: 200, // ms delay before reacting to ball position
            lastBallY: this.canvas.height / 2,
            predictionAccuracy: 0.85, // How accurately the AI predicts ball movement (0-1)
        };

        // Set difficulty-based AI properties
        this.setAIDifficulty(this.settings.aiDifficulty);
        
        // Sound effects
        this.sounds = {
            paddleHit: new Audio('/src/assets/audio/paddle-hit.mp3'),
            wallHit: new Audio('/src/assets/audio/wall-hit.mp3'),
            score: new Audio('/src/assets/audio/score.mp3')
        };
        
        // Create fallback sounds if audio files can't be loaded
        this.setupFallbackSounds();
        
        // Initialize game
        this.setupEventListeners();
        this.resizeCanvas();
        
        // Animation frame ID for later cancellation
        this.animationFrameId = null;
    }
    
    /**
     * Set AI difficulty parameters
     */
    setAIDifficulty(difficulty) {
        switch(difficulty) {
            case 'easy':
                this.ai.updateInterval = 1000; // Slower updates
                this.ai.reactionDelay = 500;  // Slower reactions
                this.ai.predictionAccuracy = 0.5; // Less accurate predictions
                break;
            case 'medium':
                this.ai.updateInterval = 500;
                this.ai.reactionDelay = 200;
                this.ai.predictionAccuracy = 0.75;
                break;
            case 'hard':
                this.ai.updateInterval = 200; // Faster updates
                this.ai.reactionDelay = 100;  // Faster reactions
                this.ai.predictionAccuracy = 0.9; // More accurate predictions
                break;
            default:
                this.ai.updateInterval = 500;
                this.ai.reactionDelay = 200;
                this.ai.predictionAccuracy = 0.75;
        }
    }
    
    /**
     * Create fallback sounds using AudioContext API if audio files can't be loaded
     */
    setupFallbackSounds() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            
            // Function to create a basic sound effect
            const createBeep = (frequency, duration, type = 'sine') => {
                return () => {
                    if (!this.settings.enableSounds) return;
                    
                    const oscillator = this.audioCtx.createOscillator();
                    const gain = this.audioCtx.createGain();
                    
                    oscillator.type = type;
                    oscillator.frequency.value = frequency;
                    oscillator.connect(gain);
                    
                    gain.connect(this.audioCtx.destination);
                    gain.gain.value = 0.1;
                    
                    oscillator.start();
                    
                    setTimeout(() => {
                        oscillator.stop();
                    }, duration);
                };
            };
            
            // Set up fallback sound functions
            this.playPaddleHitSound = () => {
                if (this.settings.enableSounds) {
                    try {
                        this.sounds.paddleHit.play().catch(() => {
                            createBeep(300, 50, 'triangle')();
                        });
                    } catch (e) {
                        createBeep(300, 50, 'triangle')();
                    }
                }
            };
            
            this.playWallHitSound = () => {
                if (this.settings.enableSounds) {
                    try {
                        this.sounds.wallHit.play().catch(() => {
                            createBeep(200, 50, 'sine')();
                        });
                    } catch (e) {
                        createBeep(200, 50, 'sine')();
                    }
                }
            };
            
            this.playScoreSound = () => {
                if (this.settings.enableSounds) {
                    try {
                        this.sounds.score.play().catch(() => {
                            createBeep(500, 100, 'sawtooth')();
                        });
                    } catch (e) {
                        createBeep(500, 100, 'sawtooth')();
                    }
                }
            };
        } catch (e) {
            console.error('Web Audio API not supported. Sound disabled.');
            
            // Create empty sound functions
            this.playPaddleHitSound = () => {};
            this.playWallHitSound = () => {};
            this.playScoreSound = () => {};
        }
    }
    
    /**
     * Set up event listeners for keyboard controls
     */
    setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        window.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Touch controls for mobile
        this.setupTouchControls();
    }
    
    /**
     * Handle key down events
     */
    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        
        // Left paddle controls (W, S)
        if (key === 'w') {
            this.paddleLeft.moveUp = true;
        } else if (key === 's') {
            this.paddleLeft.moveDown = true;
        }
        
        // Right paddle controls (Up, Down)
        if (key === 'arrowup') {
            this.paddleRight.moveUp = true;
        } else if (key === 'arrowdown') {
            this.paddleRight.moveDown = true;
        }
        
        // Space bar to start/pause
        if (key === ' ' && !e.repeat) {
            if (!this.state.playing) {
                this.start();
            } else {
                this.togglePause();
            }
        }
    }
    
    /**
     * Handle key up events
     */
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        
        // Left paddle controls (W, S)
        if (key === 'w') {
            this.paddleLeft.moveUp = false;
        } else if (key === 's') {
            this.paddleLeft.moveDown = false;
        }
        
        // Right paddle controls (Up, Down)
        if (key === 'arrowup') {
            this.paddleRight.moveUp = false;
        } else if (key === 'arrowdown') {
            this.paddleRight.moveDown = false;
        }
    }
    
    /**
     * Setup touch controls for mobile devices
     */
    setupTouchControls() {
        // Create touch areas
        const touchAreaLeft = document.createElement('div');
        touchAreaLeft.className = 'pong-touch-area left';
        touchAreaLeft.style.cssText = 'position: absolute; left: 0; top: 0; width: 25%; height: 100%; z-index: 10;';
        
        const touchAreaRight = document.createElement('div');
        touchAreaRight.className = 'pong-touch-area right';
        touchAreaRight.style.cssText = 'position: absolute; right: 0; top: 0; width: 25%; height: 100%; z-index: 10;';
        
        // Add touch areas to canvas container
        const canvasContainer = this.canvas.parentElement;
        canvasContainer.style.position = 'relative';
        canvasContainer.appendChild(touchAreaLeft);
        canvasContainer.appendChild(touchAreaRight);
        
        // Touch handlers for left paddle
        touchAreaLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouchMove(touch, this.paddleLeft);
        });
        
        touchAreaLeft.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouchMove(touch, this.paddleLeft);
        });
        
        touchAreaLeft.addEventListener('touchend', () => {
            this.paddleLeft.moveUp = false;
            this.paddleLeft.moveDown = false;
        });
        
        // Touch handlers for right paddle
        touchAreaRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouchMove(touch, this.paddleRight);
        });
        
        touchAreaRight.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouchMove(touch, this.paddleRight);
        });
        
        touchAreaRight.addEventListener('touchend', () => {
            this.paddleRight.moveUp = false;
            this.paddleRight.moveDown = false;
        });
        
        // Touch handler to start/pause game
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.state.playing) {
                this.start();
            } else if (e.touches.length > 2) {
                // Triple tap to pause
                this.togglePause();
            }
        });
    }
    
    /**
     * Handle touch movement for paddles
     */
    handleTouchMove(touch, paddle) {
        const relativeY = touch.clientY - this.canvas.getBoundingClientRect().top;
        
        if (relativeY < paddle.y + paddle.height / 3) {
            paddle.moveUp = true;
            paddle.moveDown = false;
        } else if (relativeY > paddle.y + paddle.height * 2 / 3) {
            paddle.moveUp = false;
            paddle.moveDown = true;
        } else {
            paddle.moveUp = false;
            paddle.moveDown = false;
        }
    }
    
    /**
     * Resize canvas to fit parent container while maintaining aspect ratio
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const aspectRatio = 16 / 9; // Classic arcade aspect ratio
        
        // Calculate dimensions while maintaining aspect ratio
        let canvasWidth = containerWidth;
        let canvasHeight = containerWidth / aspectRatio;
        
        // Ensure canvas isn't too tall
        const maxHeight = window.innerHeight * 0.8;
        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight * aspectRatio;
        }
        
        // Update canvas dimensions
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // Reset paddle positions after resize
        this.resetPaddlePositions();
        
        // Redraw the game if it's paused or not started yet
        if (!this.state.playing || this.state.paused) {
            this.draw();
        }
    }
    
    /**
     * Reset paddle positions after canvas resize
     */
    resetPaddlePositions() {
        this.paddleLeft.x = 20;
        this.paddleLeft.y = this.canvas.height / 2 - this.settings.paddleSize / 2;
        
        this.paddleRight.x = this.canvas.width - 30;
        this.paddleRight.y = this.canvas.height / 2 - this.settings.paddleSize / 2;
    }
    
    /**
     * Reset ball to center with random direction
     */
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        
        // Random X direction (left or right)
        this.ball.speedX = this.settings.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
        
        // Random Y direction (up or down)
        this.ball.speedY = (Math.random() * this.settings.ballSpeed - this.settings.ballSpeed / 2);
    }
    
    /**
     * Start the game
     */
    start() {
        if (!this.state.playing) {
            this.state.playing = true;
            this.state.paused = false;
            this.state.winner = null;
            this.state.scoreLeft = 0;
            this.state.scoreRight = 0;
            
            this.resetBall();
            this.resetPaddlePositions();
            
            // Start game loop
            this.update();
            
            // Dispatch game start event
            this.canvas.dispatchEvent(new CustomEvent('game:start'));
        } else if (this.state.paused) {
            this.togglePause();
        }
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        this.state.paused = !this.state.paused;
        
        if (!this.state.paused) {
            // Resume the game loop
            this.update();
            
            // Dispatch resume event
            this.canvas.dispatchEvent(new CustomEvent('game:resume'));
        } else {
            // Clear any existing animation frame
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
            
            // Draw pause message
            this.drawPauseScreen();
            
            // Dispatch pause event
            this.canvas.dispatchEvent(new CustomEvent('game:pause'));
        }
    }
    
    /**
     * Stop the game
     */
    stop() {
        this.state.playing = false;
        this.state.paused = false;
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Reset game state
        this.state.winner = null;
        this.state.scoreLeft = 0;
        this.state.scoreRight = 0;
        
        // Reset positions
        this.resetBall();
        this.resetPaddlePositions();
        
        // Draw the initial screen
        this.drawStartScreen();
        
        // Dispatch game stop event
        this.canvas.dispatchEvent(new CustomEvent('game:stop'));
    }
    
    /**
     * Main update loop
     */
    update() {
        // Skip update if game is paused
        if (this.state.paused) {
            return;
        }
        
        // Move paddles
        this.movePaddles();
        
        // Update AI if enabled
        if (this.settings.enableAI) {
            this.updateAI();
        }
        
        // Move ball
        this.moveBall();
        
        // Check collisions
        this.checkCollisions();
        
        // Check for scoring
        this.checkScoring();
        
        // Draw everything
        this.draw();
        
        // Continue the game loop if still playing
        if (this.state.playing) {
            this.animationFrameId = requestAnimationFrame(() => this.update());
        }
    }
    
    /**
     * Update AI paddle movement
     * This simulates a human player by limiting updates to once per second
     * and adding reaction delay and imperfect predictions
     */
    updateAI() {
        const now = performance.now();
        
        // Only update AI decision once per interval
        if (now - this.ai.lastUpdateTime > this.ai.updateInterval) {
            this.ai.lastUpdateTime = now;
            
            // Store the current ball position for prediction
            this.ai.lastBallY = this.ball.y;
            
            // Calculate where the ball will be when it reaches the AI's paddle
            // This is a predictive algorithm that simulates human anticipation
            if (this.ball.speedX > 0) { // Ball is moving toward AI paddle
                // Calculate time for ball to reach paddle
                const distanceToAI = this.paddleRight.x - this.ball.x;
                const timeToReachPaddle = distanceToAI / this.ball.speedX;
                
                // Predict ball's Y position when it reaches paddle
                let predictedY = this.ball.y + (this.ball.speedY * timeToReachPaddle);
                
                // Account for bounces off top and bottom walls
                const bounces = Math.floor(predictedY / this.canvas.height);
                if (bounces % 2 === 1) {
                    // Odd number of bounces means the direction is reversed
                    predictedY = this.canvas.height - (predictedY % this.canvas.height);
                } else {
                    // Even number of bounces means the direction is maintained
                    predictedY = predictedY % this.canvas.height;
                }
                
                // Apply prediction accuracy (introduce some error)
                if (Math.random() > this.ai.predictionAccuracy) {
                    // Add some random error to the prediction
                    const errorAmount = (Math.random() - 0.5) * this.paddleRight.height;
                    predictedY += errorAmount;
                }
                
                // Set target position for the paddle's middle
                this.ai.targetY = predictedY - (this.paddleRight.height / 2);
                
                // Ensure target is within canvas bounds
                this.ai.targetY = Math.max(0, Math.min(this.canvas.height - this.paddleRight.height, this.ai.targetY));
            }
        }
        
        // Apply reaction delay - don't move immediately after a decision
        if (performance.now() - this.ai.lastUpdateTime > this.ai.reactionDelay) {
            // Move paddle toward target position
            if (this.paddleRight.y + this.paddleRight.height / 2 < this.ai.targetY + this.paddleRight.height / 2 - 10) {
                // Move down if paddle is above target
                this.paddleRight.moveUp = false;
                this.paddleRight.moveDown = true;
            } else if (this.paddleRight.y + this.paddleRight.height / 2 > this.ai.targetY + this.paddleRight.height / 2 + 10) {
                // Move up if paddle is below target
                this.paddleRight.moveUp = true;
                this.paddleRight.moveDown = false;
            } else {
                // Stop moving if at target
                this.paddleRight.moveUp = false;
                this.paddleRight.moveDown = false;
            }
        }
    }
    
    /**
     * Move paddles based on controls
     */
    movePaddles() {
        // Left paddle
        if (this.paddleLeft.moveUp) {
            this.paddleLeft.y -= this.paddleLeft.speed;
        }
        if (this.paddleLeft.moveDown) {
            this.paddleLeft.y += this.paddleLeft.speed;
        }
        
        // Right paddle
        if (this.paddleRight.moveUp) {
            this.paddleRight.y -= this.paddleRight.speed;
        }
        if (this.paddleRight.moveDown) {
            this.paddleRight.y += this.paddleRight.speed;
        }
        
        // Keep paddles within bounds
        this.paddleLeft.y = Math.max(0, Math.min(this.canvas.height - this.paddleLeft.height, this.paddleLeft.y));
        this.paddleRight.y = Math.max(0, Math.min(this.canvas.height - this.paddleRight.height, this.paddleRight.y));
    }
    
    /**
     * Move the ball
     */
    moveBall() {
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;
    }
    
    /**
     * Check for collisions
     */
    checkCollisions() {
        // Top and bottom walls
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.speedY = -this.ball.speedY;
            this.playWallHitSound();
        }
        
        // Left paddle collision
        if (
            this.ball.x - this.ball.radius < this.paddleLeft.x + this.paddleLeft.width &&
            this.ball.y > this.paddleLeft.y &&
            this.ball.y < this.paddleLeft.y + this.paddleLeft.height &&
            this.ball.speedX < 0
        ) {
            // Calculate the hit position on the paddle (0 = top, 1 = bottom)
            const hitPosition = (this.ball.y - this.paddleLeft.y) / this.paddleLeft.height;
            
            // Calculate new angle based on hit position (between -45 and 45 degrees)
            const angle = (hitPosition - 0.5) * Math.PI / 2;
            
            // Reverse X direction and adjust speed based on hit position
            this.ball.speedX = -this.ball.speedX * 1.05; // Slight speedup to increase difficulty
            this.ball.speedY = this.settings.ballSpeed * Math.sin(angle);
            
            this.playPaddleHitSound();
        }
        
        // Right paddle collision
        if (
            this.ball.x + this.ball.radius > this.paddleRight.x &&
            this.ball.y > this.paddleRight.y &&
            this.ball.y < this.paddleRight.y + this.paddleRight.height &&
            this.ball.speedX > 0
        ) {
            // Calculate the hit position on the paddle (0 = top, 1 = bottom)
            const hitPosition = (this.ball.y - this.paddleRight.y) / this.paddleRight.height;
            
            // Calculate new angle based on hit position (between -45 and 45 degrees)
            const angle = (hitPosition - 0.5) * Math.PI / 2;
            
            // Reverse X direction and adjust speed based on hit position
            this.ball.speedX = -this.ball.speedX * 1.05; // Slight speedup to increase difficulty
            this.ball.speedY = this.settings.ballSpeed * Math.sin(angle);
            
            this.playPaddleHitSound();
        }
    }
    
    /**
     * Check if a player scored
     */
    checkScoring() {
        // Left player scores (ball goes off right edge)
        if (this.ball.x + this.ball.radius > this.canvas.width) {
            this.state.scoreLeft++;
            this.playScoreSound();
            this.resetBall();
            
            // Dispatch score event
            this.canvas.dispatchEvent(new CustomEvent('game:score', {
                detail: { player: 'left', score: this.state.scoreLeft }
            }));
            
            // Check for win
            this.checkWin();
        }
        
        // Right player scores (ball goes off left edge)
        if (this.ball.x - this.ball.radius < 0) {
            this.state.scoreRight++;
            this.playScoreSound();
            this.resetBall();
            
            // Dispatch score event
            this.canvas.dispatchEvent(new CustomEvent('game:score', {
                detail: { player: 'right', score: this.state.scoreRight }
            }));
            
            // Check for win
            this.checkWin();
        }
    }
    
    /**
     * Check if a player has won
     */
    checkWin() {
        if (this.state.scoreLeft >= this.settings.scoreLimit) {
            this.state.winner = 'left';
            this.state.playing = false;
            this.drawWinScreen();
            
            // Dispatch win event
            this.canvas.dispatchEvent(new CustomEvent('game:win', {
                detail: {
                    player: 'left',
                    score: {
                        left: this.state.scoreLeft,
                        right: this.state.scoreRight
                    }
                }
            }));
        } else if (this.state.scoreRight >= this.settings.scoreLimit) {
            this.state.winner = 'right';
            this.state.playing = false;
            this.drawWinScreen();
            
            // Dispatch win event
            this.canvas.dispatchEvent(new CustomEvent('game:win', {
                detail: {
                    player: 'right',
                    score: {
                        left: this.state.scoreLeft,
                        right: this.state.scoreRight
                    }
                }
            }));
        }
    }
    
    /**
     * Draw the game
     */
    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw center line
        this.drawCenterLine();
        
        // Draw paddles
        this.drawPaddle(this.paddleLeft);
        this.drawPaddle(this.paddleRight);
        
        // Draw ball
        this.drawBall();
        
        // Draw score
        this.drawScore();
    }
    
    /**
     * Draw the center line
     */
    drawCenterLine() {
        this.ctx.setLineDash([10, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.strokeStyle = this.settings.paddleColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    /**
     * Draw a paddle
     */
    drawPaddle(paddle) {
        this.ctx.fillStyle = this.settings.paddleColor;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    }
    
    /**
     * Draw the ball
     */
    drawBall() {
        this.ctx.fillStyle = this.settings.ballColor;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * Draw the score
     */
    drawScore() {
        this.ctx.font = '48px Arial';
        this.ctx.fillStyle = this.settings.paddleColor;
        this.ctx.textAlign = 'center';
        
        // Left player score
        this.ctx.fillText(this.state.scoreLeft.toString(), this.canvas.width / 4, 50);
        
        // Right player score
        this.ctx.fillText(this.state.scoreRight.toString(), this.canvas.width * 3 / 4, 50);
    }
    
    /**
     * Draw the start screen
     */
    drawStartScreen() {
        this.draw(); // Draw the base game first
        
        // Add semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Title
        this.ctx.font = '48px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PONG', this.canvas.width / 2, this.canvas.height / 3);
        
        // Instructions
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press SPACE to start', this.canvas.width / 2, this.canvas.height / 2);
        
        // Controls
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Left player: W / S', this.canvas.width / 2, this.canvas.height * 2 / 3);
        
        if (this.settings.enableAI) {
            this.ctx.fillText('Right player: AI Controlled', this.canvas.width / 2, this.canvas.height * 2 / 3 + 30);
            this.ctx.fillText(`AI Difficulty: ${this.settings.aiDifficulty}`, this.canvas.width / 2, this.canvas.height * 2 / 3 + 60);
        } else {
            this.ctx.fillText('Right player: ↑ / ↓', this.canvas.width / 2, this.canvas.height * 2 / 3 + 30);
        }
        
        // Mobile instructions if touch is available
        if ('ontouchstart' in window) {
            const touchY = this.settings.enableAI ? this.canvas.height * 2 / 3 + 90 : this.canvas.height * 2 / 3 + 60;
            this.ctx.fillText('Touch the left/right sides to move paddles', this.canvas.width / 2, touchY);
        }
    }
    
    /**
     * Draw the pause screen
     */
    drawPauseScreen() {
        // Draw the base game first
        this.draw();
        
        // Add semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pause message
        this.ctx.font = '48px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        // Instructions to resume
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press SPACE to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    /**
     * Draw the win screen
     */
    drawWinScreen() {
        // Draw the base game first
        this.draw();
        
        // Add semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Win message
        this.ctx.font = '48px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        
        const winnerText = this.state.winner === 'left' ? 'LEFT PLAYER WINS!' : 'RIGHT PLAYER WINS!';
        this.ctx.fillText(winnerText, this.canvas.width / 2, this.canvas.height / 3);
        
        // Final score
        this.ctx.font = '32px Arial';
        this.ctx.fillText(`${this.state.scoreLeft} - ${this.state.scoreRight}`, this.canvas.width / 2, this.canvas.height / 2);
        
        // Instructions to restart
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press SPACE to play again', this.canvas.width / 2, this.canvas.height * 2 / 3);
    }
    
    /**
     * Get current game state
     */
    getState() {
        return {
            playing: this.state.playing,
            paused: this.state.paused,
            scoreLeft: this.state.scoreLeft,
            scoreRight: this.state.scoreRight,
            winner: this.state.winner
        };
    }
    
    /**
     * Clean up event listeners
     */
    destroy() {
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Stop the game
        this.state.playing = false;
    }
    
    /**
     * Toggle AI opponent
     */
    toggleAI(enable) {
        this.settings.enableAI = enable === undefined ? !this.settings.enableAI : enable;
        
        // Reset game for clean state
        if (this.state.playing) {
            this.stop();
            this.drawStartScreen();
        } else {
            this.drawStartScreen();
        }
        
        return this.settings.enableAI;
    }
    
    /**
     * Change AI difficulty
     */
    setAIDifficulty(difficulty) {
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            difficulty = 'medium';
        }
        
        this.settings.aiDifficulty = difficulty;
        
        // Update AI parameters based on difficulty
        switch(difficulty) {
            case 'easy':
                this.ai.updateInterval = 1000; // Slower updates
                this.ai.reactionDelay = 500;  // Slower reactions
                this.ai.predictionAccuracy = 0.5; // Less accurate predictions
                break;
            case 'medium':
                this.ai.updateInterval = 500;
                this.ai.reactionDelay = 200;
                this.ai.predictionAccuracy = 0.75;
                break;
            case 'hard':
                this.ai.updateInterval = 200; // Faster updates
                this.ai.reactionDelay = 100;  // Faster reactions
                this.ai.predictionAccuracy = 0.9; // More accurate predictions
                break;
        }
        
        // Update display if game is not playing
        if (!this.state.playing) {
            this.drawStartScreen();
        }
        
        return this.settings.aiDifficulty;
    }
}

export default Pong;