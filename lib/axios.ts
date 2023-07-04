import axios from "axios";
import { auth } from "../firebase/firebase";

const baseURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3333"
    : "https://api.codingducks.live";

const axiosInstance = axios.create({
  baseURL,
  transformResponse: [
    (response) => {
      const res = JSON.parse(response);
      if (res.code == 401 && typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return res;
    },
  ],
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // wait for 1 second if user is not found on reload
      if (!auth?.currentUser) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      const token = await auth?.currentUser?.getIdToken();
      if (token) config.headers["Authorization"] = `Bearer ${token}`;
      return config;
    } catch (e) {
      console.log(e);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
