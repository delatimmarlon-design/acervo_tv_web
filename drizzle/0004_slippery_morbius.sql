CREATE TABLE `importAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programName` varchar(255) NOT NULL,
	`alertType` enum('unusual_date','missing_episode','disk_space') NOT NULL,
	`alertMessage` text NOT NULL,
	`broadcastDate` varchar(10),
	`status` enum('pending','acknowledged','resolved') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `importAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programName` varchar(255) NOT NULL,
	`daysOfWeek` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `alertUserIdIdx` ON `importAlerts` (`userId`);--> statement-breakpoint
CREATE INDEX `alertProgramNameIdx` ON `importAlerts` (`programName`);--> statement-breakpoint
CREATE INDEX `alertStatusIdx` ON `importAlerts` (`status`);--> statement-breakpoint
CREATE INDEX `scheduleUserIdIdx` ON `programSchedules` (`userId`);--> statement-breakpoint
CREATE INDEX `scheduleProgramNameIdx` ON `programSchedules` (`programName`);