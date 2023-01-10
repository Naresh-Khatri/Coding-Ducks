import { createContext } from "react";

const ProblemContext = createContext({
  problems: [],
  currentProblemId: 0,
});

export default ProblemContext;
