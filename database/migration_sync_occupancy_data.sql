-- Fix for inconsistent Room.CurrentOccupancy and Bed.Status data
-- Run this script to synchronize the Room and Bed tables with the actual CheckInOut records

-- 1. Update Room Occupancy
UPDATE Room r 
SET CurrentOccupancy = (
    SELECT COUNT(*) 
    FROM CheckInOut c 
    JOIN Bed b ON c.BedID = b.BedID 
    WHERE b.RoomID = r.RoomID AND c.Status = 'CurrentlyLiving'
);

-- 2. Update Bed Status
UPDATE Bed b 
SET Status = CASE 
    WHEN EXISTS (
        SELECT 1 
        FROM CheckInOut c 
        WHERE c.BedID = b.BedID AND c.Status = 'CurrentlyLiving'
    ) THEN 'Occupied' 
    ELSE 'Available' 
END;
