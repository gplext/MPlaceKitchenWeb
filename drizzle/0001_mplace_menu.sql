CREATE TABLE `kitchenBookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`date` date NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`hours` int NOT NULL,
	`purpose` varchar(255) NOT NULL DEFAULT '',
	`status` enum('new','confirmed','declined','done') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kitchenBookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `categories` ADD `kitchen` varchar(40) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orderItems` ADD `details` varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `sizes` json;--> statement-breakpoint
ALTER TABLE `products` ADD `choices` json;--> statement-breakpoint
ALTER TABLE `products` ADD `addons` json;--> statement-breakpoint
ALTER TABLE `shopSettings` ADD `dailySpecials` json;