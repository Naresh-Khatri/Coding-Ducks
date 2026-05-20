// Lightweight server-side telemetry. Today it writes structured JSON to
// stdout (so log aggregation can pick events up); when we add a real sink
// (PostHog, Segment, etc.) we swap the implementation here without
// touching call sites.
//
// Events are intentionally low-cardinality — feature lifecycle hooks
// only, not per-request traffic.

export type TelemetryEvent =
  | "ducklet.created"
  | "ducklet.forked"
  | "ducklet.deleted"
  | "ducklet.snapshot.created"
  | "ducklet.snapshot.restored"
  | "ducklet.member.invited"
  | "ducklet.member.removed"
  | "ducklet.member.role_changed"
  | "ducklet.access.requested";

export function track(
  event: TelemetryEvent,
  properties: Record<string, string | number | boolean | null | undefined> = {},
): void {
  // Structured single-line JSON is friendly to log aggregators (Datadog,
  // Loki, CloudWatch Insights) without needing a separate transport.
  try {
    process.stdout.write(
      JSON.stringify({
        type: "telemetry",
        event,
        ts: new Date().toISOString(),
        ...properties,
      }) + "\n",
    );
  } catch {
    // Never let telemetry failures break the request.
  }
}
