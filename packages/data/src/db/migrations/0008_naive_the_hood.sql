ALTER TABLE `user` ADD `phoneNumber` text;--> statement-breakpoint
ALTER TABLE `user` ADD `phoneNumberVerified` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `user_phoneNumber_unique` ON `user` (`phoneNumber`);