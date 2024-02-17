import { useContext, useEffect, useRef, useState } from "react";

import AceEditor from "react-ace";
import { Range } from "react-ace/node_modules/ace-builds";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";

import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-kuroir";
import "ace-builds/src-noconflict/theme-twilight";
import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-noconflict/theme-solarized_dark";
import "ace-builds/src-noconflict/theme-solarized_light";
import "ace-builds/src-noconflict/theme-terminal";

import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/keybinding-emacs";
import "ace-builds/src-noconflict/keybinding-sublime";
import "ace-builds/src-noconflict/keybinding-vscode";

import { Box, Flex, Text } from "@chakra-ui/react";

import {
  CodeUpdated,
  ICodeChangeEvent,
  ICursorPos,
} from "../../lib/socketio/socketEventTypes";
import { websocketContext } from "../../contexts/websocketContext";
import { CODE_UPDATED } from "../../lib/socketio/socketEvents";
import { userContext } from "../../contexts/userContext";

interface CustomAceProps {
  value?: string;
  height?: number;
  width?: number;
  fontSize?: number;
  theme?: string;
  handleOnCodeChange?: ({ value, meta }: ICodeChangeEvent) => void;
  handleOnCursorChange?: ({
    row,
    column,
  }: {
    row: number;
    column: number;
  }) => void;
  handleOnSelectionChange: (e: {
    type: "insert" | "remove";
    anchor?: ICursorPos;
    lead?: ICursorPos;
  }) => void;
}

function AceCodeEditor({
  value,
  handleOnCodeChange,
  fontSize,
  handleOnCursorChange,
  handleOnSelectionChange,
}: CustomAceProps) {
  const editorRef = useRef(null);
  const { socket, cursors } = useContext(websocketContext);
  const { user } = useContext(userContext);

  const [markerIds, setMarkerIds] = useState<number[]>([]);

  useEffect(() => {
    if (!socket || !editorRef.current) return;
    const editor = editorRef.current.editor;
    editor.setValue(value, -1);

    editor.on("selection", (...e) => console.log(e));

    socket.on(CODE_UPDATED, (payload: CodeUpdated) => {
      const { event, user } = payload;
      const { meta } = event;
      console.log(meta);
      if (meta.action === "insert") {
        editor.session.insert(
          {
            row: meta.start.row,
            column: meta.start.column,
          },
          meta.lines.join("\n")
        );
      } else if (meta.action === "remove") {
        const range = new Range(
          meta.start.row,
          meta.start.column,
          meta.end.row,
          meta.end.column
        );
        editor.session.remove(range);
      }
    });
  }, [socket, editorRef]);

  useEffect(() => {
    if (typeof window === "undefined" || window === null) return;
    const windoww: any = window;
    if (windoww.ace === undefined) return;
    const editor = editorRef.current?.editor;
    if (!editor) return;

    markerIds.forEach((id) => editor.session.removeMarker(id));

    console.log(cursors);
    let i = 0;
    if (!cursors) return;
    cursors.forEach((cursor, idx) => {
      if (!cursor.pos || cursor.user.id === user.id) return;
      const nameMarker = editor.session.addMarker(
        new windoww.ace.Range(
          cursor.pos.row,
          cursor.pos.column,
          cursor.pos.row,
          cursor.pos.column + 1
        ),
        `ace_bookmark_name ace_bookmark_cursor_blink ace_cursor_color_${cursor.color.name} cursor_${idx}`,
        "text",
        true
      );
      // set data-name attribute to the marker
      const markerEl = document.querySelector(`.cursor_${idx}`);
      if (markerEl) markerEl.setAttribute("data-name", cursor.user.username);
      // add the marker id to the array
      setMarkerIds((prev) => [...prev, nameMarker]);
      i++;
    });

    // fade out the markers
    const cursorElems = document.querySelectorAll(".ace_bookmark_name");
    cursorElems.forEach((elem) => {
      elem.classList.remove("ace_bookmark_hide");
      setTimeout(() => {
        elem.classList.add("ace_bookmark_hide");
      }, 100);
    });
  }, [cursors]);

  return (
    <Flex
      direction={"column"}
      w={"100%"}
      h={"500px"}
      style={{
        border: "1px solid rgba(255,255,255,.125)",
        borderRadius: "10px",
      }}
    >
      <AceEditor
        keyboardHandler="vim"
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          fontSize: fontSize,
          tabSize: 2,
        }}
        ref={editorRef}
        mode="javascript"
        // value={value}
        theme="dracula"
        fontSize={fontSize}
        name="my-editor"
        editorProps={{ $blockScrolling: true }}
        width="100%"
        height="100%"
        style={{ borderRadius: "15px" }}
        onChange={(value, event) => {
          console.log("onchange");
          // prevent calling programatically
          if (
            editorRef.current.editor.curOp &&
            editorRef.current.editor.curOp.command.name
          ) {
            handleOnCodeChange({ value, meta: event });
          }
        }}
        onCursorChange={(e) => {
          // prevent calling on remote cursor remove action
          if (
            editorRef.current.editor.curOp &&
            editorRef.current.editor.curOp.command.name
          ) {
            // console.log(editorRef.current.editor.curOp.command, e.cursor);
            handleOnCursorChange({
              row: e.cursor.row,
              column: e.cursor.column,
            });
          }
        }}
        // onSelection={(...e) => console.log(e)}
        // onSelectionChange={(...e) => console.log(e)}
        // onSelectionChange={(e) => {
        //   console.log('onselectionchange')
        //   // console.log(editorRef.current.editor.getSelectedText().length);
        //   if (
        //     editorRef.current.editor.getSelectedText().length === 0 ||
        //     e.$isEmpty ||
        //     (e.anchor.row === e.cursor.row &&
        //       e.anchor.column === e.cursor.column) ||
        //     (e.anchor.row === e.lead.row && e.anchor.column === e.lead.column)
        //   ) {
        //     console.log("remove", e);
        //     handleOnSelectionChange({ type: "remove" });
        //     return;
        //   }
        //   console.log("add", e);
        //   handleOnSelectionChange({
        //     type: "insert",
        //     anchor: { row: e.anchor.row, column: e.anchor.column },
        //     lead: { row: e.lead.row, column: e.lead.column },
        //   });
        // }}
      />
      <Box>
        {cursors.length > 0 &&
          cursors.map((c) => (
            <Text fontWeight={"bold"} key={c.user.id}>
              row: {c.pos.row}, col: {c.pos.column}: {c.user.username}
            </Text>
          ))}
      </Box>
    </Flex>
  );
}
export default AceCodeEditor;
