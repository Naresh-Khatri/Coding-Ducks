import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";

import type {
  WorkspaceApi,
  WorkspaceBottomPanel,
  WorkspaceSidePanel,
} from "~/components/code-workspace/workspace";
import { MachineCodingPanel } from "./machine-coding-panel";
import { RevealSolutionButton } from "./reveal-solution-button";
import { TestResultsPanel } from "./test-results-panel";
import type { MachineCodingContext } from "./types";
import { MachineCodingTestsProvider } from "./use-tests";

/** Everything the Workspace needs to render a machine-coding attempt. */
export interface MachineCodingExtension {
  /** Left "Problem" tab: statement, run/reveal/complete actions, countdown. */
  sidePanel: WorkspaceSidePanel;
  /** Bottom "Tests" drawer: per-spec pass/fail breakdown. */
  bottomPanel: WorkspaceBottomPanel;
  /** Wraps the workspace so both panels share one test-run state. */
  renderProvider: (api: WorkspaceApi, children: ReactNode) => ReactNode;
}

/**
 * The single adapter between the machine-coding feature and the otherwise
 * domain-agnostic editor: a Problem side panel, a Tests bottom drawer, and a
 * shared-state provider mounted above both. The Workspace knows nothing about
 * problems, timers, tests or solutions.
 */
export function machineCodingExtension(
  context: MachineCodingContext,
): MachineCodingExtension {
  return {
    sidePanel: {
      label: "Problem",
      toolbar: (
        <div className="flex items-center gap-1">
          <RevealSolutionButton />
        </div>
      ),
      render: () => <MachineCodingPanel context={context} />,
    },
    bottomPanel: {
      label: "Tests",
      icon: <FlaskConical className="mr-1 size-3" />,
      render: () => <TestResultsPanel />,
    },
    renderProvider: (api, children) => (
      <MachineCodingTestsProvider
        runtime={api.runtime}
        context={context}
        onShowSolution={api.loadFilesAsDiff}
        readFiles={api.readFiles}
      >
        {children}
      </MachineCodingTestsProvider>
    ),
  };
}
