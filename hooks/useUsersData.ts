import { useQuery } from "@tanstack/react-query";
import axios from "../lib/axios";

interface User {
  id: number;
  fullname: string;
  photoURL: string;
  rank: number;
  registeredAt: string;
  totalMarks: number;
  username: string;
}

export const useUsersData = () => {
  return useQuery(["users"], () => axios.get("/users"));
};

export const useUserData = (username: string) => {
  return useQuery(["user"], () => axios.get(`/users/username/${username}`), {
    refetchOnMount: false,
    cacheTime: 0,
    enabled: !!username,
  });
};
export const useUserProgress = (username: string) => {
  return useQuery(
    ["userProgress", username],
    () => axios.get(`/users/username/${username}/progress`),
    {
      refetchOnMount: false,
      enabled: !!username,
    }
  );
};
export const useLastSubmissionData = (
  problemId: number,
  onSuccessFn: (data: any) => void
) => {
  return useQuery(
    ["lastSubmission", problemId],
    () => axios.get(`/problems/${problemId}/getLastSubmission/`),
    {
      onSuccess: onSuccessFn,
      enabled: false,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: false,
      retryOnMount: false,
      refetchOnMount: false,
    }
  );
};
