import { LINKEDIN_SHARE_TEMPLATES, LINKEDIN_HASHTAGS } from "../constants";
import { IDirectory, IFile } from "./socketio/socketEventTypes";

export const DESCRIPTION_TAB_INDEX = 0;
export const EDITORIOAL_TAB_INDEX = 1;
export const SOLUTION_TAB_INDEX = 2;
export const SUBMISSION_TAB_INDEX = 3;

export const lang2Label = {
  py: "Python",
  js: "JavaScript",
  cpp: "C++",
  c: "C",
  java: "Java",
};

export const errorType2Label = {
  "pre-compile-time": "Pre-Compile Time Error",
  "compile-time": "Compile Time Error",
  "run-time": "Runtime Error",
};
export const langToAceModes = {
  py: "python",
  js: "javascript",
  cpp: "c_cpp",
  c: "c_cpp",
  java: "java",
};

export const pointsToLeague = (points: number) => {
  if (points < 10) return { id: "noob", label: "Noob" };
  else if (points < 50) return { id: "beginner", label: "Beginner" };
  else if (points < 100) return { id: "intermediate", label: "Intermediate" };
  else if (points < 200) return { id: "advance", label: "Advance" };
  else if (points < 300) return { id: "expert", label: "Expert" };
  else if (points < 450) return { id: "master", label: "Master" };
  else return { id: "grandmaster", label: "Grand Master" };
};

export const isTouchScreen = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.maxTouchPoints > 0
  );
};
export const debounce = (fun: Function, interval: number = 2000) => {
  let timer;
  return (...args) => {
    const context = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fun.apply(context, args);
    }, interval);
  };
};
export const getFileFromFS = (
  dir: IDirectory,
  fileId: number
): IFile | null => {
  if (dir.files)
    for (let file of dir.files) {
      if (file.id === fileId) return file;
    }
  if (dir.childDirs)
    for (let childDir of dir.childDirs) {
      const fileFound = getFileFromFS(childDir, fileId);
      return fileFound;
    }
  return null;
};

export const COLORS = [
  { name: "purple", value: "#9F7AEA", bg: "#553C9A" },
  { name: "pink", value: "#ED64A6", bg: "#97266D" },
  { name: "green", value: "#48BB78", bg: "#276749" },
  { name: "yellow", value: "#ECC94B", bg: "#975A16" },
  { name: "orange", value: "#ED8936", bg: "#9C4221" },
  { name: "red", value: "#F56565", bg: "#9B2C2C" },
  { name: "teal", value: "#38B2AC", bg: "#285E61" },
  { name: "blue", value: "#4299E1", bg: "#2C5282" },
  { name: "cyan", value: "#0BC5EA", bg: "#0987A0" },
];
export const getRandColor = () => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};

export const generateLinkedInPostText = ({
  challengeName,
  score,
  url,
}: {
  challengeName: string;
  score: number;
  url: string;
}) => {
  const templates: string[] = LINKEDIN_SHARE_TEMPLATES;
  const hashTags: string[][] = LINKEDIN_HASHTAGS;

  const randomTemplate =
    templates[Math.floor(Math.random() * templates.length)];
  const text = encodeURIComponent(
    randomTemplate
      .replaceAll("[name]", `"${challengeName}"`)
      .replaceAll("[url]", url)
      .replaceAll("[score]", score.toString() + "%") +
      `#CodingDucks ${
        hashTags[0][Math.floor(Math.random() * hashTags[0].length)]
      } ${hashTags[1][Math.floor(Math.random() * hashTags[1].length)]} ${
        hashTags[2][Math.floor(Math.random() * hashTags[2].length)]
      }`
  );
  return text;
};
