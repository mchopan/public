class AuthService {
    // Get server URL from environment variable or fallback to default
    static get SERVER_URL() {
        // In a frontend app, we'll use a global config object
        return window.APP_CONFIG?.BACKEND_SERVER || "https://quickloadbe.cogweel.com/";
    }

    // Error types for better error handling
    static ERROR_TYPES = {
        NETWORK: 'NETWORK_ERROR',
        AUTHENTICATION: 'AUTH_ERROR',
        SERVER: 'SERVER_ERROR',
        VALIDATION: 'VALIDATION_ERROR',
        TOKEN_EXPIRED: 'TOKEN_EXPIRED'
    };

    // Retry configuration
    static RETRY_CONFIG = {
        maxRetries: 3,
        retryDelay: 1000, // 1 second
        retryMultiplier: 2
    };

    static async adminLogin(username, password) {
        // Input validation
        if (!username || !password) {
            const error = new Error('Username and password are required');
            error.type = this.ERROR_TYPES.VALIDATION;
            throw error;
        }

        return this._retryOperation(async () => {
            try {
                console.log('Admin login attempt for username:', username);
                console.log('Using server URL:', this.SERVER_URL);

                const response = await fetch(`${this.SERVER_URL}/api/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                if (!response.ok) {
                    await this._handleHttpError(response);
                }

                const data = await response.json();
                console.log('Admin login successful');

                // Store the admin token and info in localStorage
                if (data.token) {
                    localStorage.setItem('quickload_admin', JSON.stringify(data.user));
                    localStorage.setItem('adminToken', data.token);
                    localStorage.setItem('adminUser', JSON.stringify(data.user.username));

                    // Log successful authentication
                    this._logAuthEvent('LOGIN_SUCCESS', { username });
                }

                return { success: true, admin: data.admin };
            } catch (error) {
                // Enhanced error logging
                this._logAuthEvent('LOGIN_ERROR', {
                    username,
                    error: error.message,
                    type: error.type || 'UNKNOWN'
                });
                throw error;
            }
        });
    }

    // Helper method for retry logic
    static async _retryOperation(operation, retryCount = 0) {
        try {
            return await operation();
        } catch (error) {
            // Don't retry authentication or validation errors
            if (error.type === this.ERROR_TYPES.AUTHENTICATION ||
                error.type === this.ERROR_TYPES.VALIDATION) {
                throw error;
            }

            // Retry network and server errors
            if (retryCount < this.RETRY_CONFIG.maxRetries &&
                (error.type === this.ERROR_TYPES.NETWORK || error.type === this.ERROR_TYPES.SERVER)) {

                const delay = this.RETRY_CONFIG.retryDelay * Math.pow(this.RETRY_CONFIG.retryMultiplier, retryCount);
                console.log(`Retrying operation in ${delay}ms (attempt ${retryCount + 1}/${this.RETRY_CONFIG.maxRetries})`);

                await new Promise(resolve => setTimeout(resolve, delay));
                return this._retryOperation(operation, retryCount + 1);
            }

            throw error;
        }
    }

    // Enhanced HTTP error handling
    static async _handleHttpError(response) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: 'Unknown server error' };
        }

        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);

        switch (response.status) {
            case 401:
                error.type = this.ERROR_TYPES.AUTHENTICATION;
                error.message = errorData.message || 'Invalid username or password';
                break;
            case 403:
                error.type = this.ERROR_TYPES.AUTHENTICATION;
                error.message = errorData.message || 'Access denied';
                break;
            case 404:
                error.type = this.ERROR_TYPES.SERVER;
                error.message = 'Service not found. Please try again later.';
                break;
            case 429:
                error.type = this.ERROR_TYPES.SERVER;
                error.message = 'Too many login attempts. Please try again later.';
                break;
            case 500:
            case 502:
            case 503:
            case 504:
                error.type = this.ERROR_TYPES.SERVER;
                error.message = 'Server error. Please try again later.';
                break;
            default:
                error.type = this.ERROR_TYPES.SERVER;
        }

        throw error;
    }

    // Enhanced logging
    static _logAuthEvent(event, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            ...data
        };
        console.log('Auth Event:', logEntry);

        // Store recent auth events for debugging (keep last 10)
        const authLogs = JSON.parse(localStorage.getItem('auth_logs') || '[]');
        authLogs.unshift(logEntry);
        authLogs.splice(10); // Keep only last 10 entries
        localStorage.setItem('auth_logs', JSON.stringify(authLogs));
    }

    static isAdminAuthenticated() {
        return !!localStorage.getItem('adminToken');
    }

    static adminLogout() {
        this._logAuthEvent('LOGOUT', { username: this.getAdminUser() });
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('quickload_admin');
        window.location.href = '/index.html';
    }

    static getAdminToken() {
        return localStorage.getItem('adminToken');
    }

    static getAdminUser() {
        const admin = localStorage.getItem('adminUser');
        return admin ? JSON.parse(admin) : null;
    }

    static async getAdminProfile(adminId) {
        if (!adminId) {
            const error = new Error('Admin ID is required');
            error.type = this.ERROR_TYPES.VALIDATION;
            throw error;
        }

        return this._retryOperation(async () => {
            try {
                const response = await fetch(`${this.SERVER_URL}/api/admin/profile/${adminId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.getAdminToken()}`
                    }
                });

                if (!response.ok) {
                    await this._handleHttpError(response);
                }

                return await response.json();
            } catch (error) {
                this._logAuthEvent('PROFILE_FETCH_ERROR', {
                    adminId,
                    error: error.message,
                    type: error.type || 'UNKNOWN'
                });
                throw error;
            }
        });
    }

    static async validateToken() {
        const token = this.getAdminToken();
        if (!token) {
            this._logAuthEvent('TOKEN_VALIDATION_FAILED', { reason: 'No token found' });
            return false;
        }

        try {
            const response = await fetch(`${this.SERVER_URL}/api/admin/validate-token`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                this._logAuthEvent('TOKEN_EXPIRED', { token: token.substring(0, 10) + '...' });
                return false;
            }

            const isValid = response.ok;
            this._logAuthEvent('TOKEN_VALIDATION', {
                isValid,
                status: response.status
            });

            return isValid;
        } catch (error) {
            // Network errors during token validation should not cause logout
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                this._logAuthEvent('TOKEN_VALIDATION_NETWORK_ERROR', { error: error.message });
                // Assume token is still valid if we can't reach the server
                return true;
            }

            this._logAuthEvent('TOKEN_VALIDATION_ERROR', { error: error.message });
            return false;
        }
    }

    static async checkAndRedirect() {
        if (!this.isAdminAuthenticated()) {
            this._logAuthEvent('REDIRECT_UNAUTHENTICATED', {
                currentUrl: window.location.href
            });
            sessionStorage.setItem('intendedUrl', window.location.href);
            window.location.href = '/index.html';
            return false;
        }

        try {
            const isValid = await this.validateToken();
            if (!isValid) {
                this._logAuthEvent('REDIRECT_INVALID_TOKEN');
                this.adminLogout();
                return false;
            }
            return true;
        } catch (error) {
            this._logAuthEvent('CHECK_AND_REDIRECT_ERROR', { error: error.message });
            // On error, don't automatically logout - let user try again
            return true;
        }
    }

    // Utility method to handle network errors
    static _isNetworkError(error) {
        return error.name === 'TypeError' ||
            error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('Failed to fetch');
    }

    // Get authentication logs for debugging
    static getAuthLogs() {
        return JSON.parse(localStorage.getItem('auth_logs') || '[]');
    }

    // Clear authentication logs
    static clearAuthLogs() {
        localStorage.removeItem('auth_logs');
    }
}

export default AuthService;