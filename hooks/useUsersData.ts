import { useQuery } from "@tanstack/react-query";
import axios from "../lib/axios";
import { ILeague, IUser } from "../types";
import { Activity } from "react-activity-calendar";

interface User {
  id: number;
  fullname: string;
  photoURL: string;
  rank: number;
  registeredAt: string;
  totalMarks: number;
  username: string;
}

export const getUsers = async () => {
  const {
    data: { data: users },
  } = await axios.get("/users");
  return users as User[];
};
export const getUser = async (username: string) => {
  const { data } = await axios.get(`/users/username/${username}`);
  return data.data as IUser;
};

export const useUsersData = ({ initialUsers }) => {
  return useQuery(["users"], getUsers, {
    initialData: initialUsers,
    cacheTime: 20000,
  });
};

interface useUserDataProps {
  username: string;
  initalUserData: IUser;
}
export const useUserData = ({ username, initalUserData }: useUserDataProps) => {
  return useQuery(["user"], () => getUser(username), {
    refetchOnMount: false,
    cacheTime: 0,
    enabled: !!username,
    initialData: initalUserData,
  });
};
export interface IUserStatsResponse {
  totalProblemsSolved: number;
  totalSubCount: number;
  rank: number;
  league: ILeague;
  points: number;
  accuracy: number;
  dailySubmissions: Activity[];
  streaks: { date: string; count: number }[][];
  longestStreak: number;
  streakActive: boolean;
  byExamId: any;
}
export const useUserStats = ({
  username,
  initalUserStats,
}: {
  username: string;
  initalUserStats: null | IUserStatsResponse;
}) => {
  return useQuery(
    ["userProgress", username],
    async () => {
      const { data } = await axios.get(`/users/username/${username}/stats`);
      return data.data as IUserStatsResponse;
    },
    {
      refetchOnMount: false,
      enabled: !!username,
      initialData: initalUserStats,
    }
  );
};
