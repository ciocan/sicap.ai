CREATE UNIQUE INDEX `accounts__provider__providerAccountId__idx` ON `account` (`provider`,`providerAccountId`);--> statement-breakpoint
CREATE INDEX `accounts__userId__idx` ON `account` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions__sessionToken__idx` ON `session` (`sessionToken`);--> statement-breakpoint
CREATE INDEX `sessions__userId__idx` ON `session` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users__email__idx` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens__token__idx` ON `verificationToken` (`token`);