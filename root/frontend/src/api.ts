import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

const api = axios.create({
    baseURL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const publicApi = axios.create({
    baseURL,
});

export {api, publicApi};
