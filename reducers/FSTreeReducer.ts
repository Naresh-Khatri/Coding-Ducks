// @ts-nocheck
import { IDirectory } from "../lib/socketio/socketEventTypes";

export enum FSActionType {
  INIT = "INIT",
  RESET = "RESET",
  SELECT_FILE = "SELECT_FILE",
}

export interface IFSAction {
  type: FSActionType;
  payload?: {
    fileId?: number;
    data?: IDirectory;
  };
}

const FSTreeReducer = (state: IDirectory = initFS, action: IFSAction) => {
  const { type, payload } = action;
  switch (type) {
    case FSActionType.INIT: {
      return payload.data;
    }
    case FSActionType.RESET: {
      return {} as IDirectory;
    }
    case FSActionType.SELECT_FILE: {
      const { fileId } = payload;
      const fs = { ...state };
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
      return fs;
    }
    default:
      return state;
  }
};

export default FSTreeReducer;

const initFS: IDirectory = {
  id: 0,
  createdAt: new Date(),
  isOpen: false,
  name: "root",
  ownerId: 0,
  parentDirId: null,
  roomId: 0,
  updatedAt: new Date(),
  childDirs: [],
  files: [],
  isActive: false,
};
