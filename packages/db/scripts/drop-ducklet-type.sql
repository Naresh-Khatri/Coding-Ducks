-- Drop the dead ducklet.type column and its enum.
--
-- Frontend-only scope means every ducklet is implicitly "web"; the column was
-- never used to gate behavior. `drizzle-kit push` will detect the column
-- removal in the schema, but the pgEnum drop is safer to run explicitly so
-- the type doesn't linger in the database.
--
-- Run AFTER `drizzle-kit push` has dropped the column.

BEGIN;
DROP TYPE IF EXISTS ducklet_type;
COMMIT;
