-- Drop the dead "owner" value from member_role.
-- Ownership is tracked exclusively via ducklet.owner_id; no ducklet_member row
-- should ever carry role='owner', but if existing prod data has any, promote
-- those users to 'editor' before recreating the enum without the value.
--
-- Run this BEFORE `drizzle-kit push` after the enum literal was narrowed in
-- packages/db/src/schema/enums.ts. Postgres does not support ALTER TYPE ... DROP VALUE,
-- so we recreate the type.

BEGIN;

-- 1. Defensive cleanup: any straggler rows get demoted to editor.
UPDATE ducklet_member SET role = 'editor' WHERE role = 'owner';

-- 2. Recreate the enum without "owner".
ALTER TYPE member_role RENAME TO member_role__old;
CREATE TYPE member_role AS ENUM ('editor', 'viewer');

ALTER TABLE ducklet_member
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE member_role USING role::text::member_role,
  ALTER COLUMN role SET DEFAULT 'viewer';

DROP TYPE member_role__old;

COMMIT;
