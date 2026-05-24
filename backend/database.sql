-- ==========================================================================
-- SKYVOYAGE INDIA - RELATIONAL DATABASE SCHEMA (SQL)
-- Compatible with PostgreSQL, MySQL, and MariaDB
-- ==========================================================================

-- 1. DROP TABLES IF THEY EXIST TO PREVENT CONFLICTS
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS gst_details;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS users;

-- 2. CREATE USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    miles INT DEFAULT 14850,
    tier VARCHAR(50) DEFAULT 'Ashoka Elite Gold',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE FLIGHTS TABLE
CREATE TABLE flights (
    id VARCHAR(50) PRIMARY KEY,
    airline VARCHAR(10) NOT NULL,
    flight_no VARCHAR(20) NOT NULL,
    from_code VARCHAR(10) NOT NULL,
    to_code VARCHAR(10) NOT NULL,
    flight_date DATE NOT NULL,
    departure TIME NOT NULL,
    arrival TIME NOT NULL,
    duration VARCHAR(20) NOT NULL,
    base_price INT NOT NULL,
    stops INT DEFAULT 0,
    occupied_seats TEXT DEFAULT '[]', -- JSON array string of occupied seat IDs e.g. '[4, 12, 19]'
    total_seats INT DEFAULT 90
);

-- 4. CREATE BOOKINGS TABLE
CREATE TABLE bookings (
    pnr VARCHAR(10) PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL,
    flight_id VARCHAR(50) NOT NULL,
    flight_no VARCHAR(20) NOT NULL,
    airline VARCHAR(10) NOT NULL,
    from_code VARCHAR(10) NOT NULL,
    to_code VARCHAR(10) NOT NULL,
    flight_date DATE NOT NULL,
    departure TIME NOT NULL,
    arrival TIME NOT NULL,
    cabin_class VARCHAR(20) NOT NULL,
    seats TEXT NOT NULL,          -- Comma separated seat IDs: '4,12,19'
    seat_labels TEXT NOT NULL,    -- Comma separated seat labels: '1D,2F,4A'
    passengers TEXT NOT NULL,     -- Comma separated passenger names: 'Rohan Sharma,Anjali Sharma'
    contact_email VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    amount INT NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
);

-- 5. CREATE GST_DETAILS TABLE
CREATE TABLE gst_details (
    booking_pnr VARCHAR(10) PRIMARY KEY,
    gstin VARCHAR(20) NOT NULL,
    company VARCHAR(100) NOT NULL,
    FOREIGN KEY (booking_pnr) REFERENCES bookings(pnr) ON DELETE CASCADE
);

-- 6. CREATE PAYMENTS TABLE
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_pnr VARCHAR(10) NOT NULL,
    method VARCHAR(50) NOT NULL, -- 'upi', 'card', 'netbanking'
    details VARCHAR(100) NOT NULL, -- Card ending / UPI VPA / Bank Name
    reference_id VARCHAR(100) NOT NULL, -- Razorpay Transaction ID / Reference ID
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_pnr) REFERENCES bookings(pnr) ON DELETE CASCADE
);

-- ==========================================================================
-- 7. SEED INITIAL MOCK DATA
-- ==========================================================================

-- Insert Primary loyalty user account
INSERT INTO users (name, email, phone, miles, tier)
VALUES ('Rohan Sharma', 'rohan.sharma@gmail.com', '+91 98765 43210', 14850, 'Ashoka Elite Gold');

-- Seed dynamic domestic flights spanning major routes:
-- DEL (Delhi), BOM (Mumbai), BLR (Bengaluru), MAA (Chennai), CCU (Kolkata), HYD (Hyderabad)
-- Generating realistic listings for today and the next few days.

-- SEED FLIGHTS FOR MAY 25, 2026
INSERT INTO flights (id, airline, flight_no, from_code, to_code, flight_date, departure, arrival, duration, base_price, stops, occupied_seats) VALUES
('6E-20260525-0600', '6E', '6E-502', 'DEL', 'BOM', '2026-05-25', '06:00:00', '08:15:00', '2h 15m', 4200, 0, '[12, 13, 14, 45, 46]'),
('AI-20260525-0830', 'AI', 'AI-101', 'DEL', 'BOM', '2026-05-25', '08:30:00', '10:45:00', '2h 15m', 5500, 0, '[1, 2, 3, 4]'),
('SG-20260525-1415', 'SG', 'SG-807', 'DEL', 'BOM', '2026-05-25', '14:15:00', '16:35:00', '2h 20m', 3800, 0, '[78, 79, 80]'),
('QP-20260525-1800', 'QP', 'QP-451', 'DEL', 'BOM', '2026-05-25', '18:00:00', '20:15:00', '2h 15m', 4100, 0, '[]'),
('6E-20260525-2130', '6E', '6E-903', 'DEL', 'BOM', '2026-05-25', '21:30:00', '23:45:00', '2h 15m', 3900, 0, '[5, 6, 7, 8, 9]'),

('6E-20260525-0700', '6E', '6E-221', 'BOM', 'DEL', '2026-05-25', '07:00:00', '09:15:00', '2h 15m', 4300, 0, '[]'),
('AI-20260525-0900', 'AI', 'AI-204', 'BOM', 'DEL', '2026-05-25', '09:00:00', '11:15:00', '2h 15m', 5250, 0, '[12, 15, 18]'),
('SG-20260525-1530', 'SG', 'SG-402', 'BOM', 'DEL', '2026-05-25', '15:30:00', '17:50:00', '2h 20m', 3950, 0, '[]'),
('QP-20260525-1945', 'QP', 'QP-302', 'BOM', 'DEL', '2026-05-25', '19:45:00', '22:00:00', '2h 15m', 4200, 0, '[]'),

('6E-20260525-0630', '6E', '6E-311', 'DEL', 'BLR', '2026-05-25', '06:30:00', '09:15:00', '2h 45m', 5100, 0, '[]'),
('AI-20260525-1100', 'AI', 'AI-504', 'DEL', 'BLR', '2026-05-25', '11:00:00', '13:45:00', '2h 45m', 6200, 0, '[23, 24, 25, 26]'),
('SG-20260525-1700', 'SG', 'SG-612', 'DEL', 'BLR', '2026-05-25', '17:00:00', '19:50:00', '2h 50m', 4800, 0, '[]'),

('6E-20260525-0800', '6E', '6E-104', 'BLR', 'DEL', '2026-05-25', '08:00:00', '10:45:00', '2h 45m', 4900, 0, '[]'),
('AI-20260525-1215', 'AI', 'AI-509', 'BLR', 'DEL', '2026-05-25', '12:15:00', '15:00:00', '2h 45m', 6100, 0, '[]'),
('QP-20260525-2000', 'QP', 'QP-210', 'BLR', 'DEL', '2026-05-25', '20:00:00', '22:45:00', '2h 45m', 4800, 0, '[]'),

('6E-20260525-0900', '6E', '6E-401', 'DEL', 'CCU', '2026-05-25', '09:00:00', '11:20:00', '2h 20m', 4600, 0, '[]'),
('AI-20260525-1600', 'AI', 'AI-701', 'DEL', 'CCU', '2026-05-25', '16:00:00', '18:25:00', '2h 25m', 5800, 0, '[]'),
('SG-20260525-2015', 'SG', 'SG-302', 'DEL', 'CCU', '2026-05-25', '20:15:00', '22:40:00', '2h 25m', 4300, 0, '[]'),

('6E-20260525-1030', '6E', '6E-408', 'CCU', 'DEL', '2026-05-25', '10:30:00', '12:55:00', '2h 25m', 4500, 0, '[]'),
('AI-20260525-1815', 'AI', 'AI-706', 'CCU', 'DEL', '2026-05-25', '18:15:00', '20:40:00', '2h 25m', 5700, 0, '[]'),

('6E-20260525-0715', '6E', '6E-804', 'BOM', 'BLR', '2026-05-25', '07:15:00', '08:55:00', '1h 40m', 3400, 0, '[]'),
('QP-20260525-1300', 'QP', 'QP-104', 'BOM', 'BLR', '2026-05-25', '13:00:00', '14:40:00', '1h 40m', 3200, 0, '[]'),
('AI-20260525-1745', 'AI', 'AI-602', 'BOM', 'BLR', '2026-05-25', '17:45:00', '19:30:00', '1h 45m', 4500, 0, '[]'),

('6E-20260525-0930', '6E', '6E-809', 'BLR', 'BOM', '2026-05-25', '09:30:00', '11:10:00', '1h 40m', 3500, 0, '[]'),
('QP-20260525-1515', 'QP', 'QP-109', 'BLR', 'BOM', '2026-05-25', '15:15:00', '16:55:00', '1h 40m', 3300, 0, '[]'),

('6E-20260525-0815', '6E', '6E-702', 'DEL', 'HYD', '2026-05-25', '08:15:00', '10:30:00', '2h 15m', 4400, 0, '[]'),
('AI-20260525-1330', 'AI', 'AI-512', 'DEL', 'HYD', '2026-05-25', '13:30:00', '15:45:00', '2h 15m', 5400, 0, '[]'),
('6E-20260525-1900', '6E', '6E-708', 'DEL', 'HYD', '2026-05-25', '19:00:00', '21:15:00', '2h 15m', 4300, 0, '[]'),

('6E-20260525-1100', '6E', '6E-705', 'HYD', 'DEL', '2026-05-25', '11:00:00', '13:15:00', '2h 15m', 4550, 0, '[]'),
('AI-20260525-1615', 'AI', 'AI-517', 'HYD', 'DEL', '2026-05-25', '16:15:00', '18:30:00', '2h 15m', 5500, 0, '[]');

-- SEED FLIGHTS FOR MAY 26, 2026
INSERT INTO flights (id, airline, flight_no, from_code, to_code, flight_date, departure, arrival, duration, base_price, stops, occupied_seats) VALUES
('6E-20260526-0600', '6E', '6E-502', 'DEL', 'BOM', '2026-05-26', '06:00:00', '08:15:00', '2h 15m', 4200, 0, '[]'),
('AI-20260526-0830', 'AI', 'AI-101', 'DEL', 'BOM', '2026-05-26', '08:30:00', '10:45:00', '2h 15m', 5500, 0, '[]'),
('SG-20260526-1415', 'SG', 'SG-807', 'DEL', 'BOM', '2026-05-26', '14:15:00', '16:35:00', '2h 20m', 3800, 0, '[]'),
('QP-20260526-1800', 'QP', 'QP-451', 'DEL', 'BOM', '2026-05-26', '18:00:00', '20:15:00', '2h 15m', 4100, 0, '[]'),

('6E-20260526-0700', '6E', '6E-221', 'BOM', 'DEL', '2026-05-26', '07:00:00', '09:15:00', '2h 15m', 4300, 0, '[]'),
('AI-20260526-0900', 'AI', 'AI-204', 'BOM', 'DEL', '2026-05-26', '09:00:00', '11:15:00', '2h 15m', 5250, 0, '[]'),

('6E-20260526-0630', '6E', '6E-311', 'DEL', 'BLR', '2026-05-26', '06:30:00', '09:15:00', '2h 45m', 5100, 0, '[]'),
('AI-20260526-1100', 'AI', 'AI-504', 'DEL', 'BLR', '2026-05-26', '11:00:00', '13:45:00', '2h 45m', 6200, 0, '[]'),

('6E-20260526-0800', '6E', '6E-104', 'BLR', 'DEL', '2026-05-26', '08:00:00', '10:45:00', '2h 45m', 4900, 0, '[]');
