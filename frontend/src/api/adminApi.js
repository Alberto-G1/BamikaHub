import axios from 'axios';

const adminApi = axios.create({
    baseURL: 'http://localhost:8080/internal'
});

adminApi.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

adminApi.interceptors.response.use((response) => response, (error) => {
    const data = error?.response?.data;
    if (data && typeof data === 'object') {
        error.validation = {
            message: data.message || 'Request failed',
            status: data.status || error?.response?.status,
            errors: data.errors || {}
        };
    }
    return Promise.reject(error);
});

export default adminApi;
