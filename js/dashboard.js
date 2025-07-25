import LocationRatesService from './locationRates.js';
import ModalManager from './modal.js';
import requireAuth from './authMiddleware.js';
import AuthService from './auth.js';
import Config from './config.js';

function loadUserProfile() {
    const adminData = JSON.parse(localStorage.getItem('quickload_admin'));
    if (adminData) {
        document.getElementById('profileUsername').textContent = adminData.username;
        document.getElementById('profileRole').textContent = adminData.role;
    }
}

document.addEventListener('DOMContentLoaded', loadUserProfile);

class DashboardUI {
    constructor() {
        // Initialize table body reference
        this.tableBody = document.getElementById('ratesTableBody');

        // Initialize form references
        this.locationRateForm = document.getElementById('locationRateForm');
        this.editForm = document.getElementById('editForm');

        // Initialize modal
        this.modalManager = new ModalManager(
            document.getElementById('editModal'),
            document.querySelector('.close')
        );

        // New header initialization
        this.initializeHeader();

        // Bind event listeners
        this.locationRateForm.addEventListener('submit', this.handleAddRate.bind(this));
        this.editForm.addEventListener('submit', this.handleEditRate.bind(this));

        // Load initial data
        this.loadLocationRates();
    }

    initializeHeader() {
        // Search functionality
        const searchInput = document.querySelector('#locationSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('#ratesTableBody tr');

                rows.forEach(row => {
                    const fromLocation = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
                    const toLocation = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
                    const vehicleType = row.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';

                    if (fromLocation.includes(searchTerm) ||
                        toLocation.includes(searchTerm) ||
                        vehicleType.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        }

        // Notifications
        const notificationsBtn = document.querySelector('.notifications-btn');
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', this.handleNotifications.bind(this));
        }

        // User Profile Dropdown
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.addEventListener('click', this.handleUserProfileDropdown.bind(this));
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', this.handleClickOutside.bind(this));

        // Load user data
        this.loadUserData();

        // Add main logout button
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'logout-btn';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
            headerRight.appendChild(logoutBtn);
        }
    }

    async loadUserData() {
        try {
            const adminData = JSON.parse(localStorage.getItem('quickload_admin'));
            if (adminData) {
                const userNameElement = document.querySelector('.user-name');
                const userRoleElement = document.querySelector('.user-role');
                const avatarElement = document.querySelector('.avatar');

                if (userNameElement) userNameElement.textContent = adminData.username || 'User';
                if (userRoleElement) userRoleElement.textContent = adminData.role || 'Administrator';
                if (avatarElement && adminData.avatar) avatarElement.src = adminData.avatar;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const rows = this.tableBody.getElementsByTagName('tr');

        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    handleNotifications() {
        // Create notifications dropdown if it doesn't exist
        let notificationsDropdown = document.querySelector('.notifications-dropdown');

        if (!notificationsDropdown) {
            notificationsDropdown = document.createElement('div');
            notificationsDropdown.className = 'notifications-dropdown';
            notificationsDropdown.innerHTML = `
                <div class="dropdown-header">
                    <h3>Notifications</h3>
                    <button class="mark-all-read">Mark all as read</button>
                </div>
                <div class="notifications-list">
                    <div class="notification-item unread">
                        <i class="fas fa-info-circle"></i>
                        <div class="notification-content">
                            <p>New location rate added</p>
                            <span class="notification-time">2 minutes ago</span>
                        </div>
                    </div>
                    <!-- Add more notification items as needed -->
                </div>
            `;

            const notificationsBtn = document.querySelector('.notifications-btn');
            notificationsBtn.parentNode.appendChild(notificationsDropdown);
        } else {
            notificationsDropdown.classList.toggle('show');
        }
    }

    handleUserProfileDropdown() {
        let userDropdown = document.querySelector('.user-dropdown');

        if (!userDropdown) {
            userDropdown = document.createElement('div');
            userDropdown.className = 'user-dropdown';
            userDropdown.innerHTML = `
                <div class="dropdown-item">
                    <i class="fas fa-user"></i>
                    <span>Profile</span>
                </div>
                <div class="dropdown-item">
                    <i class="fas fa-cog"></i>
                    <span>Settings</span>
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item logout">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </div>
            `;

            const userProfile = document.querySelector('.user-profile');
            userProfile.parentNode.appendChild(userDropdown);

            // Add logout functionality
            const logoutItems = userDropdown.querySelectorAll('.logout');
            logoutItems.forEach(item => {
                item.addEventListener('click', this.handleLogout.bind(this));
            });
        } else {
            userDropdown.classList.toggle('show');
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                // Clear localStorage
                localStorage.removeItem('quickload_admin');
                localStorage.removeItem('adminToken');

                // Redirect to login page
                window.location.href = '/index.html';
            } catch (error) {
                console.error('Error during logout:', error);
                alert('Error during logout. Please try again.');
            }
        }
    }

    handleClickOutside(event) {
        // Close notifications dropdown
        if (!event.target.closest('.notifications-btn')) {
            const notificationsDropdown = document.querySelector('.notifications-dropdown');
            if (notificationsDropdown?.classList.contains('show')) {
                notificationsDropdown.classList.remove('show');
            }
        }

        // Close user profile dropdown
        if (!event.target.closest('.user-profile')) {
            const userDropdown = document.querySelector('.user-dropdown');
            if (userDropdown?.classList.contains('show')) {
                userDropdown.classList.remove('show');
            }
        }
    }

    async handleAddRate(e) {
        e.preventDefault();
        const formData = {
            fromLocation: document.getElementById('fromLocation').value,
            toLocation: document.getElementById('toLocation').value,
            vehicleType: document.getElementById('vehicleType').value,
            price: Number(document.getElementById('price').value)
        };

        console.log('Form data:', formData);

        try {
            await LocationRatesService.add(formData);
            alert('Location rate added successfully!');
            this.loadLocationRates();
            e.target.reset();
        } catch (error) {
            console.error('Error adding rate:', error);
            alert('Error: ' + error.message);
        }
    }

    async handleEditRate(event) {
        event.preventDefault();
        try {
            const formData = this.getFormData(true); // Pass true for edit mode
            await LocationRatesService.update(formData.id, formData);
            this.modalManager.hide();
            await this.loadLocationRates(); // Refresh the table
            alert('Rate updated successfully!');
        } catch (error) {
            console.error('Error updating rate:', error);
            alert('Error: ' + error.message);
        }
    }

    getFormData(isEdit = false) {
        const prefix = isEdit ? 'edit' : '';
        const fromLocation = document.getElementById(`${prefix}FromLocation`);
        const toLocation = document.getElementById(`${prefix}ToLocation`);
        const vehicleType = document.getElementById(`${prefix}VehicleType`);
        const price = document.getElementById(`${prefix}Price`);
        const id = document.getElementById(`${prefix}Id`);

        if (!fromLocation || !toLocation || !vehicleType || !price) {
            throw new Error('Required form fields are missing');
        }

        const formData = {
            fromLocation: fromLocation.value,
            toLocation: toLocation.value,
            vehicleType: vehicleType.value,
            price: price.value
        };

        if (isEdit && id) {
            formData.id = id.value;
        }

        return formData;
    }

    async loadLocationRates() {
        try {
            const rates = await LocationRatesService.fetchAll();
            console.log('Fetched rates:', rates);
            this.renderRates(rates);
        } catch (error) {
            console.error('Error loading location rates:', error);
            this.showError();
        }
    }

    renderRates(rates) {
        if (rates.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No rates found</td></tr>';
            return;
        }
        this.tableBody.innerHTML = '';
        rates.forEach((rate) => {
            console.log('Creating rate row for:', rate);
            this.tableBody.innerHTML += this.createRateRow(rate);
        });
        this.attachRowEventListeners();
    }

    createRateRow(rate) {
        return `
            <tr data-id="${rate._id || rate.id}">
                <td>${rate.fromLocation}</td>
                <td>${rate.toLocation}</td>
                <td>${rate.vehicleType}</td>
                <td>${rate.price}</td>
                <td class="action-buttons">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            </tr>
        `;
    }

    showError(message = 'An error occurred while loading rates') {
        this.tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: red;">
                    ${message}
                </td>
            </tr>
        `;
    }

    attachRowEventListeners() {
        // Attach edit button listeners
        this.tableBody.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const rateId = row.dataset.id;
                this.handleEditClick(row, rateId);
            });
        });

        // Attach delete button listeners
        this.tableBody.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const rateId = row.dataset.id;
                this.handleDeleteClick(rateId);
            });
        });
    }

    handleEditClick(row, rateId) {
        // Populate the edit form with current values
        document.getElementById('editId').value = rateId;
        document.getElementById('editFromLocation').value = row.cells[0].textContent;
        document.getElementById('editToLocation').value = row.cells[1].textContent;
        document.getElementById('editVehicleType').value = row.cells[2].textContent;
        document.getElementById('editPrice').value = row.cells[3].textContent;

        // Show the edit modal
        this.modalManager.show();
    }

    async handleDeleteClick(rateId) {
        if (confirm('Are you sure you want to delete this rate?')) {
            try {
                await LocationRatesService.delete(rateId);
                alert('Rate deleted successfully!');
                this.loadLocationRates(); // Refresh the table
            } catch (error) {
                console.error('Error deleting rate:', error);
                alert('Error: ' + error.message);
            }
        }
    }

    // ... (Additional UI methods)
}

// Add these styles to your dashboard.css
const styles = `
    /* Dropdown Styles */
    .notifications-dropdown,
    .user-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        min-width: 250px;
        display: none;
        z-index: 1000;
    }

    .notifications-dropdown.show,
    .user-dropdown.show {
        display: block;
    }

    .dropdown-header {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .dropdown-header h3 {
        margin: 0;
        font-size: 1rem;
    }

    .mark-all-read {
        color: var(--accent-color);
        background: none;
        border: none;
        font-size: 0.875rem;
        cursor: pointer;
    }

    .notifications-list {
        max-height: 300px;
        overflow-y: auto;
    }

    .notification-item {
        padding: 1rem;
        display: flex;
        gap: 1rem;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
    }

    .notification-item:hover {
        background-color: var(--bg-light);
    }

    .notification-item.unread {
        background-color: rgba(61, 90, 128, 0.05);
    }

    .notification-content p {
        margin: 0;
        font-size: 0.875rem;
    }

    .notification-time {
        font-size: 0.75rem;
        color: var(--text-light);
    }

    .dropdown-item {
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
    }

    .dropdown-item:hover {
        background-color: var(--bg-light);
    }

    .dropdown-item i {
        color: var(--text-light);
        width: 1rem;
    }

    .dropdown-divider {
        height: 1px;
        background-color: var(--border-color);
        margin: 0.5rem 0;
    }

    .logout {
        color: var(--danger-color);
    }

    .logout i {
        color: var(--danger-color);
    }
`;

// Add styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Initialize dashboard with auth check
document.addEventListener('DOMContentLoaded', async () => {
    // Load configuration first
    try {
        await Config.loadConfig();
        console.log('Dashboard: Configuration loaded successfully');
    } catch (error) {
        console.error('Dashboard: Failed to load configuration:', error);
    }

    if (requireAuth()) {
        new DashboardUI();
    }
});