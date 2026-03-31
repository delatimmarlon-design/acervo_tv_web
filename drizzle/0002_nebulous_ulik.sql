CREATE TABLE `userInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`invitedEmail` varchar(320) NOT NULL,
	`permissionLevel` enum('viewer','editor','admin') NOT NULL DEFAULT 'viewer',
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userInvitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `userInvitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `userPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ownerUserId` int NOT NULL,
	`permissionLevel` enum('viewer','editor','admin') NOT NULL DEFAULT 'viewer',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `invitationOwnerUserIdIdx` ON `userInvitations` (`ownerUserId`);--> statement-breakpoint
CREATE INDEX `invitationTokenIdx` ON `userInvitations` (`token`);--> statement-breakpoint
CREATE INDEX `userPermissionUserIdIdx` ON `userPermissions` (`userId`);--> statement-breakpoint
CREATE INDEX `userPermissionOwnerUserIdIdx` ON `userPermissions` (`ownerUserId`);