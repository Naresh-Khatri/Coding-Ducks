export interface IUser {
  id?: number;
  fullname: string;
  username: string;
  photoURL: string;
  roll?: string;
}

export interface IExam {
  id: number;
  slug: string;
  isBounded?: boolean;
  warnOnBlur?: boolean;
  title: string;
  active?: boolean;
  coverImg?: string;
  description?: string;
  durations?: number;
  endTime?: string;
  marks?: number;
  startTime?: string;
}

export interface IExamProblem {
  id: number;
  order: number;
  difficulty: string;
  description: string;
  tags: string[];
  examId: number;
  title: string;
  exam: IExam;
  testCases: any;
  starterCode?: string;
}

interface IComment {
  id: number;
  problemId: number;
  userId: number;
  username: string;
  photoURL: string;
  text: string;
  time: string;
  upvotes: IUser[];
  downvotes: IUser[];
}

export interface IProblem extends IExamProblem {
  slug?: string;
  title: string;
  frontendProblemId?: number;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  status?: "" | "attempted" | "solved";
  accuracy?: number;
  submissions?: ISubmission[];
  submissionCount?: number;
  tags: string[];
  likes: IUser[];
  dislikes: IUser[];
  comments: IComment[];
  starterCodes: IStarterCode[];
}

export interface IProblemTag {
  id: number;
  name: string;
}

interface TestCaseResult {
  errorMessage?: string;
  errorOccurred?: boolean;
  errorType?: string;
  errorIndex?: number;
  actualOutput?: string;
  output?: string;
  isCorrect?: boolean;
  input?: string;
  isPublic?: boolean;
  result?: {
    cpuUsage: number;
    memoryUsage: number;
    exitCode: number;
    signal: any;
    stderr: string;
    stdout: string;
  };
}

export interface Output {
  isCorrect: boolean;
  passedCount: number;
  totalCount: number;
  results: TestCaseResult[];
}

export interface ISubmission {
  id: number;
  lang: string;
  marks: number;
  timestamp: string;
  isAccepted: boolean;
  tests?: TestCaseResult[];
  tests_passed: number;
  total_tests: number;
  userId: number;
  User?: IUser;
  code?: string;
  examId?: number;
  Exam?: IExam;
  problemId?: number;
  Problem?: IProblem;
}

export interface Testcase {
  id: number;
  explaination?: string;
  input?: string;
  output?: string;
  isPublic: boolean;
}

export interface IProblemSubmissionResult {
  isCorrect: boolean;
  passedCount: number;
  totalCount: number;
  result: Testcase[];
}

export type Lang = "js" | "py" | "cpp" | "c" | "java";
export type Theme =
  | "dracula"
  | "monokai"
  | "github"
  | "tomorrow"
  | "kuroir"
  | "twilight"
  | "xcode"
  | "textmate"
  | "solarized dark"
  | "solarized light"
  | "terminal";

export type IAceModes = "python" | "javascript" | "java" | "c_cpp";

export interface IStarterCode {
  id?: number;
  lang: Lang;
  code: string;
  aceMode?: IAceModes;
  langLabel: string;
  problemId?: number;
}
