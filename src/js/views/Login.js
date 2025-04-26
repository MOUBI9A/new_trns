import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';
import mockOAuthService from '../services/MockOAuthService.js';

export default class Login extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Login');
        this.redirectIfAuthenticated();
    }

    redirectIfAuthenticated() {
        if (authService.isAuthenticated()) {
            window.navigateTo('/');
        }
    }

    async getHtml() {
        return `
            <div class="view-container fade-in">
                <div class="row justify-content-center">
                    <div class="col-md-8 col-lg-6">
                        <div class="card shadow-sm border-0">
                            <div class="card-header bg-transparent">
                                <ul class="nav nav-tabs card-header-tabs" id="authTabs">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active" id="login-tab" data-bs-toggle="tab" data-bs-target="#login-panel" type="button" role="tab" aria-controls="login-panel" aria-selected="true">
                                            <i class="bi bi-box-arrow-in-right me-2"></i>Login
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="register-tab" data-bs-toggle="tab" data-bs-target="#register-panel" type="button" role="tab" aria-controls="register-panel" aria-selected="false">
                                            <i class="bi bi-person-plus me-2"></i>Register
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <div class="card-body p-4">
                                <!-- Alert container for messages -->
                                <div id="auth-alert" class="alert d-none" role="alert"></div>
                                
                                <div class="tab-content" id="authTabContent">
                                    <div class="tab-pane fade show active" id="login-panel" role="tabpanel" aria-labelledby="login-tab">
                                        <h5 class="card-title mb-4">Login to your account</h5>
                                        
                                        <!-- OAuth login options -->
                                        <div class="oauth-options mb-4">
                                            <div class="d-grid gap-2">
                                                <button type="button" id="login-with-42" class="btn btn-outline-dark oauth-btn">
                                                    <!-- Using 42 logo image -->
                                                    <img src="/42_Logo.svg.png" alt="42 Logo" class="me-2" style="height: 24px; width: auto;">
                                                    Login with 42
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <!-- Error message for invalid redirect URI -->
                                        <div id="oauth-error-message" class="alert alert-danger mb-4 d-none">
                                            <strong>Error:</strong> The redirect URI included is not valid.
                                            <p class="mb-0 mt-2">Please contact the administrator to fix the OAuth configuration.</p>
                                        </div>
                                        
                                        <div class="separator text-center mb-4">
                                            <span class="separator-text">or</span>
                                        </div>
                                        
                                        <form id="login-form">
                                            <div class="mb-3">
                                                <label for="login-username" class="form-label">Username</label>
                                                <div class="input-group">
                                                    <span class="input-group-text"><i class="bi bi-person"></i></span>
                                                    <input type="text" class="form-control" id="login-username" required>
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <label for="login-password" class="form-label">Password</label>
                                                <div class="input-group">
                                                    <span class="input-group-text"><i class="bi bi-key"></i></span>
                                                    <input type="password" class="form-control" id="login-password" required>
                                                    <button class="btn btn-outline-secondary toggle-password" type="button">
                                                        <i class="bi bi-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="mb-3 form-check">
                                                <input type="checkbox" class="form-check-input" id="rememberMe">
                                                <label class="form-check-label" for="rememberMe">Remember me</label>
                                            </div>
                                            <div class="d-grid gap-2">
                                                <button type="submit" class="btn btn-primary" id="login-button">
                                                    <i class="bi bi-box-arrow-in-right me-2"></i>Login
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                    
                                    <div class="tab-pane fade" id="register-panel" role="tabpanel" aria-labelledby="register-tab">
                                        <h5 class="card-title mb-4">Create an account</h5>
                                        <form id="register-form">
                                            <div class="mb-3">
                                                <label for="reg-username" class="form-label">Username</label>
                                                <div class="input-group">
                                                    <span class="input-group-text"><i class="bi bi-person"></i></span>
                                                    <input type="text" class="form-control" id="reg-username" required pattern="^[a-zA-Z0-9_]{3,20}$">
                                                </div>
                                                <div class="form-text" id="username-feedback">Username must be 3-20 characters and contain only letters, numbers, and underscores</div>
                                            </div>
                                            <div class="mb-3">
                                                <label for="reg-email" class="form-label">Email address</label>
                                                <div class="input-group">
                                                    <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                                                    <input type="email" class="form-control" id="reg-email" placeholder="name@example.com" required>
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <label for="reg-display-name" class="form-label">Display Name <span class="text-muted">(Optional)</span></label>
                                                <div class="input-group">
                                                    <span class="input-group-text"><i class="bi bi-person-badge"></i></span>
                                                    <input type="text" class="form-control" id="reg-display-name" placeholder="How you want to be known">
                                                </div>
                                                <div class="form-text">This is the name that will be shown to other players</div>
                                            </div>
                                            <div class="mb-3">
                                                <label for="reg-password" class="form-label">Password</label>
                                                <div class="input-group">
                                                    <span class="input-group-text"><i class="bi bi-key"></i></span>
                                                    <input type="password" class="form-control" id="reg-password" required minlength="8">
                                                    <button class="btn btn-outline-secondary toggle-password" type="button">
                                                        <i class="bi bi-eye"></i>
                                                    </button>
                                                </div>
                                                <div class="password-strength mt-2">
                                                    <div class="progress" style="height: 5px;">
                                                        <div class="progress-bar bg-danger" role="progressbar" style="width: 0%"></div>
                                                    </div>
                                                    <small class="text-muted">Password strength</small>
                                                    <ul class="password-requirements small text-muted mt-2">
                                                        <li id="req-length"><span class="req-icon">○</span> At least 8 characters</li>
                                                        <li id="req-upper"><span class="req-icon">○</span> Contains uppercase letters</li>
                                                        <li id="req-lower"><span class="req-icon">○</span> Contains lowercase letters</li>
                                                        <li id="req-number"><span class="req-icon">○</span> Contains numbers</li>
                                                        <li id="req-special"><span class="req-icon">○</span> Contains special characters</li>
                                                        <li class="text-primary"><small>Must satisfy at least 3 of the above requirements</small></li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <label for="reg-confirm-password" class="form-label">Confirm Password</label>
                                                <div class="input-group">
                                                    <span class="input-group-text"><i class="bi bi-key"></i></span>
                                                    <input type="password" class="form-control" id="reg-confirm-password" required>
                                                </div>
                                                <div class="form-text" id="password-match-feedback"></div>
                                            </div>
                                            <div class="mb-4">
                                                <label class="form-label">Avatar <span class="text-muted">(Optional)</span></label>
                                                <div class="d-flex">
                                                    <div class="avatar-preview me-3">
                                                        <div class="avatar-placeholder rounded-circle bg-light d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                                                            <i class="bi bi-person text-secondary" style="font-size: 2rem"></i>
                                                        </div>
                                                    </div>
                                                    <div class="flex-grow-1">
                                                        <input type="file" class="form-control" id="avatar-upload" accept="image/*">
                                                        <div class="form-text">Maximum size: 2MB. Recommended: square image</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mb-3 form-check">
                                                <input type="checkbox" class="form-check-input" id="terms" required>
                                                <label class="form-check-label" for="terms">I agree to the <a href="#">Terms and Conditions</a></label>
                                            </div>
                                            <div class="d-grid gap-2">
                                                <button type="submit" class="btn btn-primary" id="register-button">
                                                    <i class="bi bi-person-plus me-2"></i>Register
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="text-center mt-4">
                            <p class="small text-muted">By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                /* Add separator styling */
                .separator {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    color: var(--bs-secondary);
                }
                
                .separator::before,
                .separator::after {
                    content: '';
                    flex: 1;
                    border-bottom: 1px solid var(--bs-border-color);
                }
                
                .separator::before {
                    margin-right: .5em;
                }
                
                .separator::after {
                    margin-left: .5em;
                }
                
                .separator-text {
                    padding: 0 10px;
                }
                
                /* OAuth buttons */
                .oauth-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px;
                }
                
                /* Existing styles... */
                .password-requirements {
                    list-style-type: none;
                    padding-left: 0;
                }
                .password-requirements li {
                    margin-bottom: 0.25rem;
                }
                .req-icon {
                    display: inline-block;
                    width: 1rem;
                    text-align: center;
                    margin-right: 0.25rem;
                }
                .req-valid .req-icon {
                    color: var(--bs-success);
                }
                .req-invalid .req-icon {
                    color: var(--bs-secondary);
                }
                .avatar-placeholder {
                    width: 60px;
                    height: 60px;
                    overflow: hidden;
                }
                .avatar-preview img {
                    width: 60px;
                    height: 60px;
                    object-fit: cover;
                }
            </style>
        `;
    }

    afterRender() {
        // Check for error parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            const error = urlParams.get('error');
            let errorMessage = 'An error occurred during login';
            
            if (error === 'auth_error') {
                errorMessage = 'Authentication failed. Please try again.';
            } else if (error === 'no_code') {
                errorMessage = 'Authentication was canceled or rejected.';
            } else if (error === 'auth_failed') {
                errorMessage = 'Authentication with 42 failed. Please try again.';
            } else if (error === 'invalid_redirect_uri') {
                errorMessage = 'The redirect URI included is not valid. Please contact the administrator to fix the OAuth configuration.';
                document.getElementById('oauth-error-message').classList.remove('d-none');
            }
            
            this.showAlert('danger', errorMessage);
        }
        
        // OAuth login buttons
        const loginWith42Btn = document.getElementById('login-with-42');
        if (loginWith42Btn) {
            loginWith42Btn.addEventListener('click', () => {
                // Use the mockOAuthService directly
                mockOAuthService.initiateOAuth42Login('/oauth-success');
            });
        }
        
        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', function() {
                const input = this.previousElementSibling;
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('bi-eye');
                    icon.classList.add('bi-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('bi-eye-slash');
                    icon.classList.add('bi-eye');
                }
            });
        });
        
        // Enhanced password strength indicator
        const passwordInput = document.getElementById('reg-password');
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                const progressBar = document.querySelector('.password-strength .progress-bar');
                const value = this.value;
                
                // Check each requirement
                const requirements = {
                    length: value.length >= 8,
                    upper: /[A-Z]/.test(value),
                    lower: /[a-z]/.test(value),
                    number: /[0-9]/.test(value),
                    special: /[^A-Za-z0-9]/.test(value)
                };
                
                // Update requirements list visual state
                document.getElementById('req-length').className = requirements.length ? 'req-valid' : 'req-invalid';
                document.getElementById('req-length').querySelector('.req-icon').textContent = requirements.length ? '✓' : '○';
                
                document.getElementById('req-upper').className = requirements.upper ? 'req-valid' : 'req-invalid';
                document.getElementById('req-upper').querySelector('.req-icon').textContent = requirements.upper ? '✓' : '○';
                
                document.getElementById('req-lower').className = requirements.lower ? 'req-valid' : 'req-invalid';
                document.getElementById('req-lower').querySelector('.req-icon').textContent = requirements.lower ? '✓' : '○';
                
                document.getElementById('req-number').className = requirements.number ? 'req-valid' : 'req-invalid';
                document.getElementById('req-number').querySelector('.req-icon').textContent = requirements.number ? '✓' : '○';
                
                document.getElementById('req-special').className = requirements.special ? 'req-valid' : 'req-invalid';
                document.getElementById('req-special').querySelector('.req-icon').textContent = requirements.special ? '✓' : '○';
                
                // Calculate strength based on requirements met
                const requirementsMet = Object.values(requirements).filter(Boolean).length;
                let strength = 0;
                
                if (value.length >= 8) {
                    // Base points for minimum length
                    strength += 20;
                    
                    // Additional points for each requirement
                    if (requirements.upper) strength += 20;
                    if (requirements.lower) strength += 20;
                    if (requirements.number) strength += 20;
                    if (requirements.special) strength += 20;
                }
                
                progressBar.style.width = strength + '%';
                
                if (strength <= 20) {
                    progressBar.className = 'progress-bar bg-danger';
                } else if (strength <= 60) {
                    progressBar.className = 'progress-bar bg-warning';
                } else if (strength <= 80) {
                    progressBar.className = 'progress-bar bg-info';
                } else {
                    progressBar.className = 'progress-bar bg-success';
                }
            });
        }

        // Check if passwords match
        const confirmPasswordInput = document.getElementById('reg-confirm-password');
        const passwordMatchFeedback = document.getElementById('password-match-feedback');
        
        if (confirmPasswordInput && passwordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                if (this.value && this.value !== passwordInput.value) {
                    passwordMatchFeedback.textContent = 'Passwords do not match';
                    passwordMatchFeedback.className = 'form-text text-danger';
                    this.classList.add('is-invalid');
                } else if (this.value) {
                    passwordMatchFeedback.textContent = 'Passwords match';
                    passwordMatchFeedback.className = 'form-text text-success';
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                } else {
                    passwordMatchFeedback.textContent = '';
                    this.classList.remove('is-invalid', 'is-valid');
                }
            });
        }

        // Username validation feedback
        const usernameInput = document.getElementById('reg-username');
        const usernameFeedback = document.getElementById('username-feedback');
        
        if (usernameInput) {
            usernameInput.addEventListener('input', function() {
                const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(this.value);
                
                if (this.value && !isValid) {
                    usernameFeedback.className = 'form-text text-danger';
                    this.classList.add('is-invalid');
                } else if (this.value) {
                    usernameFeedback.className = 'form-text text-success';
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                } else {
                    usernameFeedback.className = 'form-text';
                    this.classList.remove('is-invalid', 'is-valid');
                }
            });
        }

        // Avatar upload preview
        const avatarUpload = document.getElementById('avatar-upload');
        const avatarPreview = document.querySelector('.avatar-preview');
        
        if (avatarUpload && avatarPreview) {
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                // Validate file is an image and not too large
                if (!file.type.startsWith('image/')) {
                    this.showAlert('danger', 'Please select an image file.');
                    return;
                }
                
                if (file.size > 2 * 1024 * 1024) { // 2MB max
                    this.showAlert('danger', 'Image must be less than 2MB.');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Image = event.target.result;
                    // Update the preview image
                    avatarPreview.innerHTML = `<img src="${base64Image}" alt="Avatar Preview" class="rounded-circle">`;
                };
                reader.readAsDataURL(file);
            });
        }

        // Handle login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;
                const loginButton = document.getElementById('login-button');
                
                // Disable button and show loading state
                loginButton.disabled = true;
                loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
                
                try {
                    const result = await authService.login(username, password);
                    if (result.success) {
                        this.showAlert('success', 'Login successful! Redirecting...');
                        setTimeout(() => {
                            window.navigateTo('/');
                        }, 1500);
                    }
                } catch (error) {
                    this.showAlert('danger', error.message || 'Login failed. Please check your credentials.');
                    
                    // Re-enable button and restore original text
                    loginButton.disabled = false;
                    loginButton.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
                }
            });
        }

        // Handle registration form submission
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('reg-username').value;
                const email = document.getElementById('reg-email').value;
                const displayName = document.getElementById('reg-display-name').value || username;
                const password = document.getElementById('reg-password').value;
                const confirmPassword = document.getElementById('reg-confirm-password').value;
                const registerButton = document.getElementById('register-button');
                
                // Client-side validation
                if (password !== confirmPassword) {
                    this.showAlert('danger', 'Passwords do not match');
                    return;
                }
                
                if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
                    this.showAlert('danger', 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
                    return;
                }
                
                // Disable button and show loading state
                registerButton.disabled = true;
                registerButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';
                
                try {
                    // Get avatar if uploaded
                    let avatar = null;
                    const avatarImg = document.querySelector('.avatar-preview img');
                    if (avatarImg) {
                        avatar = avatarImg.src;
                    }
                    
                    // Register user
                    const result = await authService.register(username, email, password, displayName);
                    
                    // If avatar was uploaded, update the profile
                    if (result.success && avatar) {
                        await authService.updateProfile({ avatar });
                    }
                    
                    this.showAlert('success', 'Registration successful! Redirecting...');
                    setTimeout(() => {
                        window.navigateTo('/');
                    }, 1500);
                } catch (error) {
                    this.showAlert('danger', error.message || 'Registration failed. Please try again.');
                    
                    // Re-enable button and restore original text
                    registerButton.disabled = false;
                    registerButton.innerHTML = '<i class="bi bi-person-plus me-2"></i>Register';
                }
            });
        }
    }

    showAlert(type, message) {
        const alertContainer = document.getElementById('auth-alert');
        if (!alertContainer) return;
        
        alertContainer.className = `alert alert-${type}`;
        alertContainer.textContent = message;
        alertContainer.classList.remove('d-none');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertContainer.classList.add('d-none');
        }, 5000);
    }
}