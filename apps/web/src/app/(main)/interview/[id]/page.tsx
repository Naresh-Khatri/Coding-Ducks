import { RoomWorkspacePage } from "~/components/ducklets/room-workspace-page";

/**
 * Machine-coding interview room — the workspace in practice mode (Problem panel
 * + countdown, AI/terminal off). Plain ducklets opened here are redirected to
 * `/ducklets/[id]` (see the route guard in `RoomWorkspacePage`).
 */
export default function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <RoomWorkspacePage params={params} mode="interview" />;
}
