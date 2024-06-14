import pythonLogo from "../assets/lang-icons/python.svg";
import cppLogo from "../assets/lang-icons/cpp.svg";
import javascriptLogo from "../assets/lang-icons/javascript.svg";
import javaLogo from "../assets/lang-icons/java.svg";

export const EDITOR_THEMES = [
  {
    value: "dracula",
    label: "Dracula",
  },
  {
    value: "monokai",
    label: "Monokai",
  },
  {
    value: "github",
    label: "Github",
  },
  {
    value: "tomorrow",
    label: "Tomorrow",
  },
  {
    value: "kuroir",
    label: "Kuroir",
  },
  {
    value: "twilight",
    label: "Twilight",
  },
  {
    value: "xcode",
    label: "Xcode",
  },
  {
    value: "textmate",
    label: "Textmate",
  },
  {
    value: "solarized_dark",
    label: "Solarized Dark",
  },
  {
    value: "solarized_light",
    label: "Solarized Light",
  },
  {
    value: "terminal",
    label: "Terminal",
  },
];

export const EDITOR_LANGUAGES = [
  {
    label: "Python",
    value: "py",
    iconPath: pythonLogo,
  },
  {
    label: "JavaScript",
    value: "js",
    iconPath: javascriptLogo,
  },
  {
    label: "C++",
    value: "cpp",
    iconPath: cppLogo,
  },
  //   {
  //     label: "C",
  //     value: "c",
  //   },
  {
    label: "Java",
    value: "java",
    iconPath: javaLogo,
  },
];
