import { useQuery } from "@tanstack/react-query";
import axios from "../lib/axios";
import { IUser, IUserStatsResponse } from "../types";

// ------------- Fetch functions------------
export const getUsers = async () => {
  const {
    data: { data: users },
  } = await axios.get("/users");
  return users as IUser[];
};
export const getUser = async (username: string) => {
  const { data } = await axios.get(`/users/username/${username}`);
  return data.data as IUser;
};
export const useUserData = (username: string) => {
  return useQuery(["user"], () => getUser(username), {
    refetchOnMount: false,
    cacheTime: 0,
    enabled: !!username,
  });
};

// ------------- RQ hooks ------------
export const useUsersData = () => {
  return useQuery(["users"], getUsers);
};

export const getUserStats = async (username: string) => {
  const { data } = await axios.get(`/users/username/${username}/stats`);
  return data.data as IUserStatsResponse;
};
export const useUserStats = (username: string) => {
  return useQuery(["userProgress", username], () => getUserStats(username), {
    refetchOnMount: false,
    enabled: !!username,
  });
};
