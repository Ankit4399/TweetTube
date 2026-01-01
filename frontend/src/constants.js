// In development, always use relative paths to leverage Vite proxy
// In production, use environment variable if set
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

// API base including version path. Axios calls use relative paths like
// "/users/register" so we append the server route prefix here to avoid
// hard-coding "/api/v1" throughout the app.
// 
// IMPORTANT: In development, use relative path "/api/v1" so Vite proxy works
// In production, use VITE_BACKEND_URL if set, otherwise use relative path
export const API_BASE = (import.meta.env.PROD && BASE_URL)
	? `${BASE_URL.replace(/\/$/, "")}/api/v1`
	: "/api/v1";
