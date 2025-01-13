import LocationRatesService from './locationRates.js';
import ModalManager from './modal.js';
import requireAuth from './authMiddleware.js';

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

        // Bind event listeners
        this.locationRateForm.addEventListener('submit', this.handleAddRate.bind(this));
        this.editForm.addEventListener('submit', this.handleEditRate.bind(this));

        // Load initial data
        this.loadLocationRates();
    }

    initializeElements() {
        this.tableBody = document.getElementById('ratesTableBody');
        this.editModal = document.getElementById('editModal');
        this.modalManager = new ModalManager(
            this.editModal,
            document.querySelector('.close')
        );
    }

    setupEventListeners() {
        document.getElementById('locationRateForm')
            .addEventListener('submit', (e) => this.handleAddRate(e));

        document.getElementById('editForm')
            .addEventListener('submit', (e) => this.handleEditRate(e));
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

// Initialize dashboard with auth check
document.addEventListener('DOMContentLoaded', () => {
    if (requireAuth()) {
        new DashboardUI();
    }
}); 