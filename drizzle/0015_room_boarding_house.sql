CREATE TABLE "boarding_houses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "boarding_houses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "boarding_houses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_room_number_unique";--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "boarding_house_id" uuid;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_boarding_house_id_boarding_houses_id_fk" FOREIGN KEY ("boarding_house_id") REFERENCES "public"."boarding_houses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_house_room_unique" UNIQUE NULLS NOT DISTINCT("boarding_house_id","room_number");