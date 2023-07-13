import { useEffect, useRef } from "react";
import ReactQuill from "react-quill";

interface QuillEditorProps {
  newDescription: string;
  setNewDescription: (newDescription: string) => void;
}
function QuillEditor({ newDescription, setNewDescription }: QuillEditorProps) {
  const quillRef = useRef(null);

  // TODO: Add keyboard shortcuts
  // useEffect(() => {
  //   if (quillRef.current) {
  //     // const qbindings = quillRef.current.editor.keyboard.bindings;
  //     // console.log(quillRef.current);
  //   }
  // }, []);
  return (
    <ReactQuill
      style={{ borderRadius: 10 }}
      theme="snow"
      ref={(el) => {
        quillRef.current = el;
      }}
      modules={{
        toolbar: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          ["code"],
          [
            { list: "ordered" },
            { list: "bullet" },
            { indent: "-1" },
            { indent: "+1" },
          ],
          ["link", "image"],
          ["clean"],
        ],
      }}
      value={newDescription}
      onChange={setNewDescription}
    />
  );
}

export default QuillEditor;
