import axios from "axios";

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

api.interceptors.request.use(
    res => res,
    error =>{
        console.error("API Request Error:", error.response || error);
        return Promise.reject(error);
    }
);

export default api;