CREATE TABLE `ingredient_prices` (
	`id` text PRIMARY KEY NOT NULL,
	`ingredient_id` text NOT NULL,
	`price` real NOT NULL,
	`currency` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`icon` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`ingredient_id` text NOT NULL,
	`quantity_per_person` real NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`steps` text NOT NULL,
	`image_path` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
