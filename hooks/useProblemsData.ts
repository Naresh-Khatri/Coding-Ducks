import { useMutation, useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import { IExam, IExamProblem, IProblem, IProblemTag } from "../types";

export const useAllProblemsData = (allowExams = false) => {
  return useQuery({
    queryKey: ["problems", allowExams],
    queryFn: async (): Promise<any> => {
      const res = await axiosInstance.get(
        `/problems${allowExams ? "?allowExams=true" : ""}`
      );
      const problems: IExamProblem[] = res.data;
      const examsList: IExam[] = [];
      problems?.forEach((problem) => {
        if (!examsList.find((e) => e.id === problem.examId))
          examsList.push({
            id: problem?.examId,
            title: problem.exam?.title,
            slug: problem.exam?.slug,
          });
      });
      return { problems, examsList } as {
        problems: IExamProblem[];
        examsList: IExam[];
      };
    },
    refetchOnWindowFocus: false,
  });
};

interface IProblemsQueryParams {
  q?: string;
  sortBy?: string;
  orderBy?: "asc" | "desc";
  skip: number;
  limit: number;
}

export const useProblemsData = (params: IProblemsQueryParams) => {
  return useQuery({
    queryKey: ["pageProblems", params],
    queryFn: async () => {
      //we have nexted data objects
      const {
        data: { data },
      } = await axiosInstance.get("/problems/page", { params });
      const { problemsList, count } = data as {
        problemsList: IProblem[];
        count: number;
      };
      return { problemsList, count };
    },
  });
};

export const useProblemData = ({ slug }: { slug: string }) => {
  return useQuery({
    queryKey: ["problem", slug],
    enabled: slug != undefined,
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/problems/slug/${slug}`);
      const problem = data.data as IProblem;
      return problem;
    },
  });
};

export interface IRatingUser {
  id: number;
  username: string;
  photoURL?: string;
}
export interface IRating {
  rating: {
    likes: IRatingUser[];
    dislikes: IRatingUser[];
  };
  userRating: "like" | "dislike" | "none" | null;
}
export const useProblemRatingData = ({ problemId }: { problemId: number }) => {
  return useQuery({
    queryKey: ["ratings", problemId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/problems/${problemId}/ratings`
      );
      const ratings = data.data;
      return ratings as IRating;
    },
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
    queryFn: async () => {
      const { data } = await axiosInstance.get("/problems/tags");
      const tags = data.data as { tags: IProblemTag[]; count: number };
      return tags;
    },
    refetchOnWindowFocus: false,
  });
};
