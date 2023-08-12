import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import { IProblem, ISubmission, ISubmissionsQuery, Lang } from "../types";

// ------------- Fetch functions------------
export const getSubmissions = async ({
  skip,
  take,
  searchTerm,
  orderBy,
  asc,
}: ISubmissionsQuery) => {
  return axiosInstance.get(`/submissions`, {
    params: {
      skip,
      take,
      searchTerm,
      orderBy,
      asc,
    },
  });
};

export const getSubmission = async (
  submissionId: number,
  canFetch: boolean
) => {
  const result = await axiosInstance.get(`/submissions/${submissionId}`);
  return { data: result.data?.data, status: result.status } as {
    data: ISubmission & { nextProblem: IProblem };
    status: number;
  };
};

export const getLastSubmission = async (problemId: number) => {
  return axiosInstance.get(`/problems/${problemId}/getLastSubmission/`);
};

export const getLastSubmissionV2 = async (problemId: number, lang: Lang) => {
  const res = await axiosInstance.get(
    `/submissions/last?problemId=${problemId}&lang=${lang}`
  );
  return { data: res.data?.data, status: res.status };
};

export const getCurrentUserSubmissionForProblem = async (problemId: number) => {
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
};

// ------------- RQ hooks ------------
export const useSubmissionsData = (q: ISubmissionsQuery) => {
  return useQuery(["submissions", q], () => getSubmissions(q));
};

export const useSubmissionData = (submissionId: number, canFetch) => {
  return useQuery(
    ["submission", submissionId],
    () => getSubmission(submissionId, canFetch),
    { enabled: canFetch, retryOnMount: false, refetchOnMount: false }
  );
};

export const useLastSubmissionData = (
  problemId: number,
  onSuccessFn: (data: any) => void
) => {
  return useQuery(
    ["lastSubmission", problemId],
    () => getLastSubmission(problemId),
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
  lang: Lang,
  onSuccessFn: (data: any) => void,
  onErrorFn: (data: any) => void
) => {
  return useQuery(
    ["lastSubmission", problemId, lang],
    () => getLastSubmissionV2(problemId, lang),
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
    () => getCurrentUserSubmissionForProblem(problemId),
    {
      enabled: !!problemId,
      retryOnMount: false,
      refetchOnMount: false,
      cacheTime: 0,
    }
  );
};
