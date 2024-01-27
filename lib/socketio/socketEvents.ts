import { Lang } from "../../types";

export interface ISocketUser {
  socketId?: string;
  id?: number;
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
  isPublic?: boolean;
  lang?: Lang;
  content?: string;
  ownerId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  owner: ISocketUser;
  clients?: ISocketUser[];
  cursors?: any[];
  msgsList?: any[];
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
export const CURSOR_UPDATE = "cursor-update";
export const CURSOR_UPDATED = "cursor-updated";

export const CODE_EXEC_START = "code-exec-start";
export const CODE_EXEC_END = "code-exec-end";

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
