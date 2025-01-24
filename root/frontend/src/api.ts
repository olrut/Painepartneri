import axios from 'axios';

const baseURL = "http://localhost:8080";

const api = axios.create({
    baseURL: baseURL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const publicApi = axios.create({
    baseURL: baseURL,
});

export {api, publicApi};