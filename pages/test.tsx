import { Button } from "@chakra-ui/react";
import React, { useContext } from "react";
import axiosInstance from "../lib/axios";
import axios from "axios";
import { EditorSettingsContext } from "../contexts/editorSettingsContext";

function Test() {
  const { settings, updateSettings } = useContext(EditorSettingsContext);
  // console.log(settings);
  updateSettings({ lang: "java", theme: "monokai" });
  const test = async () => {
    console.log("test");
    let avg = 0;
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      const promises = [];
      for (let i = 0; i < 40; i++) {
        const payload = {
          code: "# Read matrix size\nn = int(input())\n\n# Initialize an empty matrix\nmatrix = []\n\n# Read matrix elements\nfor _ in range(n):\n    row = list(map(int, input().split()))\n    matrix.append(row)\n\n# Calculate row-wise sums\nrow_sums = []\nfor row in matrix:\n    row_sum = sum(row)\n    row_sums.append(row_sum)\n\n# Print row-wise sums\nprint(*row_sums)\n",
          lang: "py",
          submit: false,
          problemId: 122,
        };
        promises.push(axiosInstance.post("/runCode", payload));
      }
      const res = await Promise.all(promises);
      // console.log(res);

      avg += performance.now() - start;
      console.log(i);
    }
    console.log(avg / 5);
  };
  return (
    <div>
      <Button onClick={test}>test</Button>
      {JSON.stringify(settings)}
    </div>
  );
}

export default Test;

[
  {
    changes: [
      {
        range: {
          startLineNumber: 10,
          startColumn: 1,
          endLineNumber: 11,
          endColumn: 28,
        },
        rangeLength: 53,
        text: "",
        rangeOffset: 365,
        forceMoveMarkers: true,
      },
    ],
    eol: "\n",
    isEolChange: false,
    versionId: 2,
    isUndoing: false,
    isRedoing: false,
    isFlush: false,
  },
];
[
  {
    changes: [
      {
        range: {
          startLineNumber: 10,
          startColumn: 1,
          endLineNumber: 11,
          endColumn: 28,
        },
        rangeLength: 53,
        text: "",
        rangeOffset: 365,
        forceMoveMarkers: true,
      },
    ],
    eol: "\n",
    isEolChange: false,
    versionId: 2,
    isUndoing: false,
    isRedoing: false,
    isFlush: false,
  },
];
