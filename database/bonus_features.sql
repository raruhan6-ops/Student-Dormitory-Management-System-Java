-- Triggers for Automatic Consistency (idempotent)

-- Drop existing objects if they exist to allow re-running this script safely
DROP TRIGGER IF EXISTS trg_after_checkin;
DROP TRIGGER IF EXISTS trg_after_checkout;
DROP VIEW IF EXISTS vw_current_accommodation;
DROP VIEW IF EXISTS vw_room_occupancy;

DELIMITER //

-- Trigger 1: On Check-In (Insert into CheckInOut)
CREATE TRIGGER trg_after_checkin
AFTER INSERT ON CheckInOut
FOR EACH ROW
BEGIN
    IF NEW.Status = 'CurrentlyLiving' THEN
        -- Update Bed Status (Bed table is lowercase/snake_case)
        UPDATE Bed SET status = 'Occupied' WHERE bedid = NEW.BedID;
        -- Increment Room Occupancy (Room table is lowercase/snake_case)
        UPDATE Room SET current_occupancy = current_occupancy + 1 
        WHERE roomid = (SELECT roomid FROM Bed WHERE bedid = NEW.BedID);
    END IF;
END //

-- Trigger 2: On Check-Out (Update CheckInOut)
CREATE TRIGGER trg_after_checkout
AFTER UPDATE ON CheckInOut
FOR EACH ROW
BEGIN
    IF NEW.Status = 'CheckedOut' AND OLD.Status = 'CurrentlyLiving' THEN
        -- Update Bed Status
        UPDATE Bed SET status = 'Available' WHERE bedid = NEW.BedID;
        -- Decrement Room Occupancy
        UPDATE Room SET current_occupancy = current_occupancy - 1 
        WHERE roomid = (SELECT roomid FROM Bed WHERE bedid = NEW.BedID);
    END IF;
END //

DELIMITER ;

-- Database Views

-- View 1: Current Accommodation Details
CREATE OR REPLACE VIEW vw_current_accommodation AS
SELECT 
    s.studentid AS StudentID,
    s.name AS StudentName,
    s.major,
    s.class,
    b.BuildingName,
    r.room_number AS RoomNumber,
    bd.bed_number AS BedNumber,
    c.CheckInDate
FROM CheckInOut c
JOIN Student s ON c.StudentID = s.studentid
JOIN Bed bd ON c.BedID = bd.bedid
JOIN Room r ON bd.roomid = r.roomid
JOIN DormBuilding b ON r.buildingid = b.BuildingID
WHERE c.Status = 'CurrentlyLiving';

-- View 2: Room Occupancy Statistics
CREATE OR REPLACE VIEW vw_room_occupancy AS
SELECT 
    b.BuildingName,
    r.room_number AS RoomNumber,
    r.capacity,
    r.current_occupancy AS CurrentOccupancy,
    ROUND((r.current_occupancy / r.capacity) * 100, 2) AS OccupancyRate
FROM Room r
JOIN DormBuilding b ON r.buildingid = b.BuildingID;
