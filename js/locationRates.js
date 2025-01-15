class LocationRatesService {
    static SERVER_URL = 'http://185.199.52.115:4100';
    static async fetchAll() {
        const response = await fetch(`${this.SERVER_URL}/location-rates`);
        const data = await response.json();
        return Array.isArray(data) ? data : data.rates || data.data || [];
    }

    static async add(formData) {
        const response = await fetch(`${this.SERVER_URL}/location-rates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to add location rate');
        return response.json();
    }

    static async update(id, formData) {
        const response = await fetch(`${this.SERVER_URL}/location-rates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to update location rate');
        return response.json();
    }

    static async delete(id) {
        const response = await fetch(`${this.SERVER_URL}/location-rates/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete rate');
        }

        return await response.json();
    }

    static async getById(id) {
        const response = await fetch(`${this.SERVER_URL}/get-location-rates-by-id/${id}`);
        if (!response.ok) throw new Error('Failed to fetch rate');
        return response.json();
    }
}

export default LocationRatesService; 