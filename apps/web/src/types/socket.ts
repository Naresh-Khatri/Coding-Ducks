// Message types for Socket communication
export type SocketMessage =
  | {
    type: "chat";
    userId: string;
    username: string;
    text: string;
    timestamp: number;
  }
  | {
    type: "cursor";
    userId: string;
    position: { line: number; column: number };
  }
  | {
    type: "presence";
    userId: string;
    username: string;
    photoURL?: string;
    action: "join" | "leave";
  }
  | { type: "sync"; data: unknown };

export interface RoomState {
  users: Map<string, UserPresence>;
  messages: ChatMessage[];
}

export interface UserPresence {
  id: string;
  username: string;
  photoURL?: string;
  cursor?: { line: number; column: number };
  lastSeen: number;
  socketId?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}
