const API_URL = 'http://localhost:5001/api';

export const login = async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Errore durante il login');
    return data;
};

export const register = async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Errore durante la registrazione');
    return data;
};

export const googleLogin = async (token) => {
    const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Errore durante l\'autenticazione con Google');
    return data;
};

export const fetchDashboardData = async (userId, token) => {
    const response = await fetch(`${API_URL}/readings/dashboard/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
};

export const fetchChartData = async (userId, token, timeframe = '90days') => {
    const response = await fetch(`${API_URL}/readings/chart/${userId}?timeframe=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
};

export const fetchHistory = async (userId, token, page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/readings/history/${userId}?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
};

// User Profile APIs
export const fetchUserProfile = async (userId, token) => {
    const response = await fetch(`${API_URL}/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
};

export const updateUserProfile = async (userId, token, userData) => {
    const response = await fetch(`${API_URL}/users/profile/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
    });
    return response.json();
};

export const submitReading = async (userId, token, readingValue, date) => {
    const response = await fetch(`${API_URL}/readings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, readingValue, date })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Errore invio lettura');
    return data;
};

export const fetchAdvice = async (userId, token) => {
    const response = await fetch(`${API_URL}/readings/advice/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
};

// Admin APIs
export const fetchAdminStats = async (token) => {
    const response = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
};

export const fetchAdminMapData = async (token) => {
    const response = await fetch(`${API_URL}/admin/map`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
};

export const fetchAdminAlerts = async (token) => {
    const response = await fetch(`${API_URL}/admin/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
};
