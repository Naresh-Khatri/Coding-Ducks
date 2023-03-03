import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/ext-language_tools";
import { useEffect, useRef, useState } from "react";

// import "../styles/ace-editor.css";

export interface Cursor {
  row: number;
  col: number;
  username: string;
  color?: string;
}
interface CustomAceProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: number;
  width?: number;
  fontSize?: number;
  theme?: string;
  cursors?: Map<string, Cursor>;
  handleOnCursorChange?: ({ row, col }: { row: number; col: number }) => void;
}

function CustomAce({
  value,
  onChange,
  cursors,
  fontSize,
  handleOnCursorChange,
}: CustomAceProps) {
  const editorRef = useRef(null);

  const [marker, setMarker] = useState(null);
  const [markerIds, setMarkerIds] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || window === null) return;
    const windoww: any = window;
    if(windoww.ace === undefined) return;
    const editor = editorRef.current.editor;

    if (markerIds.length > 0)
      markerIds.forEach((id) => editor.session.removeMarker(id));

    let i = 0;
    cursors.forEach((cursor, userId) => {
      const nameMarker = editor.session.addMarker(
        new windoww.ace.Range(
          cursor.row,
          cursor.col,
          cursor.row,
          cursor.col + 1
        ),
        `ace_bookmark_name ace_bookmark_cursor_blink ace_cursor_color_${i} cursor_${userId}`,
        "text",
        true
      );
      //add attribute to the marker
      setMarker(nameMarker);
      // set data-name attribute to the marker
      const markerEl = document.querySelector(`.ace_cursor_color_${i}`);
      if (markerEl) markerEl.setAttribute("data-name", cursor.username);
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

  }, [cursors, value]);

  return (
    <>
      <AceEditor
        ref={editorRef}
        mode="javascript"
        value={value}
        onChange={onChange}
        theme="dracula"
        fontSize={fontSize}
        name="my-editor"
        editorProps={{ $blockScrolling: true }}
        width="100%"
        onCursorChange={(e) => {
          handleOnCursorChange({ row: e.cursor.row, col: e.cursor.column });
        }}
      />
    </>
  );
}

export default CustomAce;
