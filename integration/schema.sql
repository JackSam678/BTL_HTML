-- schema.sql
-- MySQL schema for btl_robotics minimal tables used by the Express API

CREATE DATABASE IF NOT EXISTS `btl_robotics` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `btl_robotics`;

-- contacts 表
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) DEFAULT '',
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- products 表
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `price` DECIMAL(12,2) DEFAULT 0.00,
  `image` VARCHAR(512) DEFAULT '',
  `status` TINYINT DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
