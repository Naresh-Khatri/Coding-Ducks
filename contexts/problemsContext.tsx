import { createContext } from "react";

interface ProblemsContextProp {
  problems: Array<{}>;
  currentProblemId: number;
}
const ProblemContext = createContext({} as ProblemsContextProp);

export default ProblemContext;
