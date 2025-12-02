-- Migration: Add version column to Bed table for optimistic locking
-- This prevents concurrent booking of the same bed by multiple students

-- Add version column for optimistic locking (JPA @Version)
ALTER TABLE Bed ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;

-- Update existing records to have version 0
UPDATE Bed SET version = 0 WHERE version IS NULL;

-- Add Reserved status support (for pending applications)
-- The Status column can now be: Available, Occupied, Reserved
-- Reserved means a student has applied but not yet been approved

-- Note: If using MySQL 5.7 or earlier, use this syntax instead:
-- ALTER TABLE Bed ADD COLUMN version INT DEFAULT 0;
