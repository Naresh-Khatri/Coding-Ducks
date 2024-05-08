import { Lang } from "../../types";

export interface IYJsUser {
  clientId: number;
  color: { name: string; value: string; bg: string };
  id: number;
  fullname?: string;
  email?: string;
  photoURL: string;
  username: string;
  openedFileId?: number;
  pos?: { x: number; y: number };
}
export interface ISocketUser {
  socketId?: string;
  id: number;
  fullname?: string;
  email?: string;
  photoURL?: string;
  username?: string;
  room?: {
    id: number;
    name: string;
  };
}

export interface ISocketRoom {
  id: number;
  name: string;
  description?: string;
  isPublic?: boolean;
  previewImage?: string;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
  owner: ISocketUser;
  clients: ISocketUser[];
  cursors?: any[];
  msgsList?: any[];
  allowedUsers?: ISocketUser[];

  contentHEAD?: string;
  contentHTML?: string;
  contentCSS?: string;
  contentJS?: string;
}

export const CONNECT = "connect";
export const DISCONNECT = "disconnect";

export const SERVER_INFO_RECEIVE = "server-info-receive";

// ---------- LOBBY EVENTS ----------
export const LOBBY_UPDATED = "lobby-updated";

// ---------- USER EVENTS ----------
export const USER_CONNECTED = "user-connected";
export const USER_DISCONNECTED = "user-disconnected";

export const USER_DATA_SEND = "user-data-send";
export const USER_JOIN = "user-join";
export const USER_JOIN_SUCCESS = "user-join-success";
export const USER_JOIN_FAILED = "user-join-failed";
export const USER_JOINED = "user-joined";
export const USER_LEAVE = "user-leave";
export const USER_LEFT = "user-left";
export const USER_LOST = "user-lost";

export const USER_JOIN_REQUEST = "user-join-request";
export const USER_JOIN_REQUEST_ACCEPT = "user-join-request-accept";
export const USER_JOIN_REQUEST_ACCEPTED = "user-join-request-accepted";
export const USER_JOIN_REQUESTED = "user-join-requested";
export const USER_JOIN_DUCKLET = "user-join-ducklet";
export const USER_JOINED_DUCKLET = "user-joined-ducklet";
export const USER_LEAVE_DUCKLET = "user-leave-ducklet";
export const USER_REMOVE_FROM_DUCKLET = "user-leave-ducklet";
export const USER_REMOVED_FROM_DUCKLET = "user-leave-ducklet";

// ---------- ROOMS ----------
// create
export const ROOM_CREATE = "room-create";
export const ROOM_CREATE_SUCCESS = "room-create-success";
export const ROOM_CREATE_FAILED = "room-create-failed";
export const ROOM_CREATED = "room-created";
// update
export const ROOM_UPDATE = "room-update";
export const ROOM_UPDATE_FAILED = "room-update-failed";
export const ROOM_UPDATE_SUCCESS = "room-update-success";
export const ROOM_UPDATED = "room-updated";

// ---------- IDE EVENTS ----------
export const LANG_UPDATE = "lang-update";
export const LANG_UPDATED = "lang-updated";
export const CODE_UPDATE = "code-update";
export const CODE_UPDATED = "code-updated";
export const CODE_SAVE = "code-save";
export const CODE_SAVED = "code-saved";
export const CURSOR_UPDATE = "cursor-update";
export const CURSOR_UPDATED = "cursor-updated";

export const CODE_EXEC_START = "code-exec-start";
export const CODE_EXEC_END = "code-exec-end";

// ---------- FILE EVENTS ----------
export const FILE_GET = "file-get";
export const FILE_RECEIVE = "file-receive";
export const FILE_CREATE = "file-create";
export const FILE_CREATED = "file-created";
export const FILE_UPDATE = "file-update";
export const FILE_UPDATED = "file-updated";
export const FILE_DELETE = "file-delete";
export const FILE_DELETED = "file-deleted";
// get
export const ROOM_GET = "room-get";

// ---------- CHAT EVENTS ----------
export const MESSAGE_SEND = "message-send";
export const MESSAGE_SEND_FAILED = "message-send-failed";
export const MESSAGE_SEND_SUCCESS = "message-send-success";
export const MESSAGE_RECEIVE = "message-receive";

// A user can
//     - connect
//     - disconnect
//     - join room
//     - leave room
//     - fail to join room
//     - *fail to leave room

// A room can be
//     - joined
//     - left
//     - created
//     - updated
//     - deleted
//     - fail to create
//     - *fail to update

// A msg can be
//     - sent
//     - received

//          - join_success (self)
//        /
// join --
//        \
//         - joined (rest)

// present           -       request
// success/failed    -       Response(self)
// past              -       Response(rest)
