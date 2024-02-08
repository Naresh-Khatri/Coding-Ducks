import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/ext-language_tools";

import dynamic from "next/dynamic";

import { IAceEditorProps } from "react-ace";
import { forwardRef } from "react";
const BaseAceEditor = dynamic(() => import("./BaseAceEditor"), {
  ssr: false,
});

const AceEditorWithRef = forwardRef(function (
  props: IAceEditorProps,
  ref
) {
  return <BaseAceEditor {...props} ref={ref} />;
});
AceEditorWithRef.displayName = 'AceEditorWithRef'

export default AceEditorWithRef;
