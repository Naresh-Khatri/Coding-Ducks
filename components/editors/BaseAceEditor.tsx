import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/ext-language_tools";

import AceEditor from "react-ace";

const BaseAceEditor = ({ ref, ...props }) => {
  return <AceEditor {...props} ref={ref} />;
};

export default BaseAceEditor;
