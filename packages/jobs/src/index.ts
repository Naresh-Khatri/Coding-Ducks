import { Queue, Worker } from "bullmq";

import { connection } from "./connection";
import { reconcileSubmission } from "./submission-reconcile";
import { Language } from "./types";
import IsolateRunner from "./utils/isolate-runner";

export const QUEUE_NAMES = {
  EMAIL: "email",
  CODE_EXECUTION: "code-execution",
  SUBMISSION_RECONCILE: "submission-reconcile",
};

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection });
export const codeExecutionQueue = new Queue(QUEUE_NAMES.CODE_EXECUTION, {
  connection,
});

export const submissionReconcileQueue = new Queue(
  QUEUE_NAMES.SUBMISSION_RECONCILE,
  { connection },
);

/**
 * Schedule server-side reconciliation for a submission so its result is
 * persisted even if the user closes the tab mid-poll. Retries with backoff
 * until the row reaches a terminal state (the judge usually finishes in
 * seconds; the reconciler force-fails to `judge_error` after the timeout,
 * so the job always terminates within ~the backoff window).
 *
 * `jobId` dedupes against a double enqueue for the same row.
 */
export async function enqueueSubmissionReconcile(submissionId: number) {
  await submissionReconcileQueue.add(
    "reconcile",
    { submissionId },
    {
      jobId: `submission-${submissionId}`,
      delay: 2000,
      attempts: 40,
      backoff: { type: "fixed", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
}

export const submissionReconcileWorker = new Worker<{ submissionId: number }>(
  QUEUE_NAMES.SUBMISSION_RECONCILE,
  async (job) => {
    const row = await reconcileSubmission(job.data.submissionId);
    // Still pending on the judge — throw so BullMQ retries with backoff.
    if (row && row.status === "running") {
      throw new Error(`submission ${job.data.submissionId} still running`);
    }
  },
  { connection, concurrency: 5 },
);

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

export { reconcileSubmission } from "./submission-reconcile";
export * from "./connection";
