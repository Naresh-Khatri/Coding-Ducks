import type { MachineCodingProblem } from "../types";
import { accordion } from "./accordion";
import { autocomplete } from "./autocomplete";
import { curry } from "./curry";
import { dataTable } from "./data-table";
import { debounce } from "./debounce";
import { deepClone } from "./deep-clone";
import { eventEmitter } from "./event-emitter";
import { flattenArray } from "./flatten-array";
import { imageCarousel } from "./image-carousel";
import { kanbanBoard } from "./kanban-board";
import { modalDialog } from "./modal-dialog";
import { nestedComments } from "./nested-comments";
import { promisePool } from "./promise-pool";
import { starRating } from "./star-rating";
import { tabs } from "./tabs";
import { throttle } from "./throttle";
import { ticTacToe } from "./tic-tac-toe";
import { todoList } from "./todo-list";

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
  // small-app (react-ts)
  ticTacToe,
  kanbanBoard,
];
