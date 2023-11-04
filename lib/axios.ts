import axios from "axios";
import { auth } from "../firebase/firebase";

export const baseURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3333"
    : // "http://192.168.31.197:3333"
      "https://api2.codingducks.live";

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
      await new Promise((res) => {
        const unsub = auth.onAuthStateChanged((user) => {
          unsub();
          res(user);
        });
      });

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

// const loadScript = (src: string, callback: (err: string, ) => void) => {
//   const script = document.createElement("script");
//   script.src = src;
//   document.head.appendChild(script);

//   script.onload = () => callback()
//   script.onerror = () => callback(throw('lol'))

// };

// loadScript("http://codingducks.live", () => {
//   loadScript("https://codingducks2.live",)
// });
