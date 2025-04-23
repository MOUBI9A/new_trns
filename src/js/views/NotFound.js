import AbstractView from './AbstractView.js';

export default class NotFound extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Page Not Found');
    }

    async getHtml() {
        return `
            <div class="view-container fade-in">
                <div class="row justify-content-center">
                    <div class="col-md-8 col-lg-6 text-center">
                        <div class="error-container py-5">
                            <div class="error-icon mb-4">
                                <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
                            </div>
                            <h1 class="display-1 fw-bold text-primary">404</h1>
                            <h2 class="mb-4">Page Not Found</h2>
                            <p class="lead mb-5">
                                Oops! The page you are looking for might have been removed,
                                had its name changed, or is temporarily unavailable.
                            </p>
                            <div class="d-flex flex-column flex-md-row justify-content-center gap-3">
                                <a href="/" class="btn btn-primary btn-lg" data-link>
                                    <i class="bi bi-house-door me-2"></i> Go to Home
                                </a>
                                <a href="/games" class="btn btn-outline-primary btn-lg" data-link>
                                    <i class="bi bi-controller me-2"></i> Browse Games
                                </a>
                            </div>
                            
                            <div class="mt-5">
                                <p class="text-muted">
                                    If you believe this is an error, please contact 
                                    <a href="#" class="text-decoration-none">support</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
} 