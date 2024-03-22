import { Editor, EditorProps, Monaco, useMonaco } from "@monaco-editor/react";
import {
  CodeSave,
  CodeUpdate,
  CodeUpdated,
  CursorUpdate,
  ICursor,
  ICursorPos,
} from "../../lib/socketio/socketEventTypes";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { websocketContext } from "../../contexts/websocketContext";
import {
  CODE_SAVE,
  CODE_UPDATE,
  CODE_UPDATED,
  CURSOR_UPDATE,
  FILE_GET,
  ISocketRoom,
} from "../../lib/socketio/socketEvents";
import { userContext } from "../../contexts/userContext";
import { Box, Button, Flex, HStack, Spinner, Text } from "@chakra-ui/react";
import { generateCursorDecorations } from "../../lib/editorUtils";
import { CloseIcon } from "@chakra-ui/icons";
import { debounce } from "../../lib/utils";
import useFSStore from "../../stores";
import useGlobalStore from "../../stores";
import FAIcon from "../FAIcon";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import LangIcon from "../LangIcon";
import FileIcons from "../multiplayer/FileIcons";

interface IMonacoEditorWithCursorsProps extends EditorProps {
  editorRef: any;
  room: ISocketRoom;
  onChange: Dispatch<SetStateAction<string>>;
  cursors: ICursor[];
  onMount: (editor: any, monaco: any) => void;
}

// hack to determite code range reason
let isProgrammaticChange = false;

function MonacoEditorWithCursors({
  room,
  onMount,
  ...props
}: IMonacoEditorWithCursorsProps) {
  const monaco = useMonaco();
  const editorRef = useRef(null);
  // TO DO: remove this fucking state
  const { socket, cursors, setCursors } = useContext(websocketContext);
  const { user } = useContext(userContext);

  const currFileId = useGlobalStore((state) => state.currFileId);
  const currFile = useGlobalStore((state) => state.currFile);
  const setCurrFile = useGlobalStore((state) => state.setCurrFile);

  const [fileLoading, setFileLoading] = useState(false);
  const [fileSyncing, setFileSyncing] = useState(false);

  // used to dispose onchange and other handlers when changing file
  const [disposables, setDisposables] = useState([]);

  // check for file change
  useEffect(() => {
    if (!editorRef.current) return;
    setFileLoading(true);
    // basically when file is fetched, dispose all three events handlers
    // and create new ones using disposbles state
    socket.emit(FILE_GET, { fileId: currFileId }, (file) => {
      if (!file?.id) {
        console.error("couldnt fetch file");
        return;
      }
      setCurrFile(file);
      socket.on(CODE_UPDATED, (e) => handleCodeUpdated(e, editorRef.current));

      if (disposables.length > 0) {
        disposables.forEach((d) => d.dispose());
      }
      setDisposables([]);

      editorRef.current.setValue(file.code);
      const a = editorRef.current.onDidChangeCursorPosition((e) => {
        const { position } = e;
        const newPosition: ICursorPos = {
          lineNumber: position.lineNumber - 1,
          column: position.column - 1,
        };
        setCursors((p) =>
          p.map((cursor) => {
            if (cursor.user.id === user.id)
              return {
                ...cursor,
                cursor: {
                  pos: newPosition,
                },
              };
            else return cursor;
          })
        );
        const payload: CursorUpdate = {
          user: { id: user.id, username: user.username },
          room: { id: room.id, name: room.name },
          newCursor: { pos: newPosition },
        };
        socket.emit(CURSOR_UPDATE, payload);
      });

      const b = editorRef.current.onDidChangeCursorSelection((e) => {
        const { selection } = e;
        const { startLineNumber, startColumn, endLineNumber, endColumn } =
          selection;

        // setInterval(test, 1000);
        if (startLineNumber === endLineNumber && startColumn === endColumn)
          return;
        const newSelection: { start: ICursorPos; end: ICursorPos } = {
          start: {
            lineNumber: startLineNumber - 1,
            column: startColumn - 1,
          },
          end: {
            lineNumber: endLineNumber - 1,
            column: endColumn - 1,
          },
        };
        const payload: CursorUpdate = {
          user: { id: user.id, username: user.username },
          room: { id: room.id, name: room.name },
          newCursor: { selection: newSelection },
        };
        socket.emit(CURSOR_UPDATE, payload);
      });

      // this helps to disable onchange handler while changing files
      // will implement multiple models later
      const c = editorRef.current.onDidChangeModelContent((e) =>
        handleOnChange(e, file)
      );
      setDisposables([a, b, c]);
      setFileLoading(false);
      localStorage.setItem(`active-file-in-room-${room.id}`, file.id);
    });
    return () => {
      socket.off(CODE_UPDATED, handleCodeUpdated);
    };
  }, [currFileId, editorRef]);

  // add decorations
  useEffect(() => {
    if (!socket || !editorRef.current || cursors.length === 0) return;
    const oldDecorations = editorRef.current.getDecorationsInRange(
      new monaco.Range(1, 1, 999, 999)
    );
    if (oldDecorations?.length > 0)
      editorRef.current.removeDecorations(oldDecorations.map((dec) => dec.id));

    // add cursors on editor
    editorRef.current.createDecorationsCollection(
      generateCursorDecorations(cursors, user, monaco)
    );

    // add username below them
    setTimeout(() => {
      addUsernameText();
    }, 10);
  }, [socket, cursors]);

  const addUsernameText = () => {
    cursors.forEach((cursor) => {
      if (cursor.user.id === user.id) return;
      const el = document.querySelector(`.color-${cursor.color.name}`);
      if (!el) return;
      const newElem = document.createElement("span");
      newElem.classList.add("my-cursor-text");
      newElem.innerText = cursor.user.username;
      el.appendChild(newElem);
    });
  };

  const handleOnMount = (editor, _monaco) => {
    editorRef.current = editor;
  };

  const handleOnChange = (e, file) => {
    if (isProgrammaticChange) return;
    setFileSyncing(true);
    handleSyncServer(file);
    let { range, text } = e.changes[0];
    const payload: CodeUpdate = {
      user: { id: user?.id, username: user.username },
      room: { id: room.id, name: room.name },
      file: { id: file.id },
      change: {
        range: {
          start: {
            lineNumber: range.startLineNumber - 1,
            column: range.startColumn - 1,
          },
          end: {
            lineNumber: range.endLineNumber - 1,
            column: range.endColumn - 1,
          },
        },
        text: text,
      },
    };
    socket.emit(CODE_UPDATE, payload);
  };
  const handleSyncServer = useCallback(
    debounce((file) => {
      console.log("syning");
      const payload: CodeSave = {
        code: editorRef.current.getValue(),
        user: { id: user.id, username: user.username },
        file: { id: file.id },
      };
      socket.emit(CODE_SAVE, payload, (state) => {
        setFileSyncing(false);
      });
    }),
    []
  );
  const handleCodeUpdated = (payload: CodeUpdated, editor: any) => {
    if (!editorRef.current) return;
    isProgrammaticChange = true;
    const { change, user } = payload;
    const id = { major: 1, minor: 1 };
    const editOperation = {
      identifier: id,
      forceMoveMarkers: true,
      range: {
        startLineNumber: change.range.start.lineNumber + 1,
        startColumn: change.range.start.column + 1,
        endLineNumber: change.range.end.lineNumber + 1,
        endColumn: change.range.end.column + 1,
      },
      text: change.text,
    };
    console.log(editOperation);
    editor.executeEdits("sync-exec", [editOperation]);
    isProgrammaticChange = false;
  };

  const test = () => {
    if (!editorRef.current) return;
    console.log("deleting");
    const change = {
      identifier: {
        major: 1,
        minor: 1,
      },
      forceMoveMarkers: true,
      range: {
        startLineNumber: 10,
        startColumn: 1,
        endLineNumber: 11,
        endColumn: 28,
      },
      text: "",
    };
    editorRef.current.executeEdits("btn-press", [change]);
  };
  return (
    <>
      {!currFile ? (
        <Text> Select a file... </Text>
      ) : fileLoading ? (
        <HStack>
          <Text> fetching file</Text>
          <Spinner />
        </HStack>
      ) : (
        !currFile?.id && <Text> couldnt open file</Text>
      )}
      <Flex
        direction={"column"}
        w={"full"}
        flex={1}
        display={currFile ? "flex" : "none"}
      >
        {/* <Box>
        {cursors.length > 0 &&
          cursors.map((c) => (
            <Text fontWeight={"bold"} key={c.user.id}>
              row: {c.cursor.pos.lineNumber}, col: {c.cursor.pos.column}:{" "}
              {c.user.username}
            </Text>
          ))}
      </Box> */}
        {/* <Button onClick={test}>test</Button> */}
        <HStack ml={2}>
          <Button>
            <HStack>
              {/* <FAIcon icon={faFile} /> */}
              <FileIcons fileName={currFile?.fileName || ""} width={20} />
              <Text>{currFile?.fileName}</Text>
              <CloseIcon
                fontSize={"1.5rem"}
                borderRadius={"3px"}
                _hover={{ background: "red.500" }}
                p={"6px"}
                onClick={() => {
                  setCurrFile(null);
                }}
              />
            </HStack>
          </Button>
          {/* <Button
          variant={"ghost"}
          rightIcon={<CloseIcon fontSize={"x-small"} />}
        >
          utils.ts
        </Button>
        <Button
          variant={"ghost"}
          rightIcon={<CloseIcon fontSize={"x-small"} />}
        >
          package.json
        </Button> */}
        </HStack>

        <Flex direction={"column"} h={"100%"}>
          <Flex
            position={"relative"}
            w={"100%"}
            h={"1px"}
            bg={fileSyncing ? "red.400" : "green.400"}
          >
            <HStack
              position={"absolute"}
              right={0}
              borderRadius={"5px 5px 0 0"}
              top={"-1.7rem"}
              padding={"2px 8px"}
              bg={fileSyncing ? "red.400" : "green.400"}
            >
              {fileSyncing && <Spinner />}
              <Text>{fileSyncing ? "syncing..." : "changes save!"}</Text>
            </HStack>
          </Flex>
          <Box display={currFile?.id || !fileLoading ? "block" : "none"}>
            <Editor
              language={
                currFile?.id
                  ? extToLanguage(currFile?.fileName.split(".").at(-1))
                  : "javascript"
              }
              theme="vs-dark"
              onMount={handleOnMount}
              options={{
                ...props.options,
                minimap: { enabled: false },
                fontSize: 16,
              }}
              {...props}
            />
          </Box>
        </Flex>
      </Flex>
    </>
  );
}

export default MonacoEditorWithCursors;

const extToLanguage = (ext: string) => {
  const map = {
    cpp: "c++",
    c: "c",
    java: "java",
    py: "python",
    php: "php",
    json: "json",
    js: "javascript",
    html: "html",
    css: "css",
    md: "markdown",
    cs: "c#",
    ts: "typescript",
    tsx: "typescript",
    jsx: "javascript",
  };
  return map[ext] || "other";
};
