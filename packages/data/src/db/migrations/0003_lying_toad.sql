ALTER TABLE `user` ADD `createdAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `updatedAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `created_at`;