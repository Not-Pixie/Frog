import axios from 'axios';
import { LOGOUT, ME, REFRESH } from '../enpoints';

const raw = axios.create(
    {
        baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
        headers:
        {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        withCredentials: true,
    }
)    

let accessToken: string | null = null;
let isRefreshing = false;
type QueueItem = {resolve: (token: string) => void, reject: (err: any) => void};
let queue: QueueItem[] = [];

export function getAccessToken() { return accessToken; }
export function setAccessToken(token: string | null) {
    accessToken = token;
    // console.log("token ->", token);
    if (token) {
        raw.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete raw.defaults.headers.common['Authorization'];
    }
}

export async function refresh(): Promise<string>{
    if(isRefreshing)
        return new Promise((resolve, reject)=>queue.push({resolve, reject}))

    isRefreshing = true;

    try{
        const res = await raw.post(REFRESH);
        const newToken: string = res.data?.access_token;
        setAccessToken(newToken);

        queue.forEach(q => q.resolve(newToken));
        queue = [];
        isRefreshing = false;
        return newToken;
    }
    catch (err)
    {
        queue.forEach(q=>q.reject(err));
        queue = [];
        isRefreshing = false;
        setAccessToken(null);
        throw err;
    }
}

export async function fetchCurrentUser(): Promise<{usuario: any} | null> {
    try {
        const res = await raw.get(ME);
        return res.data ?? null
    }
    catch (err: any)
    {
        if (err?.response?.status === 401)
        {
            try {
                await refresh();
                const res2 = await raw.get(ME)
                return res2.data ?? null;
            }
            catch (e){
                return null;
            }
        }
        throw err;
    }
}

export async function logoutServer(): Promise<void> {
    try {
        await raw.post(LOGOUT);
    }
    catch (_) {}
    setAccessToken(null)
}

