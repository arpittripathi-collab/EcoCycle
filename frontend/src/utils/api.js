export const API_BASE_URL = 'http://localhost:5000/api';

const request = async (endpoint, method = 'GET', data = null) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const isFormData = data instanceof FormData;

    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        method,
        headers,
        body: isFormData ? data : (data ? JSON.stringify(data) : null),
    };

    try {
        const response = await fetch(url, config);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'API request failed');
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Auth
export const login = (email, password) => request('/auth/login', 'POST', { email, password });
export const signup = (formData) => request('/auth/signup', 'POST', formData);

export const createItem = (formData) => request('/items', 'POST', formData);
// getItems no longer needs an argument
export const getItems = () => request(`/items`); 

// Match
export const findMatches = (matchData) => request('/match', 'POST', matchData);