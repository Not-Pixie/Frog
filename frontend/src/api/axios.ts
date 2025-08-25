import axios from "axios";
import * as authServices from "./auth/authServices"

const baseUrl = import.meta.env.ViTE_API_URL || "http://localhost:3001";
const timeout = Number(import.meta.env.VITE_API_TIMEOUT || 5000);

const api = axios.create(
    {
        baseURL: baseUrl,
        timeout: timeout,
        headers:
        {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        withCredentials: true,
    }
)

api.interceptors.request.use((config) => {
    const token = authServices.getAccessToken();
    if (token)
    {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use (
    r => r,
    async (error) =>
    {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry)
        {
            original._retry = true;
            try {
                const newToken = authServices.refresh();
                original.headers = original.headers || {};
                original.headers.Authorization = `Bearer ${newToken}`;
                return api(original);
            }
            catch (refreshErr)
            {return Promise.reject(refreshErr);}
        }
        return Promise.reject(error)
    }
)

export default api;