import axios from 'axios';

const guestApi = axios.create({
    baseURL: 'http://localhost:8080/api'
});

guestApi.interceptors.request.use((config) => {
    const stored = localStorage.getItem('guestAuth');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed?.token) {
                config.headers.Authorization = `Bearer ${parsed.token}`;
            }
        } catch (error) {
            localStorage.removeItem('guestAuth');
        }
    }
    return config;
});

guestApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const data = error?.response?.data;
        if (data && typeof data === 'object') {
            error.validation = {
                message: data.message || 'Request failed',
                status: data.status || error?.response?.status,
                errors: data.errors || {}
            };
        }
        return Promise.reject(error);
    }
);

export default guestApi;
