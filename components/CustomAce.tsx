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

    // addBookmark()
  }, [cursors, value]);
  const addBookmark = () => {
    // Get the editor instance from the ref
    const editor = editorRef.current.editor;

    // Get the current position of the cursor
    const cursorPosition = editor.getCursorPosition();

    // Create a marker on the current line
    // const marker = editor.session.addMarker(
    //   new window.ace.Range(cursorPosition.row, 0, cursorPosition.row, 1),
    //   "ace_bookmark",
    //   "fullLine",
    //   false
    // );

    // Remove the previous marker
    if (marker) editor.session.removeMarker(marker);

    // Create a text marker to display the name
    const nameMarker = editor.session.addMarker(
      new windoww.ace.Range(
        cursorPosition.row,
        cursorPosition.column,
        cursorPosition.row,
        cursorPosition.column + 1
      ),
      "ace_bookmark_name",
      "text",
      true
    );
    setMarker(nameMarker);

    // Set the name of the marker to the text of the line
    // nameMarker.name = editor.session.getTextRange(
    //   new window.ace.Range(cursorPosition.row, 0, cursorPosition.row, 1)
    // );
  };

  return (
    <>
      {/* <button onClick={addBookmark}>Add Bookmark</button> */}
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
