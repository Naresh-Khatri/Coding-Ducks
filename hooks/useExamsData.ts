import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import { IExam } from "../types";

// ------------- Fetch functions------------
export const getExams = async () => {
  const res = await axiosInstance.get("/exams");
  return res.data as IExam[];
};

export const getExam = async (examSlug: string) => {
  const { data } = await axiosInstance.get(`/exams/slug/${examSlug}`);
  return data as IExam;
};

export const getExamProblems = async (examId: number) => {
  return axiosInstance.get(`/problems/examProblems/${examId}`);
};

export const getExamSubmissions = async (examId: number) => {
  return axiosInstance.get(`/exams/getProgress/${examId}`);
};

// ------------- RQ hooks ------------

export const useExamsData = () => {
  return useQuery(["exams"], getExams);
};
export const useExamData = (examSlug: string) => {
  return useQuery(["exam", examSlug], () => getExam(examSlug));
};

export const useExamProblemsData = ({ examId }: { examId: number }) => {
  return useQuery(["examProblems", examId], () => getExamProblems(examId), {
    refetchOnMount: false,
    enabled: !!examId,
  });
};
export const useExamSubmissionsData = (examId: number) => {
  return useQuery(
    ["userSubmissions", examId],
    () => getExamSubmissions(examId),
    { enabled: !!examId }
  );
};
