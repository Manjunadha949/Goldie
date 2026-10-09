CREATE TABLE `site_content` (
	`id` text PRIMARY KEY NOT NULL,
	`document` text NOT NULL,
	`version` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_owners` (
	`user_id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
