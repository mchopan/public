/**
 * Configuration utility for loading environment variables
 * Since this is a frontend application, we'll load the .env file and make it available globally
 */

class Config {
    static _config = null;
    static _loaded = false;

    // Load configuration from .env file
    static async loadConfig() {
        if (this._loaded) {
            return this._config;
        }

        try {
            // Try to fetch the .env file
            const response = await fetch('/.env');
            if (response.ok) {
                const envContent = await response.text();
                this._config = this._parseEnvContent(envContent);
            } else {
                console.warn('Could not load .env file, using defaults');
                this._config = this._getDefaultConfig();
            }
        } catch (error) {
            console.warn('Error loading .env file:', error.message);
            this._config = this._getDefaultConfig();
        }

        this._loaded = true;
        
        // Make config available globally
        window.APP_CONFIG = this._config;
        
        console.log('Configuration loaded:', this._config);
        return this._config;
    }

    // Parse .env file content
    static _parseEnvContent(content) {
        const config = {};
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    // Remove quotes if present
                    config[key.trim()] = value.replace(/^["']|["']$/g, '');
                }
            }
        }
        
        return config;
    }

    // Default configuration fallback
    static _getDefaultConfig() {
        return {
            BACKEND_SERVER: 'https://quickloadbe.cogweel.com'
        };
    }

    // Get a specific config value
    static get(key, defaultValue = null) {
        if (!this._loaded) {
            console.warn('Config not loaded yet. Call loadConfig() first.');
            return defaultValue;
        }
        
        return this._config[key] || defaultValue;
    }

    // Get all config
    static getAll() {
        return this._config || {};
    }

    // Check if config is loaded
    static isLoaded() {
        return this._loaded;
    }
}

export default Config;
