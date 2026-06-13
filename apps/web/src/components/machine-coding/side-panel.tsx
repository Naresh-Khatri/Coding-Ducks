import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";

import type { MachineCodingContext } from "./types";
import type {
  WorkspaceApi,
  WorkspaceBottomPanel,
  WorkspaceSidePanel,
} from "~/components/code-workspace/workspace";
import { MachineCodingBottomPanel } from "./machine-coding-bottom-panel";
import { MachineCodingPanel } from "./machine-coding-panel";
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
      render: () => <MachineCodingPanel context={context} />,
    },
    bottomPanel: {
      label: "Tests",
      icon: <FlaskConical className="mr-1 size-3" />,
      render: () => <MachineCodingBottomPanel />,
    },
    renderProvider: (api, children) => (
      <MachineCodingTestsProvider
        runtime={api.runtime}
        context={context}
        readFiles={api.readFiles}
        ydoc={api.ydoc}
      >
        {children}
      </MachineCodingTestsProvider>
    ),
  };
}
