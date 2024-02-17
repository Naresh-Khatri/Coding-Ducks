import dynamic from "next/dynamic";

// dynamic(() => import("ace-nuilds/src-noconflict/mode-javascript"));
dynamic(() => import("ace-builds/src-noconflict/mode-python"));
dynamic(() => import("ace-builds/src-noconflict/mode-c_cpp"));
dynamic(() => import("ace-builds/src-noconflict/mode-java"));

dynamic(() => import("ace-builds/src-noconflict/theme-dracula"));
dynamic(() => import("ace-builds/src-noconflict/theme-monokai"));
dynamic(() => import("ace-builds/src-noconflict/theme-github"));
dynamic(() => import("ace-builds/src-noconflict/theme-tomorrow"));
dynamic(() => import("ace-builds/src-noconflict/theme-kuroir"));
dynamic(() => import("ace-builds/src-noconflict/theme-twilight"));
dynamic(() => import("ace-builds/src-noconflict/theme-xcode"));
dynamic(() => import("ace-builds/src-noconflict/theme-textmate"));
dynamic(() => import("ace-builds/src-noconflict/theme-solarized_dark"));
dynamic(() => import("ace-builds/src-noconflict/theme-solarized_light"));
dynamic(() => import("ace-builds/src-noconflict/theme-terminal"));

dynamic(() => import("ace-builds/src-noconflict/ext-language_tools"));
dynamic(() => import("ace-builds/src-noconflict/keybinding-emacs"));
dynamic(() => import("ace-builds/src-noconflict/keybinding-sublime"));
dynamic(() => import("ace-builds/src-noconflict/keybinding-vscode"));
import { useEffect, useRef, useState } from "react";
// import { ICursor } from "../types";
// const AceEditorWithRef = dynamic(() => import("./editors/AceEditorWithRef"), {
//   ssr: false,
// });
import AceEditorWithRef from "./editors/AceEditorWithRef";
interface CustomAceProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: number;
  width?: number;
  fontSize?: number;
  theme?: string;
  // cursors?: Map<string, ICursor>;
  handleOnCursorChange?: ({ row, col }: { row: number; col: number }) => void;
}

function CustomAce({
  value,
  onChange,
  // cursors,
  fontSize,
  handleOnCursorChange,
}: CustomAceProps) {
  const editorRef = useRef(null);

  const [markerIds, setMarkerIds] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || window === null) return;
    const windoww: any = window;
    if (windoww.ace === undefined) return;
    const editor = editorRef.current?.editor;
    if (!editor) return;

    markerIds.forEach((id) => editor.session.removeMarker(id));

    let i = 0;
    // cursors.forEach((cursor, userId) => {
    //   const nameMarker = editor.session.addMarker(
    //     new windoww.ace.Range(
    //       cursor.row,
    //       cursor.col,
    //       cursor.row,
    //       cursor.col + 1
    //     ),
    //     `ace_bookmark_name ace_bookmark_cursor_blink ace_cursor_color_${i} cursor_${userId}`,
    //     "text",
    //     true
    //   );
    //   // set data-name attribute to the marker
    //   const markerEl = document.querySelector(`.ace_cursor_color_${i}`);
    //   if (markerEl) markerEl.setAttribute("data-name", cursor.username);
    //   // add the marker id to the array
    //   setMarkerIds((prev) => [...prev, nameMarker]);
    //   i++;
    // });

    // fade out the markers
    const cursorElems = document.querySelectorAll(".ace_bookmark_name");
    cursorElems.forEach((elem) => {
      elem.classList.remove("ace_bookmark_hide");
      setTimeout(() => {
        elem.classList.add("ace_bookmark_hide");
      }, 100);
    });
  }, [, /* cursors*/ value]);

  return (
    <>
      <h1>hi</h1>
      <AceEditorWithRef
        ref={editorRef}
        mode="javascript"
        value={value}
        onChange={onChange}
        theme="dracula"
        fontSize={fontSize}
        name="my-editor"
        editorProps={{ $blockScrolling: true }}
        width="100%"
        style={{ borderRadius: "15px" }}
        onCursorChange={(e) => {
          handleOnCursorChange({ row: e.cursor.row, col: e.cursor.column });
        }}
      />
    </>
  );
}

export default CustomAce;
