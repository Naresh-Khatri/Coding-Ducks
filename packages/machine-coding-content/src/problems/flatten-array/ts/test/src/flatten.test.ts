import { flatten } from "./flatten";
import { cases } from "./mc-test";

cases("flatten", (input) => flatten(input as unknown[]), [
  {
    name: "flattens a deeply nested array",
    input: [1, [2, [3, [4]], 5]],
    expected: [1, 2, 3, 4, 5],
  },
  {
    name: "leaves an already-flat array unchanged",
    input: [1, 2, 3],
    expected: [1, 2, 3],
  },
  { name: "handles an empty array", input: [], expected: [] },
  {
    name: "preserves left-to-right order",
    input: [[1], [2, [3]], 4],
    expected: [1, 2, 3, 4],
  },
  {
    name: "does not mutate the input",
    input: [1, [2, 3]],
    expected: [1, [2, 3]],
    run: (input) => {
      flatten(input as unknown[]);
      return input;
    },
  },
]);
