import { useQuery } from "@tanstack/react-query";
import axios from "../lib/axios";
import { ILeague, IUser } from "../types";

interface User {
  id: number;
  fullname: string;
  photoURL: string;
  rank: number;
  registeredAt: string;
  totalMarks: number;
  username: string;
}

export const useUsersData = ({ initialUsers }) => {
  return useQuery(
    ["users"],
    async () => {
      const {
        data: { data: users },
      } = await axios.get("/users");
      return users as User[];
    },
    { initialData: initialUsers }
  );
};

export const useUserData = ({
  username,
  initalUserData,
}: {
  username: string;
  initalUserData: IUser;
}) => {
  return useQuery(
    ["user"],
    async () => {
      const { data } = await axios.get(`/users/username/${username}`);
      return data.data as IUser;
    },
    {
      refetchOnMount: false,
      cacheTime: 0,
      enabled: !!username,
      initialData: initalUserData,
    }
  );
};
export interface IUserStatsResponse {
  totalProblemsSolved: number;
  totalSubCount: number;
  league: ILeague;
  points: number;
  accuracy: number;
  dailySubmissions: { date: string; count: number }[];
  streaks: { date: string; count: number }[];
  longestStreak: { date: string; count: number }[];
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
