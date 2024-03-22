import { useQuery } from "@tanstack/react-query";
import axios from "../lib/axios";
import { IUser, IUserStatsResponse } from "../types";
import { ISocketRoom, ISocketUser } from "../lib/socketio/socketEvents";

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
export const getUsersSearch = async (username: string) => {
  const { data } = await axios.get(`/users/search/username/${username}`);
  return data.data as ISocketUser[];
};
const getUserRooms = async ({ userId }: { userId: number }) => {
  const data = await axios.get(`/users/${userId}/rooms`);
  return data;
};

// ------------- RQ hooks ------------
export const useUserData = (username: string) => {
  return useQuery(["user"], () => getUser(username), {
    refetchOnMount: false,
    cacheTime: 0,
    enabled: !!username,
  });
};

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

export const useUsersSearch = (username: string) => {
  return useQuery(["userSearch", username], () => getUsersSearch(username), {
    refetchOnMount: false,
    enabled: false,
  });
};

export const useUserRoomsData = ({ userId }: { userId: number }) =>
  useQuery(
    ["user", "rooms", userId],
    async () => {
      const { data } = await getUserRooms({ userId });
      return data as ISocketRoom[];
    },
    { refetchInterval: 10000 }
  );
