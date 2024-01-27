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
