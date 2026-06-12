import type { MachineCodingProblem } from "../types";
import { debounce } from "./debounce";
import { flattenArray } from "./flatten-array";
import { ticTacToe } from "./tic-tac-toe";
import { todoList } from "./todo-list";

/**
 * The full catalogue. Add a new problem by authoring a module under this folder
 * and appending it here — content ships via PRs, never DB seeds.
 */
export const MACHINE_CODING_PROBLEMS: MachineCodingProblem[] = [
  flattenArray,
  debounce,
  todoList,
  ticTacToe,
];
