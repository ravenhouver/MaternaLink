UPDATE "user_account"
SET "role" = 'IFK_ADMIN', "active" = false
WHERE "role" = 'SUPER_ADMIN' OR "username" = 'admin';

CREATE TYPE "UserRole_new" AS ENUM ('BIDAN_PUSKESMAS', 'IFK_ADMIN');

ALTER TABLE "user_account"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING "role"::text::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
