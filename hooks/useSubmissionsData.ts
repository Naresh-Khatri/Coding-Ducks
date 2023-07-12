import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import { ISubmission } from "../types";
import { auth } from "../firebase/firebase";

export interface ISubmissionsQuery {
  skip: number;
  take: number;
  searchTerm: string;
  orderBy: string;
  asc: boolean;
}

export const useSubmissionsData = ({
  skip,
  take,
  searchTerm,
  orderBy,
  asc,
}: ISubmissionsQuery) => {
  return useQuery(
    ["submissions", { skip, take, searchTerm, orderBy, asc }],
    () =>
      axiosInstance.get(`/submissions`, {
        params: {
          skip,
          take,
          searchTerm,
          orderBy,
          asc,
        },
      })
  );
};

export const useSubmissionData = (submissionId: number, canFetch) => {
  return useQuery(
    ["submission", submissionId],
    async () => {
      const result = await axiosInstance.get(`/submissions/${submissionId}`);
      return { data: result.data?.data, status: result.status } as {
        data: ISubmission;
        status: number;
      };
    },
    { enabled: canFetch, retryOnMount: false, refetchOnMount: false }
  );
};

export const useLastSubmissionData = (
  problemId: number,
  onSuccessFn: (data: any) => void
) => {
  return useQuery(
    ["lastSubmission", problemId],
    () => axiosInstance.get(`/problems/${problemId}/getLastSubmission/`),
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

export const useLastSubmissionDataV2 = (
  problemId: number,
  lang: string,
  onSuccessFn: (data: any) => void,
  onErrorFn: (data: any) => void
) => {
  return useQuery(
    ["lastSubmission", problemId, lang],
    async () => {
      const res = await axiosInstance.get(
        `/submissions/last?problemId=${problemId}&lang=${lang}`
      );
      return { data: res.data?.data, status: res.status };
    },
    {
      onSuccess: onSuccessFn,
      retry: false,
      onError: onErrorFn,
      enabled: false,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: false,
      retryOnMount: false,
      refetchOnMount: false,
    }
  );
};

export const useCurrentUserSubmissionDataForProblem = (problemId: number) => {
  return useQuery(
    ["submission", problemId],
    async () => {
      try {
        const res = await axiosInstance.get(
          `/submissions/current-user/${problemId}`
        );
        return { data: res.data?.data, status: res.status } as {
          data: ISubmission[] | null;
          status: number;
        };
      } catch (err) {
        return { data: null, status: 404 };
      }
    },
    {
      enabled: !!problemId,
      retryOnMount: false,
      refetchOnMount: false,
      cacheTime: 0,
    }
  );
};
