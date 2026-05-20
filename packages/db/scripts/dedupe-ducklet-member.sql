-- Run this BEFORE `pnpm db:push` if you may have duplicate
-- (ducklet_id, user_id) rows in ducklet_member. Without this, adding
-- the composite primary key will fail with a unique constraint error.
--
-- Keeps the oldest row per pair (smallest joined_at) and deletes the rest.

DELETE FROM ducklet_member dm
USING ducklet_member dup
WHERE dm.ducklet_id = dup.ducklet_id
  AND dm.user_id    = dup.user_id
  AND dm.ctid       <> dup.ctid
  AND (dm.joined_at, dm.ctid) > (dup.joined_at, dup.ctid);
