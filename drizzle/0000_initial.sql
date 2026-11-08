CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(80) NOT NULL,
	`description` varchar(255) NOT NULL DEFAULT '',
	`sortOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`unit` varchar(60) NOT NULL DEFAULT '',
	`unitPrice` int NOT NULL,
	`quantity` int NOT NULL,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32),
	`userId` int,
	`channel` enum('whatsapp','phone') NOT NULL,
	`status` enum('new','confirmed','preparing','out_for_delivery','delivered','cancelled') NOT NULL DEFAULT 'new',
	`customerName` varchar(120) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`address` text NOT NULL,
	`area` varchar(120) NOT NULL,
	`notes` text,
	`packingName` varchar(80) NOT NULL,
	`packingPrice` int NOT NULL,
	`subtotal` int NOT NULL,
	`deliveryFee` int NOT NULL,
	`total` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `packingOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`description` varchar(255) NOT NULL DEFAULT '',
	`price` int NOT NULL DEFAULT 0,
	`image` varchar(255),
	`recommendedFor` json NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `packingOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(140) NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`price` int NOT NULL,
	`unit` varchar(60) NOT NULL DEFAULT '',
	`image` varchar(255),
	`packingImage` varchar(255),
	`ingredients` json NOT NULL,
	`allergens` json NOT NULL,
	`dietary` json NOT NULL,
	`calories` int,
	`servingSize` varchar(60),
	`healthNotes` text,
	`expiryDate` date,
	`shelfLife` varchar(255),
	`available` boolean NOT NULL DEFAULT true,
	`featured` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `shopSettings` (
	`id` int NOT NULL,
	`phone` varchar(32) NOT NULL,
	`whatsapp` varchar(32) NOT NULL,
	`address` varchar(255) NOT NULL,
	`openingHours` varchar(120) NOT NULL DEFAULT '',
	`deliveryFee` int NOT NULL DEFAULT 0,
	`freeDeliveryOver` int NOT NULL DEFAULT 0,
	`deliveryNote` varchar(255) NOT NULL DEFAULT '',
	CONSTRAINT `shopSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(120),
	`phone` varchar(32),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `orderItems_orderId_idx` ON `orderItems` (`orderId`);--> statement-breakpoint
CREATE INDEX `orders_userId_idx` ON `orders` (`userId`);--> statement-breakpoint
CREATE INDEX `products_categoryId_idx` ON `products` (`categoryId`);