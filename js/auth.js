class AuthService {
    static SERVER_URL = 'http://localhost:4100';
    static async adminLogin(username, password) {
        try {
            console.log('Admin login attempt with username:', ` ${this.SERVER_URL}/api/admin/login`);
            const response = await fetch(`${this.SERVER_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Admin login failed');
            }

            const data = await response.json();


            console.log('Admin login data:', data);
            // Store the admin token and info in localStorage
            if (data.token) {
                localStorage.setItem('quickload_admin', JSON.stringify(data.user));
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user.username));
            }

            return { success: true, admin: data.admin };
        } catch (error) {
            console.error('Admin login error:', error);
            throw error;
        }
    }

    static isAdminAuthenticated() {
        return !!localStorage.getItem('adminToken');
    }

    static adminLogout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login.html';
    }

    static getAdminToken() {
        return localStorage.getItem('adminToken');
    }

    static getAdminUser() {
        const admin = localStorage.getItem('adminUser');
        console.log('Admin user:', admin);
        return admin ? JSON.parse(admin) : null;
    }

    static async getAdminProfile(adminId) {
        try {
            const response = await fetch(`${this.SERVER_URL}/api/admin/profile/${adminId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAdminToken()}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch admin profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching admin profile:', error);
            throw error;
        }
    }

    static async validateToken() {
        const token = this.getAdminToken();
        if (!token) return false;

        try {
            const response = await fetch(`${this.SERVER_URL}/api/admin/validate-token`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    static async checkAndRedirect() {
        if (!this.isAdminAuthenticated()) {
            sessionStorage.setItem('intendedUrl', window.location.href);
            window.location.href = '/index.html';
            return false;
        }

        const isValid = await this.validateToken();
        if (!isValid) {
            this.adminLogout();
            return false;
        }
        return true;
    }
}

export default AuthService; 