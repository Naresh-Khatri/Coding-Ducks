import { useMutation, useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import {
  IUIChallenge,
  IUIChallengeAttempt,
  UIChallengeDifficulty,
} from "types";

// ------------- Fetch functions------------
export const getChallenges = async () => {
  const { data } = await axiosInstance.get("/ui-challenges");
  return data.data as IUIChallenge[];
};
export const getChallenge = async (challengeSlug: string) => {
  const { data } = await axiosInstance.get(`/ui-challenges/${challengeSlug}`);
  return data.data as IUIChallenge;
};
export const updateChallenge = async ({
  challengeId,
  payload,
}: {
  challengeId: number;
  payload: {
    title: string;
    description: string;
    difficulty: UIChallengeDifficulty;
    slug: string;
    head: string;
    html: string;
    css: string;
    js: string;
    isPublic: boolean;
  };
}) => {
  try {
    const { data } = await axiosInstance.patch(
      `/ui-challenges/${challengeId}`,
      payload
    );
    return data as IUIChallenge;
  } catch (error) {
    throw error;
  }
};
export const getChallengeAttempts = async (challengeId: number) => {
  const { data } = await axiosInstance.get(
    `/ui-challenges/${challengeId}/attempts`
  );
  return data.data;
};
export const recalculateAttemptScores = async ({
  challengeId,
  attemptId,
}: {
  challengeId: number;
  attemptId?: number;
}) => {
  const { data } = await axiosInstance.post(
    `/ui-challenges/recalculate-scores`,
    { challengeId, attemptId }
  );
  return data.data;
};
export const deleteChallege = async (challengeId: number) => {
  const { data } = await axiosInstance.delete(`/ui-challenges/${challengeId}`);
  return data as IUIChallenge;
};

export const getChallengeHighScores = async (challengeId: number) => {
  const { data } = await axiosInstance.get(
    `/ui-challenges/${challengeId}/highscores`
  );
  return data.data;
};
export const getChallengeAttempt = async (
  challengeSlug: string,
  attemptId: number
) => {
  const { data } = await axiosInstance.get(
    `/ui-challenges/${challengeSlug}/attempts/${attemptId}`
  );
  return data.data;
};
export const getUserChallengeHighscore = async ({
  challengeId,
  userId,
}: {
  challengeId?: number;
  userId?: number;
}) => {
  const { data } = await axiosInstance.get(
    `/ui-challenges/${challengeId}/highscores?userId=${userId}`
  );
  return data.data as IUIChallengeAttempt;
};

export const startChallengeAttempt = async (challengeId: number) => {
  const { data } = await axiosInstance.post(
    `/ui-challenges/${challengeId}/start`
  );
  return data.data;
};
export const updateChallengeAttemptContents = async ({
  challengeId,
  attemptId,
  contents,
}: {
  challengeId: number;
  attemptId: number;
  contents: { head: string; html: string; css: string; js: string };
}) => {
  const { data } = await axiosInstance.patch(
    `/ui-challenges/${challengeId}/attempts/${attemptId}`,
    {
      ...contents,
    }
  );
  return data;
};
export const submitChallengeAttempt = async ({
  challengeId,
  contents,
}: {
  challengeId: number;
  contents: { head: string; html: string; css: string; js: string };
}) => {
  const { data } = await axiosInstance.post(
    `/ui-challenges/${challengeId}/submit`,
    {
      ...contents,
    }
  );
  return data;
};

// ------------- RQ hooks ------------

// get 1, getMany, update, delete

export const useChallengesData = () => {
  return useQuery(["challenges"], getChallenges);
};
export const useChallengeData = (challengeSlug: string) => {
  return useQuery(
    ["challenge", challengeSlug],
    () => getChallenge(challengeSlug),
    {
      refetchInterval: 150 * 1000,
    }
  );
};
export const useAUpdateChallenge = () => {
  return useMutation(["challenge", "update", Date()], updateChallenge);
};
export const useARecalcScores = () =>
  useMutation({ mutationFn: recalculateAttemptScores });

export const useARemoveChallenge = () => {
  return useMutation(deleteChallege);
};
export const useAChallengeAttemptsData = (challengeId: number) => {
  return useQuery(
    ["challenge attempts", challengeId],
    () => getChallengeAttempts(challengeId),
    { cacheTime: 0 }
  );
};

// attempts
export const useChallengeHighscoreData = (challengeId: number) => {
  return useQuery(
    ["challenge attempts", challengeId],
    () => getChallengeHighScores(challengeId),
    { enabled: !!challengeId, cacheTime: 0 }
  );
};
export const useUserChallengeAttemptsData = ({
  challengeId,
  userId,
}: {
  challengeId?: number;
  userId?: number;
}) => {
  return useQuery(
    ["user attempts", challengeId],
    () => getUserChallengeHighscore({ challengeId, userId }),
    { enabled: !!challengeId && !!userId }
  );
};

export const useMutateChallengeStart = () =>
  useMutation({ mutationFn: startChallengeAttempt });

export const useMutateChallengeAttemptContents = () =>
  useMutation({ mutationFn: updateChallengeAttemptContents });

export const useSubmitChallengeAttempt = () =>
  useMutation({ mutationFn: submitChallengeAttempt });
