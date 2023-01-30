import { createContext, useEffect, useState } from "react";
import axios from "../utils/axios";

const exampleSections = [
  {
    id: 1,
    name: "Python Comments",
    problems: [
      {
        id: 1,
        name: "Single line comment",
        statement:
          "Comments in Python are written with a special character, which one?",
        code: `%%//%% This is a comment`,
      },
      {
        id: 2,
        name: "Multi line comment",
        statement: "Use a multiline string to make the a multi line comment:",
        code: `%%'''%%This is a comment\nwritten in \nmore that just one line\n%%'''%%`,
      },
    ],
  },
  {
    id: 2,
    name: "Python Variables",
    problems: [
      {
        id: 1,
        name: "Variable declaration",
        statement: `Create a variable named <code>carName</code> and assign the value <code>Volvo</code> to it.`,
        code: `var %%carName%% = "%%Volvo%%";`,
      },
      {
        id: 2,
        name: "Variable assignment",
        statement: "Create a variable named x and assign the value 50 to it.",
        code: `%%x%% = %%50%%`,
      },
      {
        id: 3,
        name: "Variable assignment",
        statement: "Display the sum of 5 + 10, using two variables: x and y.",
        code: `%%x%% = %%5%%\ny = 10\nprint(x %%,%%y)`,
      },
    ],
  },
];
export const exerciseContext = createContext({
  currSection: 0,
  currProblem: 0,
  sections: exampleSections,
  setCurrProblem: null,
  setCurrSection: null,
  setSections: null,
  userInputs: {},
  setUserInputs: null,
});

export const getExercise = async () => {
  try {
    const res = await axios.get("/exercise/123");
    console.log(res.data);
  } catch (err) {
    console.log(err);
  }
};

export const ExerciseProvider = ({ children }) => {
  const [currSection, setCurrSection] = useState(0);
  const [currProblem, setCurrProblem] = useState(0);
  const [sections, setSections] = useState(exampleSections);

  const [userInputs, setUserInputs] = useState({});

  useEffect(() => {
    // console.log(currSection, currProblem);
  });

  return (
    <exerciseContext.Provider
      value={{
        currSection,
        currProblem,
        sections,
        setCurrSection,
        setCurrProblem,
        setSections,
        userInputs,
        setUserInputs,
      }}
    >
      {children}
    </exerciseContext.Provider>
  );
};
