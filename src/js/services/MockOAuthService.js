/**
 * Mock OAuth Service for 42 Authentication
 * This service simulates OAuth authentication without requiring a backend server
 */

class MockOAuthService {
    constructor() {
        this.clientId = '42_mock_client_id';
        this.redirectUri = `${window.location.origin}/oauth/callback`;
        this.oauthState = null;
        
        // Demo accounts that will be recognized by this mock service
        this.demoAccounts = {
            'student42': {
                id: 12345,
                email: 'student@42.fr',
                login: 'student42',
                displayname: '42 Student',
                image: {
                    link: 'https://cdn.intra.42.fr/users/default.png'
                },
                cursus_users: [
                    { 
                        level: 7.42,
                        cursus: { name: 'Common Core' }
                    }
                ],
                projects_users: [
                    { 
                        project: { name: 'Libft' },
                        status: 'finished',
                        final_mark: 115
                    },
                    { 
                        project: { name: 'ft_printf' },
                        status: 'finished',
                        final_mark: 100
                    },
                    { 
                        project: { name: 'get_next_line' },
                        status: 'finished',
                        final_mark: 125
                    }
                ]
            },
            'cadet42': {
                id: 67890,
                email: 'cadet@42.fr',
                login: 'cadet42',
                displayname: '42 Cadet',
                image: {
                    link: 'https://cdn.intra.42.fr/users/default.png'
                },
                cursus_users: [
                    { 
                        level: 10.21,
                        cursus: { name: 'Common Core' }
                    }
                ],
                projects_users: [
                    { 
                        project: { name: 'push_swap' },
                        status: 'finished',
                        final_mark: 84
                    },
                    { 
                        project: { name: 'minishell' },
                        status: 'in_progress'
                    }
                ]
            }
        };
    }
    
    /**
     * Generate the authorization URL
     * @returns {string} The OAuth authorization URL
     */
    getAuthorizationUrl() {
        // Generate a random state to protect against CSRF
        this.oauthState = this._generateRandomState();
        
        // Since we're mocking the OAuth flow, redirect to our simulated login page
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            state: this.oauthState,
            mock: true
        });
        
        return `/login/mock42?${params.toString()}`;
    }
    
    /**
     * Process the OAuth code from the callback
     * @param {string} code - The authorization code
     * @param {string} state - The state parameter for verification
     * @returns {Promise<Object>} The user data
     */
    async processCode(code, state) {
        // Check if the state matches
        if (state !== this.oauthState) {
            throw new Error('Invalid state parameter');
        }
        
        // In a real implementation, we would exchange the code for a token
        // and then use the token to get user data
        // Here we'll just simulate a successful token exchange and return mock user data
        
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Extract the mock user from the code
            // The code will be in the format 'mock_USER_ID'
            const userKey = code.replace('mock_', '');
            
            if (!this.demoAccounts[userKey]) {
                throw new Error('Invalid authorization code');
            }
            
            // Return the simulated user data
            return {
                success: true,
                userData: this.demoAccounts[userKey]
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Create a mock login page (for demo purposes)
     * @returns {string} HTML for the mock login page
     */
    getMockLoginPageHtml() {
        // Get available demo accounts
        const accountOptions = Object.keys(this.demoAccounts).map(login => {
            const account = this.demoAccounts[login];
            return `
                <div class="mock-account-option mb-3 card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="me-3">
                                <img src="${account.image.link}" alt="${account.displayname}" 
                                    class="rounded-circle" width="50" height="50">
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">${account.displayname}</h5>
                                <div class="text-muted">@${login} · Level ${account.cursus_users[0].level}</div>
                            </div>
                            <div>
                                <a href="/oauth/callback?code=mock_${login}&state=${this.oauthState}" 
                                   class="btn btn-primary login-as-btn">
                                   Login as this user
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="container py-5">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="card shadow">
                            <div class="card-header bg-primary text-white">
                                <h4 class="mb-0">Mock 42 OAuth Login</h4>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle-fill me-2"></i>
                                    This is a simulated 42 login page for development purposes.
                                    In a production environment, you would be redirected to the real 42 login page.
                                </div>
                                
                                <p>Choose one of the following mock accounts to log in:</p>
                                
                                <div class="mock-accounts-list">
                                    ${accountOptions}
                                </div>
                                
                                <div class="text-center mt-4">
                                    <a href="/login" class="btn btn-outline-secondary">
                                        <i class="bi bi-arrow-left me-2"></i>
                                        Back to Login
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate a random state string
     * @returns {string} A random state string
     * @private
     */
    _generateRandomState() {
        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

// Create singleton instance
const mockOAuthService = new MockOAuthService();
export default mockOAuthService;