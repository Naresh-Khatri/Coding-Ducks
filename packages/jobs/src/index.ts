import { Queue, Worker } from "bullmq";

import { connection } from "./connection";
import { Language } from "./types";
import IsolateRunner from "./utils/isolate-runner";

export const QUEUE_NAMES = {
  EMAIL: "email",
  CODE_EXECUTION: "code-execution",
};

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection });
export const codeExecutionQueue = new Queue(QUEUE_NAMES.CODE_EXECUTION, {
  connection,
});

export const emailWorker = new Worker(
  QUEUE_NAMES.EMAIL,
  async (job) => {
    console.log("Processing email job:", job.name, job.data);
    // Simulate sending email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Email sent!");
  },
  { connection },
);

export const codeExecutionWorker = new Worker(
  QUEUE_NAMES.CODE_EXECUTION,
  async (job) => {
    // We instantiate a new runner for each job to avoid state pollution (rootDir)
    const runner = new IsolateRunner();

    const { code, lang, stdin, timeLimit, memoryLimit, subProcessLimit } =
      job.data;

    // console.log("job data  inside:", job.data);

    try {
      if (!code || !lang) {
        throw new Error("Missing code or lang in job data");
      }
      // console.log("Running code for job:", job.id);
      const result = await runner.runCode({
        code,
        lang: lang as Language,
        stdin: stdin || "",
        options: {
          timeLimit,
          memoryLimit,
          subProcessLimit,
        },
      });
      // console.log({ result });
      return result;
    } catch (error) {
      console.error("Code execution failed for job:", job.id, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 10, // Keep concurrency 1 for safety with Isolate for now
  },
);

export * from "./connection";
