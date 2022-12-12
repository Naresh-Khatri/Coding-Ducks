import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://ducks.panipuri.tech",
  // baseURL: "http://localhost:3333",
  transformRequest: [
    (data, headers) => {
      // modify data here
      if (typeof window !== "undefined") {
        const cookieText = document.cookie;
        const token = cookieText.split("token=")[1];
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        // console.log(headers['Authorization']);
      }
      return data;
    },
    ...axios.defaults.transformRequest,
  ],
  transformResponse: [
    ...axios.defaults.transformResponse,
    (data) => {
      // modify data here
      // clear cookie and cache and redirect to login page
      // console.log(data);
      if (data?.code == 401 && typeof window !== "undefined" && window.location.pathname != "/login") {
        window.location.href = "/login";
        // if (typeof window !== "undefined") {
        //   const cookieText = document.cookie;
        // }
      }
      return data;
    },
  ],
});

export default axiosInstance;
