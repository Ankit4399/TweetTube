export const BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.BACKEND_URL;

// API base including version path. Axios calls use relative paths like
// "/users/register" so we append the server route prefix here to avoid
// hard-coding "/api/v1" throughout the app. Trailing slashes are trimmed.
export const API_BASE = BASE_URL
	? `${BASE_URL.replace(/\/$/, "")}/api/v1`
	: "/api/v1";
