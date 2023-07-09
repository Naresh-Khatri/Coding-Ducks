import { createContext, useEffect, useState } from "react";
import { IKeyBinds, Lang, Theme } from "../types";

interface IEditorSettings {
  lang?: Lang;
  theme?: Theme;
  fontSize?: number;
  tabSize?: 2 | 4;
  keyBindings?: IKeyBinds;
  showDriverCode?: boolean;
  runCodeOnCtrlEnter?: boolean;
  showLineNumbers?: boolean;
  allowAutoComplete?: boolean;
}

const initialState: IEditorSettings = {
  lang: "py",
  theme: "dracula",
  fontSize: 14,
  tabSize: 4,
  keyBindings: "default",
  showDriverCode: false,
  runCodeOnCtrlEnter: false,
  showLineNumbers: true,
  allowAutoComplete: true,
};

interface IEditorSettingsContext {
  settings: IEditorSettings;
  code: string;
  setCode: (code: string) => void;
  updateSettings: (newSettings: IEditorSettings) => void;
}
export const EditorSettingsContext = createContext({
  settings: initialState,
  code: "",
  setCode: (code: string) => {},
  updateSettings: (newSettings: IEditorSettings) => {},
} as IEditorSettingsContext);

const EditorSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(initialState);
  const [code, setCode] = useState("");

  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem("editorSettings"));
    if (storedSettings) setSettings(storedSettings);
  }, []);

  const updateSettings = (newSettings: IEditorSettings) => {
    setSettings({ ...settings, ...newSettings });

    localStorage.setItem(
      "editorSettings",
      JSON.stringify({ ...settings, ...newSettings })
    );
  };

  return (
    <EditorSettingsContext.Provider
      value={{ settings, updateSettings, code, setCode }}
    >
      {children}
    </EditorSettingsContext.Provider>
  );
};

export default EditorSettingsProvider;
