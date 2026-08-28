CREATE SEQUENCE "public"."user_uid_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 100001 CACHE 1;--> statement-breakpoint
CREATE TABLE "game_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"room_id" varchar(64) NOT NULL,
	"room_name" varchar(100) NOT NULL,
	"round_count" integer DEFAULT 1 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) DEFAULT 'draw' NOT NULL,
	"password_hash" varchar(255),
	"is_open" boolean DEFAULT true NOT NULL,
	"open_start_time" varchar(10),
	"open_end_time" varchar(10),
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_owner_id_unique" UNIQUE("owner_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uid" bigint NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_key" varchar(50) DEFAULT 'voxel_01' NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"is_stats_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_uid_unique" UNIQUE("uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "game_records" ADD CONSTRAINT "game_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;