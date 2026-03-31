CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programName` varchar(255) NOT NULL,
	`broadcastDate` varchar(10) NOT NULL,
	`channel` varchar(100) NOT NULL,
	`hdNumber` int NOT NULL,
	`programType` enum('Telejornal','Novela','Série','Variedade') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `videos` (`userId`);--> statement-breakpoint
CREATE INDEX `programNameIdx` ON `videos` (`programName`);--> statement-breakpoint
CREATE INDEX `broadcastDateIdx` ON `videos` (`broadcastDate`);--> statement-breakpoint
CREATE INDEX `channelIdx` ON `videos` (`channel`);--> statement-breakpoint
CREATE INDEX `hdNumberIdx` ON `videos` (`hdNumber`);--> statement-breakpoint
CREATE INDEX `programTypeIdx` ON `videos` (`programType`);