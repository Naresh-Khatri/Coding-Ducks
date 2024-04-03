import { Lang } from "../../types";
import { ISocketRoom, IYJsUser } from "./socketEvents";
interface ISocketUser {
  id: number;
  username: string;
  photoURL?: string;
}
export interface IMessage {
  user: { id: number; username: string; photoURL: string };
  room: ISocketRoom;
  text: string;
  updatedAt: Date;
  time: Date;
}

export interface ICursorPos {
  lineNumber: number;
  column: number;
}

export interface ICursor {
  user: ISocketUser;
  room: ISocketRoom;
  cursor: {
    pos: ICursorPos;
    selection?: { start: ICursorPos; end: ICursorPos };
  };
  color: { name: string; value: string };
}

export interface Entity {
  id: number;
  ownerId: number;
  roomId: number;
  createdAt: Date;
  updatedAt: Date;
  parentDirId: number | null;
  isActive?: boolean;
  openedBy?: IYJsUser[];
}
export interface IFile extends Entity {
  fileName: string;
  code: string;
  lang: Lang;
}
export interface IDirectory extends Entity {
  name: string;
  isOpen: boolean;
  files: IFile[];
  childDirs: IDirectory[];
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
  clients: ISocketUser[];
  cursors?: ICursor[];
  fileSystemTree: IDirectory;
  msgsList?: any[];
}
export interface UserJoinFailed {
  status: "failed";
  msg: string;
}
export interface UserJoined {
  user: ISocketUser;
  clients: ISocketUser[];
  cursors?: ICursor[];
}
export interface UserLeave {
  user: ISocketUser;
  room: ISocketRoom;
}
export interface UserLeft {
  user: ISocketUser;
  room: ISocketRoom;
  cursors?: ICursor[];
}
export interface UserLost {
  user: ISocketUser;
  room: ISocketRoom;
  cursors?: ICursor[];
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
  updatedRoom: ISocketRoom;
}
export interface RoomUpdated {
  user: ISocketUser;
  updatedRoom: ISocketRoom;
}
export interface RoomUpdateFailed {
  status: "failed";
  msg: string;
}
export interface RoomUpdateSuccess {
  status: "success";
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
export interface ICodeChangeEvent {
  // value: string;
  // meta: {
  //   action: "insert" | "remove";
  //   start: ICursorPos;
  //   end: ICursorPos;
  //   lines: string[];
  //   id: number;
  // };
  text: string;
  range: {
    start: { lineNumber: number; column: number };
    end: { lineNumber: number; column: number };
  };
}
export interface CodeUpdate {
  user: ISocketUser;
  file: { id: number };
  room: ISocketRoom;
  change: ICodeChangeEvent;
}
export interface CodeUpdated {
  user: ISocketUser;
  file: { id: number };
  room: ISocketRoom;
  change: ICodeChangeEvent;
}
export interface CodeSave {
  user: ISocketUser;
  file: { id: number };
  code: string;
}
export interface CodeSaved {
  user: ISocketUser;
  file: { id: number };
  code: string;
}

export interface CursorUpdate {
  newCursor: {
    pos?: ICursorPos;
    selection?: { start: ICursorPos; end: ICursorPos };
  };
  user: ISocketUser;
  room: ISocketRoom;
}
export interface CursorUpdated {
  newCursor: {
    pos?: ICursorPos;
    selection?: { start: ICursorPos; end: ICursorPos };
  };
  user: ISocketUser;
  room: ISocketRoom;
}
// ---------- FILES EVENTS ----------
export interface FileGet {
  fileId: number;
}
export interface FileCreate {
  parentDirId?: number;
  name: string;
  room: ISocketRoom;
  user: ISocketUser;
}
export interface FileUpdate {
  fileId: number;
  room: ISocketRoom;
  user: ISocketUser;
  newName?: string;
}
export interface FileDelete {
  fileId: number;
  room: ISocketRoom;
  user: ISocketUser;
}

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

// ---------- OTHER EVENTS ----------

export interface UserJoinRequest {
  user: ISocketUser;
  room: ISocketRoom;
}
export interface UserJoinDucklet {
  user: ISocketUser;
  room: ISocketRoom;
}
export interface UserJoinedDucklet {
  user: ISocketUser;
  room: ISocketRoom;
}
