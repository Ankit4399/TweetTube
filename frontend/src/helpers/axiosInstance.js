import axios from "axios";
import {API_BASE} from "../constants.js";

const axiosInstance = axios.create();

// Use API_BASE (includes /api/v1) so frontend calls like
// axiosInstance.post('/users/register') resolve to
// http://.../api/v1/users/register
axiosInstance.defaults.baseURL = API_BASE;
axiosInstance.defaults.withCredentials = true;

export default axiosInstance;
