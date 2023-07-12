interface Follower {
  fullname: string;
  id: number;
  photoURL: string;
  registeredAt: string;
  username: string;
}
export interface IUser {
  id: number;
  googleUID: string;
  uid?: string;
  displayName?: string;
  email: string;
  isAdmin: boolean;
  isNoob: boolean
  registeredAt: string;
  bio: string;
  followedBy: Array<Follower>;
  following: Array<Follower>;
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
  difficulty: IDifficulty;
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
  isSolved?: boolean;
  description: string;
  difficulty: IDifficulty;
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

//this is from compile-run lib
export interface IDefaultResult {
  stdout: string;
  stderr: string;
  code?: string;
  exitCode: number;
  memoryUsage: number;
  cpuUsage: number;
  signal: string;
  errorType?: "compile-time" | "run-time" | "pre-compile-time" | "run-timeout";
}

//this is my custom interface with some extra fields
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
  result?: IDefaultResult;
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
  frontendInput?: string;
  output?: string;
  isPublic: boolean;
}

export interface IProblemSubmissionResult {
  isCorrect: boolean;
  passedCount: number;
  totalCount: number;
  result: Testcase[];
}

export type IDifficulty = "tutorial" | "basic" | "easy" | "medium" | "hard";

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
export type IKeyBinds = "default" | "emacs" | "vim" | "vscode" | "sublime";

export interface IStarterCode {
  id?: number;
  lang: Lang;
  code: string;
  aceMode?: IAceModes;
  langLabel: string;
  problemId?: number;
}

// MOSTLY FOR DUCKLETS (Multiplayer)
export interface IChatMessage {
  userId: number;
  username: string;
  text: string;
  time?: string;
  roomId: string;
  photoURL: string;
}

export interface ICursor {
  row: number;
  col: number;
  username: string;
  color?: string;
}
export interface IRoomInfo {
  id: string;
  isPublic: boolean;
  name: string;
  lang: string;
  owner: IUser;
  ownerId: number;
  content: string;
}

export interface IRoom {
  clients: IUser[];
  cursors: ICursor[];
  msgsList: IChatMessage[];
  roomInfo: IRoomInfo;
}
