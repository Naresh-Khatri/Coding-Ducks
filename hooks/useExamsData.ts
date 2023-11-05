import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import { IExam, IProblem } from "../types";

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
  const { data } = await axiosInstance.get(`/problems/examProblems/${examId}`);
  return data as IProblem[];
};

export const getExamSubmissions = async (examId: number) => {
  const { data } = await axiosInstance.get(`/exams/getProgress/${examId}`);
  return data;
};

// ------------- RQ hooks ------------

export const useExamsData = () => {
  return useQuery(["exams"], getExams);
};
export const useExamData = (examSlug: string) => {
  return useQuery(["exam", examSlug], () => getExam(examSlug), {
    refetchInterval: 150 * 1000,
  });
};

export const useExamProblemsData = ({ examId }: { examId: number }) => {
  return useQuery(["examProblems", examId], () => getExamProblems(examId), {
    refetchInterval: 150 * 1000,
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
