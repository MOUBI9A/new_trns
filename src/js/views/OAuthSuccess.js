import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';

export default class OAuthSuccess extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - OAuth Success');
        
        // Check for code parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        this.code = urlParams.get('code');
        this.state = urlParams.get('state');
        this.error = urlParams.get('error');
        
        // Process OAuth data
        this.processOAuth();
    }
    
    async processOAuth() {
        // If there's an error parameter, handle it
        if (this.error) {
            window.navigateTo('/login?error=' + this.error);
            return;
        }
        
        // Check if we have a code
        if (!this.code) {
            window.navigateTo('/login?error=no_code');
            return;
        }
        
        try {
            // Handle OAuth callback
            const result = await authService.handle42OAuthCallback(this.code, this.state);
            
            // If authentication failed, redirect to login
            if (!result.success) {
                window.navigateTo('/login?error=auth_failed');
                return;
            }
            
            // Otherwise continue to success page
        } catch (error) {
            console.error('OAuth error:', error);
            window.navigateTo('/login?error=auth_error');
        }
    }

    async getHtml() {
        return `
            <div class="view-container fade-in text-center py-5">
                <div class="oauth-success-animation mb-4">
                    <div class="checkmark-circle">
                        <div class="checkmark draw"></div>
                    </div>
                </div>
                
                <h1 class="mb-3">Authentication Successful!</h1>
                <p class="lead">Welcome to Game Hub. You've been logged in successfully.</p>
                
                <div class="my-5 py-3">
                    <div class="spinner-grow text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">Redirecting you to your dashboard...</p>
                </div>
            </div>
            
            <style>
                .oauth-success-animation {
                    margin: 40px auto;
                }
                
                .checkmark-circle {
                    width: 100px;
                    height: 100px;
                    position: relative;
                    display: inline-block;
                    vertical-align: top;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .checkmark-circle .background {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background: var(--bs-primary);
                    position: absolute;
                }
                
                .checkmark-circle .checkmark {
                    border-radius: 5px;
                }
                
                .checkmark-circle .checkmark.draw:after {
                    animation-delay: 300ms;
                    animation-duration: 1s;
                    animation-timing-function: ease;
                    animation-name: checkmark;
                    transform: scaleX(-1) rotate(135deg);
                    animation-fill-mode: forwards;
                }
                
                .checkmark-circle .checkmark:after {
                    opacity: 0;
                    height: 50px;
                    width: 25px;
                    transform-origin: left top;
                    border-right: 8px solid var(--bs-success);
                    border-top: 8px solid var(--bs-success);
                    border-radius: 2px !important;
                    content: '';
                    left: 25px;
                    top: 50px;
                    position: absolute;
                }
                
                @keyframes checkmark {
                    0% {
                        height: 0;
                        width: 0;
                        opacity: 1;
                    }
                    20% {
                        height: 0;
                        width: 25px;
                        opacity: 1;
                    }
                    40% {
                        height: 50px;
                        width: 25px;
                        opacity: 1;
                    }
                    100% {
                        height: 50px;
                        width: 25px;
                        opacity: 1;
                    }
                }
            </style>
        `;
    }

    afterRender() {
        // Redirect to home page after 3 seconds
        setTimeout(() => {
            window.navigateTo('/');
        }, 3000);
    }
}