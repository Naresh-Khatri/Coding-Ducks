import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axios";

export const useExamsData = () => {
    return useQuery(["exams"], () => axiosInstance.get("/exams"));
};

export const useExamData = (examSlug: string) => {
    return useQuery(
        ["exam", examSlug],
        () => axiosInstance.get(`/exams/slug/${examSlug}`),
    );
};

export const useExamProblemsData = ({ examId, enabled, }: {
    examId: number; enabled: boolean;
}) => {
    return useQuery(
        ["examProblems", examId],
        () => axiosInstance.get(`/problems/examProblems/${examId}`),
        { refetchOnMount: false, enabled: enabled }
    );
};
