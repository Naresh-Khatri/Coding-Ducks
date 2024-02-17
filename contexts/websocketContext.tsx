import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  Dispatch,
  SetStateAction,
} from "react";
import { IDefaultResult } from "../types";
import { userContext } from "./userContext";
import { Socket, io } from "socket.io-client";
import { useToast } from "@chakra-ui/react";
import {
  CODE_EXEC_END,
  CODE_EXEC_START,
  CODE_UPDATED,
  CONNECT,
  CURSOR_UPDATED,
  ISocketRoom,
  ISocketUser,
  LANG_UPDATED,
  LOBBY_UPDATED,
  MESSAGE_RECEIVE,
  ROOM_CREATED,
  ROOM_CREATE_FAILED,
  ROOM_CREATE_SUCCESS,
  SERVER_INFO_RECEIVE,
  USER_CONNECTED,
  USER_DATA_SEND,
  USER_DISCONNECTED,
  USER_JOINED,
  USER_JOIN_SUCCESS,
  USER_LEFT,
  USER_LOST,
} from "../lib/socketio/socketEvents";
import {
  CommonFailed,
  CursorUpdated,
  ICursor,
  IMessage,
  LangUpdated,
  LobbyUpdated,
  RoomCreateSuccess,
  RoomCreated,
  ServerInfoReceive,
  UserConnected,
  UserDisconnected,
  UserJoinSuccess,
  UserJoined,
  UserLeft,
  UserLost,
} from "../lib/socketio/socketEventTypes";

interface IWebsocketContext {
  currRoomInfo: ISocketRoom;
  connectedClients: ISocketUser[];
  roomsList: ISocketRoom[];
  msgsList: IMessage[];
  cursors: ICursor[];
  setCursors: Dispatch<SetStateAction<ICursor[]>>;
  socket: Socket;
  isCreatingRoom: boolean;
  setIsCreatingRoom: Dispatch<SetStateAction<boolean>>;

  currRoomClients: ISocketUser[];
  setCurrRoomClients: Dispatch<SetStateAction<ISocketRoom[]>>;
  code: string;
  resultIsLoading: boolean;
  consoleInfo: IDefaultResult;
  setConsoleInfo: Dispatch<SetStateAction<IDefaultResult>>;
  resetStates;
}

export const websocketContext = createContext({} as IWebsocketContext);

export function WebsocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState(null);

  const [roomsList, setRoomsList] = useState<ISocketRoom[]>([]);
  const [currRoomInfo, setCurrRoomInfo] = useState<ISocketRoom | null>(null);

  const [connectedClients, setConnectedClients] = useState<ISocketUser[]>([]);
  const [currRoomClients, setCurrRoomClients] = useState<ISocketUser[]>([]);

  const [msgsList, setMsgsList] = useState<IMessage[]>([]);
  const [cursors, setCursors] = useState<ICursor[]>([]);

  const [consoleInfo, setConsoleInfo] = useState<IDefaultResult>(null);
  const [resultIsLoading, setResultIsLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const { user } = useContext(userContext);

  const toast = useToast();

  const resetStates = () => {
    setMsgsList([]);
    setCurrRoomClients([]);
    setCurrRoomInfo(null);
  };

  useEffect(() => {
    if (Object.keys(user).length === 0) return;

    const socketInstance = io(
      process.env.NODE_ENV === "development"
        ? "ws://localhost:3333"
        : "wss://api2.codingducks.live"
    );

    socketInstance.on(CONNECT, () => {
      setSocket(socketInstance);
      socketInstance.emit(USER_DATA_SEND, {
        user: { id: user.id, username: user.username },
      });
    });

    socketInstance.on(
      SERVER_INFO_RECEIVE,
      ({ clients, rooms }: ServerInfoReceive) => {
        setRoomsList(rooms);
        setConnectedClients(clients);
      }
    );
    socketInstance.on(LOBBY_UPDATED, (payload: LobbyUpdated) => {
      console.log("lobby update", payload);
      const { type } = payload;
      if (type === "join-user-to-room") {
        setRoomsList((p) =>
          p.map((room) => {
            if (room.id == payload.room.id) {
              return { ...room, clients: [...room.clients, payload.user] };
            } else return room;
          })
        );
      } else if (type === "remove-user-from-room") {
        setRoomsList((p) =>
          p.map((room) => {
            if (room.name == payload.room.name) {
              return {
                ...room,
                clients: room.clients.filter(
                  (client) => client.id !== payload.user.id
                ),
              };
            } else return room;
          })
        );
      }
    });
    socketInstance.on(USER_CONNECTED, ({ clients }: UserConnected) => {
      setConnectedClients(clients);
    });
    socketInstance.on(USER_DISCONNECTED, ({ clients }: UserDisconnected) => {
      console.log(clients);
      setConnectedClients(clients);
    });
    socketInstance.on(USER_LEFT, ({ room, user, cursors }: UserLost) => {
      setCurrRoomClients((p) => p.filter((client) => client.id !== user.id));
      // setCursors((p) => p.filter((c) => c.user.id !== user.id));
      setCursors(cursors);
      toast({
        title: "User Exited!",
        description: `${user.username}(#${user.id}) has Left!`,
        status: "warning",
        isClosable: true,
      });
    });
    socketInstance.on(USER_LOST, ({ room, user, cursors }: UserLost) => {
      setCurrRoomClients((p) => p.filter((client) => client.id !== user.id));
      // setCursors((p) => p.filter((c) => c.user.id !== user.id));
      setCursors(cursors);
      toast({
        title: "User disconnected!",
        description: `${user.username}(#${user.id}) has disconnected!`,
        status: "warning",
        isClosable: true,
      });
    });
    socketInstance.on(
      USER_JOIN_SUCCESS,
      ({ room, clients, msgsList, cursors }: UserJoinSuccess) => {
        console.log("youve joined", clients);
        setCurrRoomInfo(room);
        setCurrRoomClients(clients);
        setMsgsList(msgsList);
        setCursors(cursors);
        toast({
          title: "Room joined",
          description: `You've joined ${room.name}`,
          status: "success",
          isClosable: true,
        });
      }
    );
    socketInstance.on(USER_JOINED, ({ clients, user, cursors }: UserJoined) => {
      setCurrRoomClients(clients);
      console.log("user-connected: clients", clients);
      setCursors(cursors);
      toast({
        title: "User connected",
        description: `${user.username} has joined the room`,
        status: "info",
        isClosable: true,
      });
    });
    socketInstance.on(ROOM_CREATE_FAILED, ({ msg }: CommonFailed) => {
      setCurrRoomInfo(null);
      setIsCreatingRoom(false);
      toast({
        title: "Couldn't create room!",
        description: msg,
        status: "error",
        isClosable: true,
      });
    });
    socketInstance.on(ROOM_CREATE_SUCCESS, ({ newRoom }: RoomCreateSuccess) => {
      setRoomsList((p) => [...p, newRoom]);
      toast({
        title: "Created Room Successfully",
        description: "You can now share the room link with your friends",
        status: "success",
        isClosable: true,
      });
      setIsCreatingRoom(false);
    });
    socketInstance.on(ROOM_CREATED, ({ newRoom, user }: RoomCreated) => {
      setRoomsList((p) => [...p, newRoom]);
      toast({
        title: "New Room Created",
        description: `${user.username} has created a new room!`,
        status: "info",
        isClosable: true,
      });
    });
    socketInstance.on(MESSAGE_RECEIVE, (newMsg) => {
      console.log(newMsg);
      setMsgsList((p) => [newMsg, ...p]);
    });
    // socketInstance.on(ROOM_UPDATE, (payload) => {
    //   console.log("room-update", payload);
    //   setRoomInfo((p) => {
    //     return { ...p, payload };
    //   });
    //   console.log(room);
    // });
    // socketInstance.on(CHANGE_CODE, (payload) => {
    //   const { code } = payload;
    //   setCode(code);
    // });
    // socketInstance.on(DISCONNECT, () => {
    //   if (room) socketInstance.emit("user-disconnected", room.roomInfo, user);
    // });
    // socketInstance.on(CHANGE_CURSOR, (payload) => {
    //   const { cursor: newCursors, user, roomInfo } = payload;
    //   setCursors((p) => {
    //     if (p.has(user.id)) {
    //       const cursor = p.get(user.id);
    //       cursor.row = newCursors.row;
    //       cursor.col = newCursors.col;
    //       cursor.username = user.username;
    //       p.set(user.id, cursor);
    //     } else {
    //       p.set(user.id, newCursors);
    //     }
    //     return new Map(p);
    //   });
    // });
    socketInstance.on(LANG_UPDATED, ({ updatedRoom, user }: LangUpdated) => {
      const { lang } = updatedRoom;
      setCurrRoomInfo((p) => {
        return { ...p, lang };
      });
      toast({
        title: "Language Changed!",
        description: `${user.username} changed to ${lang}`,
        status: "success",
        isClosable: true,
      });
    });
    socketInstance.on(CODE_EXEC_START, (payload) => {
      toast({
        title: "Execution Requested!",
        description: `${payload.user.username} has ran the code`,
        status: "success",
        isClosable: true,
      });
      setResultIsLoading(true);
      setTimeout(() => {
        setResultIsLoading(false);
      }, 4000);
    });
    socketInstance.on(CODE_EXEC_END, (payload) => {
      setConsoleInfo(payload.res);
      setResultIsLoading(false);
    });
    socketInstance.on(CURSOR_UPDATED, (payload: CursorUpdated) => {
      const { newPos, user, room } = payload;
      setCursors((p) =>
        p.map((cursor) => {
          if (cursor.user.id === user.id) return { ...cursor, pos: newPos };
          else return cursor;
        })
      );
    });
    return () => {
      setSocket(null);
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <websocketContext.Provider
      value={{
        socket,
        connectedClients,
        currRoomInfo,
        msgsList,
        roomsList,
        isCreatingRoom,
        setIsCreatingRoom,
        cursors,
        setCursors,

        currRoomClients,
        setCurrRoomClients,
        code: currRoomInfo?.content || "",
        resultIsLoading,
        consoleInfo,
        setConsoleInfo,
        resetStates,
      }}
    >
      {children}
    </websocketContext.Provider>
  );
}
