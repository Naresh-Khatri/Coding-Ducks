import { StateCreator, create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { IDirectory, IFile } from "../lib/socketio/socketEventTypes";
import { ISocketRoom, IYJsUser } from "../lib/socketio/socketEvents";
import * as Y from "yjs";
import { Socket } from "socket.io-client";
// import Y from 'yjs';

interface IWebsocketState {
  // ROOM
  // currRoom: ISocketRoom | null;
  // setCurrRoom: (room: ISocketRoom) => void;
  // todo: work on this
  // lastOpenedFileId: number;
  socket: Socket | null;
  setSocket: (socket: Socket) => void;
}
interface IFSState {
  // FILE SYSTEM
  fileSystemTree: IDirectory;
  currFileId: number;
  // currFileLoading: boolean;
  currFile: IFile;
  setCurrFile: (file: IFile | null) => void;

  initFS: (newFS: IDirectory) => void;
  // resetFS: () => void;
  selectFile: (fileId: number) => void;
}

type IYJState = Partial<IFSState> & {
  yDoc: Y.Doc;
  // clients: IYJsUser[];
  // setClients: (clients: IYJsUser[]) => void;

  // // this is used to show the opened files in Explorere
  // openFilesByClients: {
  //   [key: number]: IYJsUser[];
  // };
  // setOpenFilesByClients: (files: any) => void;
};
const createYjsSlice: StateCreator<
  IYJState,
  [["zustand/devtools", never], ["zustand/persist", IYJState]],
  [],
  IYJState
> = (set) => ({
  yDoc: new Y.Doc(),
  // clients: [],
  // setClients: (clients: IYJsUser[]) => {
  //   set((state) => {
  //     const fs = { ...state.fileSystemTree };
  //     // todo: add users to entities
  //     return { ...state, clients, fileSystemTree: fs };
  //   });
  // },
  // openFilesByClients: {},
  // setOpenFilesByClients: (files) =>
  //   set((state) => ({ ...state, openFilesByClients: files })),
});

const createWebsocketSlice: StateCreator<
  IWebsocketState,
  [["zustand/devtools", never], ["zustand/persist", IWebsocketState]],
  [],
  IWebsocketState
> = (set) => ({
  socket: null,
  setSocket: (socket: Socket) => set((state) => ({ ...state, socket })),
  // currRoom: null,
  // lastOpenedFileId: 0,
  // setCurrRoom: (room: ISocketRoom) =>
  //   set((state) => {
  //     return { ...state, currRoom: { ...state.currRoom, ...room } };
  //   }),
});

const createFileSystemSlice: StateCreator<
  IFSState,
  [["zustand/devtools", never], ["zustand/persist", IFSState]],
  [],
  IFSState
> = (set) => ({
  // @ts-ignore
  fileSystemTree: null,
  currFileId: 0,
  currFileLoading: false,
  // @ts-ignore
  currFile: null,
  setCurrFile: (file: IFile | null) =>
    set((state) => ({ ...state, currFile: file })),

  initFS: (newFS: IDirectory) =>
    set((state) => {
      console.log("initFS", newFS);
      return { ...state, fileSystemTree: newFS };
    }),

  // resetFS: () =>
  //   set((state) => ({
  //     ...state,
  //     fileSystemTree: null,
  //     currFileId: 0,
  //   })),
  selectFile: (fileId: number) =>
    set((state) => {
      const fs = { ...state.fileSystemTree };
      const unselectAllEntities = (dir: IDirectory) => {
        // unselect curr
        dir.isActive = false;
        // unselect children
        if (dir.childDirs)
          dir.childDirs.forEach((dir) => {
            unselectAllEntities(dir);
          });
        // unselect files in curr dir
        if (dir.files)
          dir.files.forEach((file) => {
            file.isActive = false;
          });
      };
      unselectAllEntities(fs[0]);

      const findAndSelectEntities = (dir: IDirectory): boolean => {
        // Check if the directory has files
        if (dir.files && dir.files.length === 0) {
          return false;
        }

        // Check if the file exists in this directory
        const foundFile = dir.files && dir.files.find((f) => f.id === fileId);
        if (foundFile) {
          dir.isActive = true;
          foundFile.isActive = true;
          return true;
        }

        if (!dir.childDirs) {
          return false;
        }
        // Recursively search in child directories
        for (const childDir of dir.childDirs) {
          // If the file is found in any child directory, mark the current directory as active
          const fileFound = findAndSelectEntities(childDir);
          if (fileFound) {
            dir.isActive = true;
            return true;
          }
        }

        return false;
      };

      findAndSelectEntities(fs[0]);

      return {
        ...state,
        fileSystemTree: fs,
        currFileId: fileId,
        lastOpenedFileId: fileId,
      };
    }),
});
const useGlobalStore = create<IFSState & IWebsocketState & IYJState>()(
  devtools(
    // persist(
    (...a) => ({
      currRoom: null,
      // @ts-ignore
      ...createFileSystemSlice(...a),
      // @ts-ignore
      ...createWebsocketSlice(...a),
      // @ts-ignore
      ...createYjsSlice(...a),
    })

    //   { name: "fs" }
    // )
  )
);
export default useGlobalStore;
