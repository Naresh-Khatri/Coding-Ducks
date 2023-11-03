import { useMutation, useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import {
  IExam,
  IExamProblem,
  IProblem,
  IProblemTag,
  IRating,
  IUser,
} from "../types";

// ------------- Fetch functions ------------
export const getAllProblems = async (allowExams: boolean) => {
  const { data: problems }: { data: IExamProblem[] } = await axiosInstance.get(
    `/problems${allowExams ? "?allowExams=true" : ""}`
  );

  const { data: examsList }: { data: IExam[] } = await axiosInstance.get(
    `/exams/`
  );
  console.log(examsList);
  return { problems, examsList } as {
    problems: IExamProblem[];
    examsList: IExam[];
  };
};

interface IProblemsQueryParams {
  q?: string;
  sortBy?: string;
  orderBy?: "asc" | "desc";
  skip: number;
  limit: number;
}
export const getProblems = async ({
  params,
}: {
  params: IProblemsQueryParams;
}) => {
  const {
    data: { data },
  } = await axiosInstance.get("/problems/page", { params });
  const { problemsList, count } = data as {
    problemsList: IProblem[];
    count: number;
  };
  return { problemsList, count };
};

export const getProblem = async (problemSlug: string) => {
  const { data } = await axiosInstance.get(`/problems/slug/${problemSlug}`);
  const problem = data.data as IProblem;
  return problem;
};
export const getProblemSolvedBy = async (problemId: number) => {
  const { data } = await axiosInstance.get(`/problems/${problemId}/solvedBy`);
  const problem = data.data as (IUser & { solvedAt: string })[];
  return problem;
};

export const getProblemRating = async (problemId: number) => {
  const { data } = await axiosInstance.get(`/problems/${problemId}/ratings`);
  const ratings = data.data;
  return ratings as IRating;
};

export const getTags = async () => {
  const { data } = await axiosInstance.get("/problems/tags");
  const tags = data.data as { tags: IProblemTag[]; count: number };
  return tags;
};

// ------------- RQ hooks ------------
export const useAllProblemsData = (allowExams = false) => {
  return useQuery({
    queryKey: ["problems", allowExams],
    queryFn: () => getAllProblems(allowExams),
    refetchOnWindowFocus: false,
  });
};

export const useProblemsData = (params: IProblemsQueryParams) => {
  return useQuery({
    queryKey: ["pageProblems", params],
    queryFn: () => getProblems({ params }),
  });
};

export const useProblemData = ({ slug }: { slug: string }) => {
  return useQuery({
    queryKey: ["problem", slug],
    queryFn: () => getProblem(slug),
    enabled: slug != undefined,
  });
};

export const useProblemSolvedByData = (problemId: number, enabled: boolean) => {
  return useQuery({
    queryKey: ["solvedBy", problemId],
    queryFn: () => getProblemSolvedBy(problemId),
    enabled,
  });
};

export const useProblemRatingData = ({ problemId }: { problemId: number }) => {
  return useQuery({
    queryKey: ["ratings", problemId],
    queryFn: () => getProblemRating(problemId),
  });
};

// use onSuccess to refetch the ratings
export const useUpdateProblemRating = ({
  problemId,
  action,
  onSuccess,
}: {
  problemId: number;
  action: "like" | "dislike" | "remove";
  onSuccess?: (data: any) => void;
}) => {
  return useMutation({
    mutationKey: ["updateLikeDislike", problemId, action],
    mutationFn: async () => {
      const payload = { problemId, action };
      const { data } = await axiosInstance.patch(
        `/problems/${problemId}/ratings`,
        payload
      );
      return data.data;
    },
    onSuccess,
  });
};

export const useTagsData = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
    refetchOnWindowFocus: false,
  });
};
