import { useMutation, useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import { IDirectory, IFile, IMessage } from "../lib/socketio/socketEventTypes";
import { ISocketRoom } from "../lib/socketio/socketEvents";
import { RoomRole } from "types";

// ------------- Fetch functions------------
export const updateRoomContents = async (
  roomId: number,
  contents: { head: string; html: string; css: string; js: string }
) => {
  const { data } = await axiosInstance.patch(
    `/rooms/${roomId}/updateContents`,
    {
      ...contents,
    }
  );
  return data;
};

export const getRoom = async ({ id, name }: { id?: number; name?: string }) => {
  try {
    let data: {
      data: {
        room: ISocketRoom;
        role?: RoomRole;
      };
    };
    if (id) {
      data = await axiosInstance.get(`/rooms/${id}`);
    } else {
      data = await axiosInstance.get(`/rooms/name/${name}`);
    }
    return data;
  } catch (err) {
    throw err;
  }
};
export const getRoomMsgs = async (roomId: number) => {
  const { data } = await axiosInstance.get(`/rooms/${roomId}/msgs`);
  return data as { data: IMessage[] };
};
const getRooms = async () => {
  const { data } = await axiosInstance.get(`/rooms/`);
  return data;
};

export const updateAllowList = async (
  roomId: number,
  userId: number,
  op: "add" | "remove"
) => {
  const { data } = await axiosInstance.patch(
    `/room/${roomId}/updateAllowList`,
    {
      userId,
      op,
    }
  );
  return data as ISocketRoom;
};
// ------------- RQ hooks ------------

export const useMutateRoomContents = (roomId: number) =>
  useMutation(
    ["mutate", "room", "contents", roomId],
    ({
      roomId,
      contents,
    }: {
      roomId: number;
      contents: { head: string; html: string; css: string; js: string };
    }) => updateRoomContents(roomId, contents),
    {}
  );

export const useMutateRoom = (roomId: number) =>
  useMutation(
    ["room", "update", roomId],
    async ({
      roomId,
      roomName,
      description,
      isPublic,
    }: {
      roomId: number;
      roomName: string;
      description: string;
      isPublic: boolean;
    }) => {
      const { data } = await axiosInstance.patch(`/rooms/${roomId}`, {
        name: roomName,
        description,
        isPublic,
      });
      return data;
    }
  );

export const useRemoveRoom = () =>
  useMutation(["delete", "room"], async ({ id }: { id: number }) => {
    const { data } = await axiosInstance.delete(`/rooms/${id}`);
    console.log(data);
    return data;
  });
export const useCreateRoom = () =>
  useMutation(
    ["create", "room"],
    async ({
      name,
      description,
      isPublic,
    }: {
      name: string;
      description: string;
      isPublic: boolean;
    }) => {
      const { data } = await axiosInstance.post(`/rooms/`, {
        name,
        description,
        isPublic,
      });
      return data;
    }
  );

export const useRoomsData = () =>
  useQuery(
    ["rooms"],
    async () => {
      const { data } = await getRooms();
      return data as ISocketRoom[];
    },
    { refetchInterval: 10000 }
  );
export const useRoomData = ({ id, name }: { id?: number; name?: string }) =>
  useQuery(
    ["room", id, name],
    async () => {
      try {
        const data = await getRoom({ id, name });
        return data.data;
      } catch (err) {
        throw err.response;
      }
    },
    { refetchInterval: 10000, retry: false, refetchOnWindowFocus: false }
  );
export const useRoomsMsgsData = (roomId: number) =>
  useQuery(
    ["room", "msgs", roomId],
    async () => {
      const { data } = await getRoomMsgs(roomId);
      return data as IMessage[];
    },
    { refetchInterval: 10000, retry: false, refetchOnWindowFocus: false }
  );
export const useUpdateAllowList = () =>
  useMutation(
    ["addUserToAllowList", 123],
    async ({
      op,
      roomId,
      userId,
    }: {
      roomId: number;
      userId: number;
      op: "add" | "remove";
    }) => {
      const { data } = await axiosInstance.patch(
        `/rooms/${roomId}/updateAllowList`,
        {
          userId,
          op,
        }
      );
      return data as ISocketRoom;
    }
  );
