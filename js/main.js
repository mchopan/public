import AuthService from './auth.js';
import ModalManager from './modal.js';

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is already logged in
    if (AuthService && AuthService.isAdminAuthenticated()) {
        updateUIForLoggedInUser();
    }

    // Modal functionality
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const appDownloadModal = document.getElementById('appDownloadModal');
    const closeButtons = document.querySelectorAll('.close');
    const dealerBtn = document.querySelector('.dealer-btn');
    const driverBtn = document.querySelector('.driver-btn');
    const modalManager = new ModalManager(loginModal, closeButtons[0]);

    // Login Modal
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginModal.style.display = 'block';
        });
    }

    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        loginForm.appendChild(errorMessage);

        loginForm.onsubmit = async function (e) {
            e.preventDefault();
            errorMessage.textContent = ''; // Clear previous errors

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Add loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';

            try {
                const result = await AuthService.adminLogin(username, password);
                if (result.success) {
                    modalManager.hide();
                    updateUIForLoggedInUser();
                    // Store the intended URL if available
                    const intendedUrl = sessionStorage.getItem('intendedUrl') || '/dashboard.html';
                    sessionStorage.removeItem('intendedUrl');
                    window.location.href = intendedUrl;
                }
            } catch (error) {
                errorMessage.textContent = error.message || 'Login failed. Please try again.';
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        };
    }

    // App Download Modal for hero buttons
    if (dealerBtn) {
        dealerBtn.addEventListener('click', () => {
            appDownloadModal.style.display = 'block';
        });
    }

    if (driverBtn) {
        driverBtn.addEventListener('click', () => {
            appDownloadModal.style.display = 'block';
        });
    }

    // Close button functionality for all modals
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            loginModal.style.display = 'none';
            appDownloadModal.style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (event.target === appDownloadModal) {
            appDownloadModal.style.display = 'none';
        }
    });

    // Mobile menu functionality
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navRight = document.querySelector('.nav-right');

    if (mobileMenuBtn && navRight) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navRight.classList.toggle('active');
        });
    }

    // Fade in elements as they come into view
    const observerOptions = {
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.service-card, .stat, .contact-container')
        .forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });
});

function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    const navLinks = document.querySelector('.nav-links');

    if (loginBtn && navLinks) {
        // Remove login button
        loginBtn.remove();
        // Add user menu
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';

        const user = AuthService.getAdminUser();
        userMenu.innerHTML = `
            <button class="user-menu-btn">
                <i class="fas fa-user"></i>
                ${user?.username || 'User'}
            </button>
            <div class="user-menu-dropdown">
                <a href="/dashboard.html">Dashboard</a>
                <a href="/profile.html">Profile</a>
                <button onclick="localStorage.removeItem('adminToken'); window.location.href = '/index.html';">Logout</button>
            </div>
        `;

        navLinks.appendChild(userMenu);
    }
} 