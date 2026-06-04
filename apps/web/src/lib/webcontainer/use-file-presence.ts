"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";

export interface PresenceUser {
  id: string;
  name: string;
  photoURL?: string;
  color?: string;
}

interface AwarenessUserState {
  user?: { id?: string; name?: string; photoURL?: string; color?: string };
  activeFile?: string;
}

/**
 * Reads collaborator presence from Yjs awareness and groups it by the file
 * each person currently has open (their `activeFile` awareness field). Powers
 * the avatar stacks on the file explorer and editor tabs.
 *
 * Also returns `setActiveFile`, which publishes the local user's open file so
 * peers can see it.
 */
export function useFilePresence(provider: HocuspocusProvider | null) {
  const [byPath, setByPath] = useState<Record<string, PresenceUser[]>>({});

  useEffect(() => {
    const awareness = provider?.awareness;
    if (!awareness) return;

    const recompute = () => {
      const next: Record<string, PresenceUser[]> = {};
      const seen = new Set<string>();
      for (const state of awareness.getStates().values()) {
        const s = state as AwarenessUserState;
        const path = s.activeFile;
        const user = s.user;
        if (!path || !user?.id) continue;
        // De-dupe a user who has the same file open across multiple tabs.
        const dedupeKey = `${path}::${user.id}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        (next[path] ??= []).push({
          id: user.id,
          name: user.name ?? "",
          photoURL: user.photoURL,
          color: user.color,
        });
      }
      setByPath(next);
    };

    // Compute the initial snapshot from the external Yjs awareness store, then
    // keep it in sync via the subscription below. This reads an external store,
    // not a prop, so it isn't the prop-mirroring anti-pattern.
    // react-doctor-disable-next-line react-doctor/no-adjust-state-on-prop-change
    recompute();
    awareness.on("change", recompute);
    return () => awareness.off("change", recompute);
  }, [provider]);

  const setActiveFile = useCallback(
    (path: string | null) => {
      provider?.setAwarenessField("activeFile", path ?? undefined);
    },
    [provider],
  );

  return useMemo(() => ({ byPath, setActiveFile }), [byPath, setActiveFile]);
}
