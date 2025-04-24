/**
 * Game Customizer
 * Handles customization options for all games on the platform
 */
export default class GameCustomizer {
    constructor() {
        this.loadSettings();
    }

    /**
     * Default settings for all games
     */
    getDefaultSettings() {
        return {
            pong: {
                ballSpeed: 5,
                paddleSize: 100,
                scoreLimit: 5,
                ballColor: '#ffffff',
                paddleColor: '#ffffff',
                backgroundColor: '#000000',
                enablePowerUps: false,
                powerUpTypes: ['speed', 'size', 'freeze'],
                showTrails: false,
                enableSounds: true
            },
            ticTacToe: {
                boardSize: 3,
                winLength: 3,
                playerXColor: '#007bff',
                playerOColor: '#dc3545',
                backgroundColor: '#ffffff',
                aiDifficulty: 'medium',
                enableAnimations: true,
                enableSounds: true,
                showHints: false
            },
            rockPaperScissors: {
                rounds: 5,
                enableAnimations: true,
                playerOneColor: '#007bff',
                playerTwoColor: '#dc3545',
                backgroundColor: '#f8f9fa',
                enableExtendedOptions: false,
                extendedOptions: ['rock', 'paper', 'scissors', 'lizard', 'spock'],
                standardOptions: ['rock', 'paper', 'scissors'],
                enableSounds: true,
                showHints: false
            },
            global: {
                theme: 'default',
                soundVolume: 0.7,
                showTutorials: true
            }
        };
    }

    /**
     * Load settings from localStorage or use defaults
     */
    loadSettings() {
        const savedSettings = localStorage.getItem('gameCustomizations');
        if (savedSettings) {
            try {
                this.settings = JSON.parse(savedSettings);
                // Merge with defaults in case new options were added
                const defaults = this.getDefaultSettings();
                
                // Ensure all default properties exist
                for (const game in defaults) {
                    if (!this.settings[game]) {
                        this.settings[game] = {};
                    }
                    
                    for (const option in defaults[game]) {
                        if (typeof this.settings[game][option] === 'undefined') {
                            this.settings[game][option] = defaults[game][option];
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading game customizations:', e);
                this.settings = this.getDefaultSettings();
            }
        } else {
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Save current settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('gameCustomizations', JSON.stringify(this.settings));
            return true;
        } catch (e) {
            console.error('Error saving game customizations:', e);
            return false;
        }
    }

    /**
     * Get settings for a specific game
     * @param {string} game - The game to get settings for ('pong', 'ticTacToe', 'rockPaperScissors', or 'global')
     */
    getSettings(game) {
        if (this.settings[game]) {
            return this.settings[game];
        }
        return this.getDefaultSettings()[game];
    }

    /**
     * Update settings for a specific game
     * @param {string} game - The game to update settings for
     * @param {Object} newSettings - New settings object
     */
    updateSettings(game, newSettings) {
        if (!this.settings[game]) {
            this.settings[game] = this.getDefaultSettings()[game];
        }
        
        this.settings[game] = {
            ...this.settings[game],
            ...newSettings
        };
        
        return this.saveSettings();
    }

    /**
     * Reset settings for a specific game to defaults
     * @param {string} game - The game to reset settings for
     */
    resetSettings(game) {
        this.settings[game] = this.getDefaultSettings()[game];
        return this.saveSettings();
    }

    /**
     * Reset all settings to defaults
     */
    resetAllSettings() {
        this.settings = this.getDefaultSettings();
        return this.saveSettings();
    }
}

// Create a singleton instance
const gameCustomizer = new GameCustomizer();
export { gameCustomizer };