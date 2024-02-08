import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-c_cpp";

import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-terminal";

import AceEditor, { IAceEditorProps } from "react-ace";
import { ForwardedRef } from "react";

interface IBaseAceEditor extends IAceEditorProps {
  ref?: ForwardedRef<any>;
}

const BaseAceEditor = ({ ref, ...props }: IBaseAceEditor) => {
  return <AceEditor {...props} ref={ref} />;
};

export default BaseAceEditor;
