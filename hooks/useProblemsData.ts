import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

export interface IExam {
  id: number;
  slug: string;
  isBounded?: boolean;
  warnOnBlur?: boolean;
  title: string;
  active?: boolean;
  coverImg?: string;
  description?: string;
  durations?: number;
  endTime?: string;
  marks?: number;
  startTime?: string;
}
export interface IExamProblem {
  id: number;
  order: number;
  difficulty: string;
  description: string;
  tags: string[];
  examId: number;
  title: string;
  exam: IExam;
  testCases: any;
  starterCode?: string;
}

export interface IProblem extends IExamProblem {
  slug?: string;
  title: string;
  frontendProblemId?: number;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  status?: "" | "attempted" | "solved";
  acceptance?: number;
  tags: string[];
}

const queryFn = async (): Promise<any> => {
  const res = await axiosInstance.get("/problems");
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
};
export const useExamProblemsData = () => {
  return useQuery({ queryKey: ["problems"], queryFn });
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

export interface IProblemTag {
  id: number;
  name: string;
}
export const useTagsData = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/problems/tags");
      const tags = data.data as { tags: IProblemTag[]; count: number };
      return tags;
    },
  });
};
