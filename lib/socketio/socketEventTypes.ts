import { ISocketRoom } from "./socketEvents";
interface ISocketUser {
  id: number;
  username: string;
  photoURL: string;
}
export interface IMessage {
  user: { id: number; username: string; photoURL: string };
  room: ISocketRoom;
  text: string;
  time?: Date;
}

// ---------- GENERICS ----------
export interface CommonFailed {
  status: "failed";
  msg: string;
}

// ---------- USER EVENTS ----------
export interface LobbyUpdated {
  type: "join-user-to-room" | "remove-user-from-room";
  room: ISocketRoom;
  user: ISocketUser;
}

// ---------- USER EVENTS ----------
export interface UserDataSend {
  user: { id: number };
}
export interface ServerInfoReceive {
  clients: ISocketUser[];
  rooms: ISocketRoom[];
}
export interface UserConnected {
  clients: ISocketUser[];
}
export interface UserDisconnected {
  clients: ISocketUser[];
}

export interface UserJoin {
  room: ISocketRoom;
  user: ISocketUser;
}
export interface UserJoinSuccess {
  status: "success";
  room: ISocketRoom;
  clients?: ISocketUser[];
  cursors?: any[];
  msgsList?: any[];
}
export interface UserJoinFailed {
  status: "failed";
  msg: string;
}
export interface UserJoined {
  user: ISocketUser;
  clients: ISocketUser[];
}
export interface UserLeave {
  user: ISocketUser;
  room: ISocketRoom;
}
export interface UserLeft {
  user: ISocketUser;
  room: ISocketRoom;
}
export interface UserLost {
  user: ISocketUser;
  room: ISocketRoom;
}

// ---------- ROOMS ----------

export interface RoomCreate {
  newRoom: ISocketRoom;
  user: ISocketUser;
}
export interface RoomCreateFailed {
  status: "failed";
  msg: string;
}
export interface RoomCreateSuccess {
  status: "success";
  newRoom: ISocketRoom;
  user: ISocketUser;
}
export interface RoomCreated {
  user: ISocketUser;
  newRoom: ISocketRoom;
}

export interface RoomUpdate {
  user: ISocketUser;
  newRoom: ISocketRoom;
}
export interface RoomUpdateFailed {
  status: "failed";
  msg: string;
}
export interface RoomUpdateSuccess {
  status: "success";
  updatedRoom: ISocketRoom;
}
export interface RoomUpdated {
  user: ISocketUser;
  updatedRoom: ISocketRoom;
}

// ---------- IDE EVENTS ----------

export interface LangUpdate {
  user: ISocketUser;
  updatedRoom: ISocketRoom;
}
export interface LangUpdated {
  user: ISocketUser;
  updatedRoom: ISocketRoom;
}
export interface CodeUpdate {
  user: ISocketUser;
  code: string;
}
export interface CodeUpdated {
  user: ISocketUser;
  code: string;
}
// export interface CursorUpdate{
//   user: ISocketUser;
//   updatedRoom: ISocketRoom;
// }
// export interface CursorUpdated{
//   user: ISocketUser;
//   updatedRoom: ISocketRoom;
// }

// ---------- CHAT EVENTS ----------
export interface MessageSend {
  msg: IMessage;
  room: { id: number };
}
export interface MessageSendFailed {
  status: "failed";
  msg: string;
}
export interface MessageSendSuccess {
  status: "success";
  content: string;
}
export interface MessageReceive {
  msg: IMessage;
}
