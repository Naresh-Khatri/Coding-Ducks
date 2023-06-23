import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

export const useExamsData = () => {
  return useQuery(["exams"], async () => {
    const res = await axiosInstance.get("/exams");
    return res.data;
  });
};

export const useExamData = (examSlug: string) => {
  return useQuery(["exam", examSlug], () =>
    axiosInstance.get(`/exams/slug/${examSlug}`)
  );
};

export const useExamProblemsData = ({ examId }: { examId: number }) => {
  return useQuery(
    ["examProblems", examId],
    () => axiosInstance.get(`/problems/examProblems/${examId}`),
    { refetchOnMount: false, enabled: !!examId }
  );
};
export const useExamSubmissionsData = (examId: number) => {
  return useQuery(
    ["userSubmissions", examId],
    () => {
      return axiosInstance.get(`/exams/getProgress/${examId}`);
    },
    { enabled: !!examId }
  );
};
