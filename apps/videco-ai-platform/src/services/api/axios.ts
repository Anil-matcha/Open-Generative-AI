import axios from "axios";
import { parseCookies } from "nookies";

const cookies = parseCookies();
export const axiosInstance = axios.create({
    baseURL: `http://localhost:3000/`,
    timeout: 30000,
    headers: {
        post: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        },
    },
});
