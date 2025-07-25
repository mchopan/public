class LocationRatesService {
    // Get server URL from global config or fallback
    static get SERVER_URL() {
        return window.APP_CONFIG?.LOCATION_RATES_SERVER ||
            window.APP_CONFIG?.BACKEND_SERVER ||
            'https://quickloadbe.cogweel.com';
    }

    static async fetchAll() {
        try {
            console.log('Fetching location rates from:', `${this.SERVER_URL}/location-rates`);
            const response = await fetch(`${this.SERVER_URL}/location-rates`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return Array.isArray(data) ? data : data.rates || data.data || [];
        } catch (error) {
            console.error('Error fetching location rates:', error);
            throw error;
        }
    }

    static async add(formData) {
        try {
            console.log('Adding location rate:', formData);
            const response = await fetch(`${this.SERVER_URL}/location-rates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to add location rate`);
            }

            return response.json();
        } catch (error) {
            console.error('Error adding location rate:', error);
            throw error;
        }
    }

    static async update(id, formData) {
        try {
            console.log('Updating location rate:', id, formData);
            const response = await fetch(`${this.SERVER_URL}/location-rates/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to update location rate`);
            }

            return response.json();
        } catch (error) {
            console.error('Error updating location rate:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            console.log('Deleting location rate:', id);
            const response = await fetch(`${this.SERVER_URL}/location-rates/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to delete rate`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting location rate:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            console.log('Fetching location rate by ID:', id);
            const response = await fetch(`${this.SERVER_URL}/get-location-rates-by-id/${id}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch rate`);
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching location rate by ID:', error);
            throw error;
        }
    }
}

export default LocationRatesService;