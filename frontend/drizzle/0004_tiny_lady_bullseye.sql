ALTER TABLE "plattform_project" ADD COLUMN "user_id" varchar(255) NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plattform_project" ADD CONSTRAINT "plattform_project_user_id_plattform_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."plattform_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "plattform_project" ADD CONSTRAINT "plattform_project_user_id_unique" UNIQUE("user_id");