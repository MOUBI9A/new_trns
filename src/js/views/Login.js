import AbstractView from './AbstractView.js';
import authService from '../services/AuthService.js';

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
                                                <button type="submit" class="btn btn-primary">
                                                    <i class="bi bi-box-arrow-in-right me-2"></i>Login
                                                </button>
                                            </div>
                                            <div class="text-center mt-3">
                                                <a href="#" class="text-decoration-none">Forgot password?</a>
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
                                                    <input type="text" class="form-control" id="reg-username" required>
                                                </div>
                                                <div class="form-text" id="username-feedback"></div>
                                            </div>
                                            <div class="mb-3">
                                                <label for="reg-email" class="form-label">Email address</label>
                                                <div class="input-group">
                                                    <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                                                    <input type="email" class="form-control" id="reg-email" placeholder="name@example.com" required>
                                                </div>
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
                                            <div class="mb-3 form-check">
                                                <input type="checkbox" class="form-check-input" id="terms" required>
                                                <label class="form-check-label" for="terms">I agree to the <a href="#">Terms and Conditions</a></label>
                                            </div>
                                            <div class="d-grid gap-2">
                                                <button type="submit" class="btn btn-primary">
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
        `;
    }

    afterRender() {
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
        
        // Simple password strength indicator
        const passwordInput = document.getElementById('reg-password');
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                const progressBar = document.querySelector('.password-strength .progress-bar');
                const value = this.value;
                let strength = 0;
                
                if (value.length >= 8) strength += 25;
                if (/[A-Z]/.test(value)) strength += 25;
                if (/[0-9]/.test(value)) strength += 25;
                if (/[^A-Za-z0-9]/.test(value)) strength += 25;
                
                progressBar.style.width = strength + '%';
                
                if (strength <= 25) {
                    progressBar.className = 'progress-bar bg-danger';
                } else if (strength <= 50) {
                    progressBar.className = 'progress-bar bg-warning';
                } else if (strength <= 75) {
                    progressBar.className = 'progress-bar bg-info';
                } else {
                    progressBar.className = 'progress-bar bg-success';
                }
            });
        }

        // Check if username is already taken
        const regUsername = document.getElementById('reg-username');
        const usernameFeedback = document.getElementById('username-feedback');
        
        if (regUsername) {
            regUsername.addEventListener('blur', function() {
                const username = this.value.trim();
                if (username && authService.isUsernameTaken(username)) {
                    usernameFeedback.textContent = 'Username already taken';
                    usernameFeedback.className = 'form-text text-danger';
                    this.classList.add('is-invalid');
                } else if (username) {
                    usernameFeedback.textContent = 'Username available';
                    usernameFeedback.className = 'form-text text-success';
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                } else {
                    usernameFeedback.textContent = '';
                    this.classList.remove('is-invalid', 'is-valid');
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

        // Handle login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;
                const alertContainer = document.getElementById('auth-alert');
                
                try {
                    const result = await authService.login(username, password);
                    if (result.success) {
                        this.showAlert(alertContainer, 'success', 'Login successful! Redirecting...');
                        setTimeout(() => {
                            window.navigateTo('/');
                        }, 1500);
                    }
                } catch (error) {
                    this.showAlert(alertContainer, 'danger', error.message);
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
                const password = document.getElementById('reg-password').value;
                const confirmPassword = document.getElementById('reg-confirm-password').value;
                const alertContainer = document.getElementById('auth-alert');
                
                // Validate form
                if (password !== confirmPassword) {
                    this.showAlert(alertContainer, 'danger', 'Passwords do not match');
                    return;
                }
                
                if (authService.isUsernameTaken(username)) {
                    this.showAlert(alertContainer, 'danger', 'Username already taken');
                    return;
                }
                
                try {
                    const result = await authService.register(username, email, password);
                    if (result.success) {
                        this.showAlert(alertContainer, 'success', 'Registration successful! Redirecting...');
                        setTimeout(() => {
                            window.navigateTo('/');
                        }, 1500);
                    }
                } catch (error) {
                    this.showAlert(alertContainer, 'danger', error.message);
                }
            });
        }
    }

    showAlert(container, type, message) {
        container.className = `alert alert-${type}`;
        container.textContent = message;
        container.classList.remove('d-none');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            container.classList.add('d-none');
        }, 5000);
    }
} 