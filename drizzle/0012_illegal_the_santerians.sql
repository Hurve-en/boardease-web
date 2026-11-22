CREATE TYPE "public"."payment_submission_status" AS ENUM('pending', 'approved', 'needs_update');--> statement-breakpoint
ALTER TABLE "payment_submissions" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payment_submissions" ALTER COLUMN "status" SET DATA TYPE "public"."payment_submission_status" USING "status"::"public"."payment_submission_status";--> statement-breakpoint
ALTER TABLE "payment_submissions" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "payment_submissions" ENABLE ROW LEVEL SECURITY;