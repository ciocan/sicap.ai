DROP INDEX "account__providerId__accountId__idx";--> statement-breakpoint
DROP INDEX "account__userId__idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "session__token__idx";--> statement-breakpoint
DROP INDEX "session__userId__idx";--> statement-breakpoint
DROP INDEX "users__email__idx";--> statement-breakpoint
DROP INDEX "verification__identifier__idx";--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "createdAt" TO "createdAt" integer;--> statement-breakpoint
CREATE UNIQUE INDEX `account__providerId__accountId__idx` ON `account` (`providerId`,`accountId`);--> statement-breakpoint
CREATE INDEX `account__userId__idx` ON `account` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `session__token__idx` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session__userId__idx` ON `session` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users__email__idx` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `verification__identifier__idx` ON `verification` (`identifier`);--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "updatedAt" TO "updatedAt" integer;