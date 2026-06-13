import { RoomWorkspacePage } from "~/components/ducklets/room-workspace-page";

/**
 * Plain collaborative ducklet. Machine-coding interview rooms are served from
 * `/interview/[id]` instead; if one is opened here it is redirected there (see
 * the route guard in `RoomWorkspacePage`).
 */
export default function DuckletPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <RoomWorkspacePage params={params} mode="ducklet" />;
}
