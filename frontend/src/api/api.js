import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

// Normalize backend validation errors for easier consumption by UI
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const data = error?.response?.data;
        if (data && typeof data === 'object') {
            error.validation = {
                message: data.message || 'Request failed',
                status: data.status || error?.response?.status,
                errors: data.errors || {},
            };
        }
        return Promise.reject(error);
    }
);

export default api;
