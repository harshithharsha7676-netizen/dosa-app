-- ============================================================
-- Famous 99 Variety Dosa - Database Setup Script
-- Run this in MySQL before starting the application
-- ============================================================

CREATE DATABASE IF NOT EXISTS dosa_ordering_db;
USE dosa_ordering_db;

-- Tables are auto-created by Spring Boot (JPA ddl-auto=update)
-- This script seeds initial menu data from the menu image

-- MIGRATION: Allow menu_item_id to be NULL so items with past orders can be deleted
-- Run this if the app was already running before this update:
-- ALTER TABLE order_items MODIFY COLUMN menu_item_id BIGINT NULL;

-- MIGRATION v12: Add item_name snapshot column (preserves name when item is deleted)
-- Run this if upgrading from a previous version:
-- ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_name VARCHAR(255);

-- After starting the app, run this to insert the full menu:

INSERT INTO menu_items (name, price, category, is_available, created_at, updated_at) VALUES
-- Butter Dosa
('Special Pizza Dosa', 150, 'Butter Dosa', 1, NOW(), NOW()),
('Aloo Butter Masala Dosa', 50, 'Butter Dosa', 1, NOW(), NOW()),
('Mysore Butter Masala Dosa', 60, 'Butter Dosa', 1, NOW(), NOW()),
('Gobi Butter Masala Dosa', 70, 'Butter Dosa', 1, NOW(), NOW()),
('Palak Butter Masala Dosa', 70, 'Butter Dosa', 1, NOW(), NOW()),
('Noodles Butter Masala Dosa', 80, 'Butter Dosa', 1, NOW(), NOW()),
('Green Peas Butter Masala Dosa', 70, 'Butter Dosa', 1, NOW(), NOW()),
('Pavbhaji Butter Masala Dosa', 70, 'Butter Dosa', 1, NOW(), NOW()),
('Sweet Corn Butter Masala Dosa', 70, 'Butter Dosa', 1, NOW(), NOW()),
('Baby Corn Butter Masala Dosa', 70, 'Butter Dosa', 1, NOW(), NOW()),
('Mushroom Butter Masala Dosa', 80, 'Butter Dosa', 1, NOW(), NOW()),
('Paneer Butter Masala Dosa', 80, 'Butter Dosa', 1, NOW(), NOW()),
('Dilkush Butter Masala Dosa', 80, 'Butter Dosa', 1, NOW(), NOW()),
('Kerala Butter Masala Dosa', 80, 'Butter Dosa', 1, NOW(), NOW()),
('Jenne Butter Masala Dosa', 80, 'Butter Dosa', 1, NOW(), NOW()),
('Spring Roll Butter Masala Dosa', 80, 'Butter Dosa', 1, NOW(), NOW()),
('Kolhapur Butter Masala Dosa', 80, 'Butter Dosa', 1, NOW(), NOW()),
('BabyCorn SweetCorn Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Palak Baby Corn Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Palak Paneer Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Green Peas Paneer Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Paneer Mysore Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Mushroom Paneer Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Gobi Paneer Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Palak Gobi Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Green Peas Mysore Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Pavbhaji Paneer Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Sweet Corn Paneer Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Jenne Sweet Corn Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Sweet Corn Noodle Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('Noodle Paneer Butter Masala Dosa', 90, 'Butter Dosa', 1, NOW(), NOW()),
('All Mix Vegetables Butter Masala Dosa', 120, 'Butter Dosa', 1, NOW(), NOW()),
('Madka Paneer Butter Dosa', 199, 'Butter Dosa', 1, NOW(), NOW()),

-- Schezwan Dosa
('Schezwan Plain Butter Dosa', 50, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Aloo Butter Dosa', 60, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Mysore Butter Dosa', 70, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Gobi Butter Dosa', 80, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Palak Butter Dosa', 80, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Noodles Butter Dosa', 90, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Green Peas Butter Dosa', 80, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Pavbhaji Butter Dosa', 80, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Sweet Corn Butter Dosa', 80, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Baby Corn Butter Dosa', 80, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Mushroom Butter Dosa', 90, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Paneer Butter Dosa', 90, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Dilkush Butter Dosa', 90, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Kerala Butter Dosa', 90, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Jenne Butter Dosa', 90, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Spring Roll Butter Dosa', 90, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Kolhapur Butter Dosa', 90, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan BabyCorn SweetCorn Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Palak Baby Corn Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Palak Paneer Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Green Peas Paneer Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Paneer Mysore Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Mushroom Paneer Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Gobi Paneer Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Palak Gobi Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Green Peas Mysore Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Pavbhaji Paneer Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Sweet Corn Paneer Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Jenne Sweet Corn Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Sweet Corn Noodle Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Noodle Paneer Butter Dosa', 100, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan All Mix Vegetables Butter Dosa', 130, 'Schezwan Dosa', 1, NOW(), NOW()),
('Schezwan Hyderabad Special Butter Dosa', 199, 'Schezwan Dosa', 1, NOW(), NOW()),

-- Cheese Dosa
('Cheese Plain Butter Dosa', 60, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Aloo Butter Dosa', 80, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Mysore Butter Dosa', 90, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Gobi Butter Dosa', 100, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Palak Butter Dosa', 100, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Noodles Butter Dosa', 110, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Green Peas Butter Dosa', 100, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Pavbhaji Butter Dosa', 100, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Sweet Corn Butter Dosa', 100, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Baby Corn Butter Dosa', 100, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Mushroom Butter Dosa', 110, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Paneer Butter Dosa', 110, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Dilkush Butter Dosa', 110, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Kerala Butter Dosa', 110, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Jenne Butter Dosa', 110, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Spring Roll Butter Dosa', 110, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Kolhapur Butter Dosa', 110, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese BabyCorn SweetCorn Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Palak Baby Corn Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Palak Paneer Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Green Peas Paneer Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Paneer Mysore Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Mushroom Paneer Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Gobi Paneer Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Palak Gobi Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Green Peas Mysore Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Pavbhaji Paneer Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Sweet Corn Paneer Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Jenne Sweet Corn Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Sweet Corn Noodle Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Noodle Paneer Butter Dosa', 120, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese All Mix Vegetables Butter Dosa', 150, 'Cheese Dosa', 1, NOW(), NOW()),
('Cheese Special Mix Butter Dosa', 199, 'Cheese Dosa', 1, NOW(), NOW()),

-- Water Bottles
('Water Bottle 500ml', 10, 'Beverages', 1, NOW(), NOW()),
('Water Bottle 1000ml', 20, 'Beverages', 1, NOW(), NOW());

-- To add Water Bottles if already inserted the rest (run separately):
-- INSERT INTO menu_items (name, price, category, is_available, created_at, updated_at) VALUES
-- ('Water Bottle 500ml', 10, 'Beverages', 1, NOW(), NOW()),
-- ('Water Bottle 1000ml', 20, 'Beverages', 1, NOW(), NOW());
