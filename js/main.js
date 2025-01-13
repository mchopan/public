import AuthService from './auth.js';
import ModalManager from './modal.js';

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is already logged in
    if (AuthService.isAdminAuthenticated()) {
        updateUIForLoggedInUser();
    }

    const loginModal = document.getElementById('loginModal');
    const closeBtn = document.querySelector('.close');
    const modalManager = new ModalManager(loginModal, closeBtn);

    // Login button handler
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.onclick = () => modalManager.show();

    // Login form handler
    const loginForm = document.getElementById('loginForm');
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
                console.log('Intended URL:', intendedUrl);
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

    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar')) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        });
    });
});

function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    const navLinks = document.querySelector('.nav-links');

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
            <button onclick="AuthService.logout()">Logout</button>
        </div>
    `;

    navLinks.appendChild(userMenu);
} 