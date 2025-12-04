-- Fix for inconsistent occupancy data in Heatmap
-- This view calculates occupancy dynamically from CheckInOut records instead of relying on the static Room.CurrentOccupancy column

CREATE OR REPLACE VIEW vw_room_occupancy AS
SELECT 
    db.BuildingName,
    r.RoomNumber,
    r.Capacity,
    (SELECT COUNT(*) 
     FROM CheckInOut c 
     JOIN Bed b ON c.BedID = b.BedID 
     WHERE b.RoomID = r.RoomID AND c.Status = 'CurrentlyLiving') AS CurrentOccupancy,
    CASE 
        WHEN r.Capacity > 0 THEN ROUND((
            (SELECT COUNT(*) 
             FROM CheckInOut c 
             JOIN Bed b ON c.BedID = b.BedID 
             WHERE b.RoomID = r.RoomID AND c.Status = 'CurrentlyLiving')
            / r.Capacity) * 100, 2)
        ELSE 0
    END AS OccupancyRate
FROM Room r
JOIN DormBuilding db ON r.BuildingID = db.BuildingID;
