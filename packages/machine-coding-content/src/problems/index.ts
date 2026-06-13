import type { MachineCodingProblem } from "../types";
import { accordion } from "./accordion/problem";
import { autocomplete } from "./autocomplete/problem";
import { curry } from "./curry/problem";
import { dataTable } from "./data-table/problem";
import { debounce } from "./debounce/problem";
import { deepClone } from "./deep-clone/problem";
import { eventEmitter } from "./event-emitter/problem";
import { flattenArray } from "./flatten-array/problem";
import { imageCarousel } from "./image-carousel/problem";
import { kanbanBoard } from "./kanban-board/problem";
import { modalDialog } from "./modal-dialog/problem";
import { nestedComments } from "./nested-comments/problem";
import { promisePool } from "./promise-pool/problem";
import { starRating } from "./star-rating/problem";
import { tabs } from "./tabs/problem";
import { throttle } from "./throttle/problem";
import { ticTacToe } from "./tic-tac-toe/problem";
import { todoList } from "./todo-list/problem";

/**
 * The full catalogue. Add a new problem by authoring a module under this folder
 * and appending it here — content ships via PRs, never DB seeds. Order here is
 * cosmetic; the catalogue sorts by each problem's `displayOrder`.
 */
export const MACHINE_CODING_PROBLEMS: MachineCodingProblem[] = [
  // js-utility (vanilla-ts)
  flattenArray,
  debounce,
  throttle,
  curry,
  deepClone,
  eventEmitter,
  promisePool,
  // ui-component (react-ts)
  starRating,
  accordion,
  tabs,
  todoList,
  modalDialog,
  autocomplete,
  imageCarousel,
  dataTable,
  nestedComments,
  ticTacToe,
  kanbanBoard,
];
