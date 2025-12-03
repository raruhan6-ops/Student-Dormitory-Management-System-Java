-- Bonus Features: Triggers and Views for Dormitory System
-- This script is idempotent (safe to run multiple times)
-- NOTE: Uses PascalCase table names to match schema.sql definitions

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_after_checkin;
DROP TRIGGER IF EXISTS trg_after_checkout;

-- =============================================
-- Triggers for Automatic Data Consistency
-- =============================================
-- Note: These triggers auto-update bed status and room occupancy
-- when check-in/check-out operations occur

DELIMITER //

-- Trigger 1: On Check-In (Insert into CheckInOut)
CREATE TRIGGER trg_after_checkin
AFTER INSERT ON CheckInOut
FOR EACH ROW
BEGIN
    IF NEW.Status = 'CurrentlyLiving' THEN
        -- Update Bed Status to Occupied
        UPDATE Bed SET Status = 'Occupied' WHERE BedID = NEW.BedID;
        -- Increment Room Occupancy
        UPDATE Room SET CurrentOccupancy = CurrentOccupancy + 1 
        WHERE RoomID = (SELECT RoomID FROM Bed WHERE BedID = NEW.BedID);
    END IF;
END //

-- Trigger 2: On Check-Out (Update CheckInOut status)
CREATE TRIGGER trg_after_checkout
AFTER UPDATE ON CheckInOut
FOR EACH ROW
BEGIN
    IF NEW.Status = 'CheckedOut' AND OLD.Status = 'CurrentlyLiving' THEN
        -- Update Bed Status to Available
        UPDATE Bed SET Status = 'Available' WHERE BedID = NEW.BedID;
        -- Decrement Room Occupancy
        UPDATE Room SET CurrentOccupancy = GREATEST(0, CurrentOccupancy - 1) 
        WHERE RoomID = (SELECT RoomID FROM Bed WHERE BedID = NEW.BedID);
    END IF;
END //

DELIMITER ;

-- =============================================
-- Stored Procedure: Recalculate Room Occupancy
-- =============================================
-- This procedure syncs CurrentOccupancy with actual check-in data
-- Useful for fixing any inconsistencies in the data

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_sync_room_occupancy()
BEGIN
    -- Update all rooms' CurrentOccupancy based on actual CheckInOut records
    UPDATE Room r
    SET CurrentOccupancy = (
        SELECT COUNT(*)
        FROM CheckInOut c
        JOIN Bed b ON c.BedID = b.BedID
        WHERE b.RoomID = r.RoomID AND c.Status = 'CurrentlyLiving'
    );
    
    -- Also sync Bed status
    UPDATE Bed b
    SET Status = CASE 
        WHEN EXISTS (
            SELECT 1 FROM CheckInOut c 
            WHERE c.BedID = b.BedID AND c.Status = 'CurrentlyLiving'
        ) THEN 'Occupied'
        ELSE 'Available'
    END;
END //

DELIMITER ;
