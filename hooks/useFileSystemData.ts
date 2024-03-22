import { useMutation, useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import { IDirectory, IFile } from "../lib/socketio/socketEventTypes";

// ------------- Fetch functions------------
export const getFiles = async () => {
  const res = await axiosInstance.get("/files");
  return res.data as IFile[];
};

export const getFile = async (fileId: number) => {
  const { data } = await axiosInstance.get(`/files/${fileId}`);
  return data as IFile;
};
export const patchFile = async (fileId: number, payload: any) => {
  const { data } = await axiosInstance.patch(`/files/${fileId}`, {
    data: payload,
  });
  return data;
};
export const getDirectories = async () => {
  const res = await axiosInstance.get("/dirs");
  return res.data as IDirectory[];
};
export const getDirectory = async (dirId: number) => {
  const res = await axiosInstance.get(`/dirs/${dirId}`);
  return res.data as IDirectory[];
};

export const getRoomFileSystem = async (roomId: number) => {
  const { data } = await axiosInstance.get(`/rooms/${roomId}`);
  return data as IDirectory[];
};

// ------------- RQ hooks ------------

export const useFilesData = () => {
  return useQuery(["files"], getFiles);
};
export const useFileData = (fileId: number) => {
  return useQuery(["file", fileId], () => getFile(fileId), {
    refetchInterval: 150 * 1000,
    enabled: false,
  });
};
// mutate file with id

export const useDirectoriesData = () => {
  return useQuery(["dirs"], getDirectories);
};
export const useDirectoryData = (dirId: number) => {
  return useQuery(["dirs", dirId], () => getDirectory(dirId), {
    refetchInterval: 150 * 1000,
  });
};

export const useRoomFSData = (roomId: number) => {
  return useQuery(["room-fs", roomId], () => getRoomFileSystem(roomId), {
    refetchInterval: 150 * 1000,
  });
};
