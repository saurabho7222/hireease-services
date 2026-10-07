CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`job_id` text NOT NULL,
	`job_title` text NOT NULL,
	`company` text NOT NULL,
	`is_sample` integer DEFAULT 0 NOT NULL,
	`snapshot` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_applications_user_job` ON `applications` (`user_id`,`job_id`);--> statement-breakpoint
CREATE INDEX `idx_applications_created` ON `applications` (`created_at`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`category` text NOT NULL,
	`location` text NOT NULL,
	`type` text NOT NULL,
	`experience` text NOT NULL,
	`compensation` text NOT NULL,
	`description` text NOT NULL,
	`skills` text NOT NULL,
	`responsibilities` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_jobs_status_created` ON `jobs` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`country` text NOT NULL,
	`education` text NOT NULL,
	`institution` text NOT NULL,
	`graduation_year` text NOT NULL,
	`skills` text NOT NULL,
	`experience` text NOT NULL,
	`resume_key` text,
	`resume_name` text,
	`consented_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL
);
