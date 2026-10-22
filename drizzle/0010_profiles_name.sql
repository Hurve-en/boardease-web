ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "name" text NOT NULL DEFAULT 'User';--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "name" DROP DEFAULT;
