import { Activity } from "react-activity-calendar";

interface Follower {
  fullname: string;
  id: number;
  photoURL: string;
  registeredAt: string;
  username: string;
}
export interface IUser {
  id: number;
  googleUID?: string;
  uid?: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  isNoob?: boolean;
  registeredAt?: string;
  bio?: string;
  followedBy?: Array<Follower>;
  following?: Array<Follower>;
  fullname: string;
  username: string;
  photoURL: string;
  points?: number;
  roll?: string;
  rank?: number;
  createdAt?: string;
  updatedAt?: string;
}
export interface IUserStatsResponse {
  totalProblemsSolved: number;
  totalSubCount: number;
  rank: number;
  league: ILeague;
  points: number;
  accuracy: number;
  dailySubmissions: Activity[];
  streaks: { date: string; count: number }[][];
  longestStreak: number;
  streakActive: boolean;
  byExamId: any;
}

export interface IExam {
  id: number;
  slug: string;
  isBounded: boolean;
  warnOnBlur: boolean;
  title: string;
  active: boolean;
  coverImg: string;
  description: string;
  durations: number;
  endTime: string;
  marks: number;
  startTime: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface IProblem extends IExamProblem {
  slug?: string;
  title: string;
  frontendProblemId?: number;
  isActive?: boolean;
  description: string;
  difficulty: IDifficulty;
  status?: "unsolved" | "tried" | "solved";
  accuracy: number;
  submissions?: ISubmission[];
  submissionCount?: number;
  tags: string[];
  likes: IUser[];
  dislikes: IUser[];
  comments: IComment[];
  starterCodes: IStarterCode[];
  updatedAt?: string;
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
  errorCount: number;
  totalCount: number;
  totalRuntime: number;
  results: IRunResult[];
}
export interface IRunResult {
  stdout: string;
  stdin?: string | null;
  stderr?: string;
  actualOutput?: string;
  input?: string;
  exitCode: number;
  memoryUsage?: number;
  runtime?: number;
  signal?: string | null;
  errorIndex?: number;
  errorType?:
    | "compile-time"
    | "run-time"
    | "pre-compile-time"
    | "run-timeout"
    | "segmentation-error"
    | null;
  isPublic?: boolean;
  isCorrect?: boolean;
  expectedOutput?: string;
  output?: string;
}

export interface ISubmission {
  id: number;
  lang: Lang;
  marks: number;
  timestamp: string;
  isAccepted: boolean;
  tests?: TestCaseResult[];
  tests_passed: number;
  total_tests: number;
  userId: number;
  User: IUser;
  code?: string;
  examId?: number;
  Exam?: IExam;
  problemId?: number;
  Problem: IProblem;
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

export type IDifficulty =
  | "tutorial"
  | "basic"
  | "veryEasy"
  | "easy"
  | "medium"
  | "hard";

export type Lang = "js" | "py" | "cpp" | "c" | "java" | "other";
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

// export interface ICursor {
//   row: number;
//   col: number;
//   username: string;
//   color?: string;
// }

export type ILeague =
  | "noob"
  | "beginner"
  | "intermediate"
  | "advance"
  | "expert"
  | "master"
  | "grandmaster";

export type ILeagueLabel =
  | "Noob"
  | "Beginner"
  | "Intermediate"
  | "Advance"
  | "Expert"
  | "Master"
  | "Grand Master";

export interface IBadge {
  id?: number;
  name: string;
  description: string;
  image: string;
}

// PROBLEMS
export interface IRatingUser {
  id: number;
  username: string;
  photoURL?: string;
}
export interface IRating {
  rating: {
    likes: IRatingUser[];
    dislikes: IRatingUser[];
  };
  userRating: "like" | "dislike" | "none" | null;
}

// ADMIN DASHBOARD

export interface ISubmissionsQuery {
  skip: number;
  take: number;
  searchTerm: string;
  orderBy: string;
  asc: boolean;
}

export type RoomRole = "owner" | "contributor" | "requester" | "guest" | "none";

export type UIChallengeDifficulty =
  | "newbie"
  | "junior"
  | "intermediate"
  | "advanced"
  | "master";
export interface IUIChallenge {
  id: number;
  title: string;
  slug: string;
  description: string;
  difficulty: UIChallengeDifficulty;
  isPublic: boolean;
  desktopPreview: string;
  mobilePreview: string;
  ogImage: string;
  ogImageScale: 0 | 1 | 2 | 3 | 4;

  contentHEAD: string;
  contentHTML: string;
  contentCSS: string;
  contentJS: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface IUIChallengeAttempt {
  id: number;
  challengeId: number;
  challenge?: {
    title: string;
    slug: string;
  };
  userId: number;
  isPublic: boolean;
  status: "submitted" | "notSubmitted";
  lastSubmitted: Date;
  score: number;

  // desktopPreview: string;
  // mobilePreview: string;

  imgCode?: string;
  imgTarget?: string;
  imgAfter?: string;
  imgBefore?: string;
  imgDiff?: string;
  imgFilledAfter?: string;
  imgMask?: string;
  ogImage?: string;

  contentHEAD: string;
  contentHTML: string;
  contentCSS: string;
  contentJS: string;

  createdAt: Date;
  updatedAt: Date;
}
