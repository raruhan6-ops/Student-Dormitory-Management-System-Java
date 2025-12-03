package com.dormitory.controller;

import com.dormitory.entity.DormBuilding;
import com.dormitory.entity.Room;
import com.dormitory.repository.DormBuildingRepository;
import com.dormitory.repository.RoomRepository;
import com.dormitory.security.RequiresRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller for Occupancy Heatmap feature
 * Provides data for visualizing room occupancy across buildings
 */
@RestController
@RequestMapping("/api/heatmap")
public class HeatmapController {

    @Autowired
    private DormBuildingRepository buildingRepository;

    @Autowired
    private RoomRepository roomRepository;

    /**
     * Get list of all buildings for the building selector
     */
    @GetMapping("/buildings")
    @RequiresRole({"Admin", "DormManager"})
    public ResponseEntity<List<Map<String, Object>>> getBuildings() {
        List<DormBuilding> buildings = buildingRepository.findAll();
        List<Map<String, Object>> result = buildings.stream().map(b -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", b.getBuildingID());
            map.put("name", b.getBuildingName());
            map.put("location", b.getLocation());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Get room occupancy data for a specific building
     * Returns room details
     */
    @GetMapping("/building/{buildingId}")
    @RequiresRole({"Admin", "DormManager"})
    public ResponseEntity<Map<String, Object>> getBuildingHeatmap(@PathVariable Integer buildingId) {
        Optional<DormBuilding> buildingOpt = buildingRepository.findById(buildingId);
        if (buildingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        DormBuilding building = buildingOpt.get();
        List<Room> allRooms = roomRepository.findAll();
        List<Room> rooms = allRooms.stream()
            .filter(r -> buildingId.equals(r.getBuildingID()))
            .collect(Collectors.toList());
        
        // Calculate stats
        int totalBeds = 0;
        int occupiedBeds = 0;
        List<Map<String, Object>> roomDataList = new ArrayList<>();
        
        for (Room room : rooms) {
            int capacity = room.getCapacity() != null ? room.getCapacity() : 0;
            int occupied = room.getCurrentOccupancy() != null ? room.getCurrentOccupancy() : 0;
            
            totalBeds += capacity;
            occupiedBeds += occupied;
            
            Map<String, Object> roomData = new HashMap<>();
            roomData.put("id", room.getRoomID());
            roomData.put("roomNumber", room.getRoomNumber());
            roomData.put("capacity", capacity);
            roomData.put("occupied", occupied);
            roomData.put("roomType", room.getRoomType());
            
            // Calculate occupancy percentage
            double occupancyRate = capacity > 0 ? (double) occupied / capacity * 100 : 0;
            roomData.put("occupancyRate", Math.round(occupancyRate));
            
            // Determine color level (0-4) based on occupancy
            int colorLevel;
            if (occupied == 0) {
                colorLevel = 0; // Empty
            } else if (occupancyRate <= 25) {
                colorLevel = 1; // Low
            } else if (occupancyRate <= 50) {
                colorLevel = 2; // Medium-low
            } else if (occupancyRate <= 75) {
                colorLevel = 3; // Medium-high
            } else {
                colorLevel = 4; // High/Full
            }
            roomData.put("colorLevel", colorLevel);
            
            roomDataList.add(roomData);
        }
        
        // Sort rooms by room number
        roomDataList.sort((a, b) -> {
            String roomA = (String) a.get("roomNumber");
            String roomB = (String) b.get("roomNumber");
            return roomA.compareTo(roomB);
        });
        
        // Build response
        Map<String, Object> result = new HashMap<>();
        result.put("buildingId", building.getBuildingID());
        result.put("buildingName", building.getBuildingName());
        result.put("location", building.getLocation());
        result.put("totalRooms", rooms.size());
        result.put("totalBeds", totalBeds);
        result.put("occupiedBeds", occupiedBeds);
        result.put("overallOccupancyRate", totalBeds > 0 ? Math.round((double) occupiedBeds / totalBeds * 100) : 0);
        result.put("rooms", roomDataList);
        
        return ResponseEntity.ok(result);
    }

    /**
     * Get summary statistics for all buildings
     */
    @GetMapping("/summary")
    @RequiresRole({"Admin", "DormManager"})
    public ResponseEntity<List<Map<String, Object>>> getBuildingSummary() {
        List<DormBuilding> buildings = buildingRepository.findAll();
        List<Room> allRooms = roomRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (DormBuilding building : buildings) {
            Integer buildingId = building.getBuildingID();
            List<Room> rooms = allRooms.stream()
                .filter(r -> buildingId.equals(r.getBuildingID()))
                .collect(Collectors.toList());
            
            int totalBeds = 0;
            int occupiedBeds = 0;
            int emptyRooms = 0;
            int fullRooms = 0;
            
            for (Room room : rooms) {
                int capacity = room.getCapacity() != null ? room.getCapacity() : 0;
                int occupied = room.getCurrentOccupancy() != null ? room.getCurrentOccupancy() : 0;
                totalBeds += capacity;
                occupiedBeds += occupied;
                if (occupied == 0) {
                    emptyRooms++;
                } else if (occupied >= capacity && capacity > 0) {
                    fullRooms++;
                }
            }
            
            Map<String, Object> buildingData = new HashMap<>();
            buildingData.put("id", building.getBuildingID());
            buildingData.put("name", building.getBuildingName());
            buildingData.put("totalRooms", rooms.size());
            buildingData.put("totalBeds", totalBeds);
            buildingData.put("occupiedBeds", occupiedBeds);
            buildingData.put("availableBeds", totalBeds - occupiedBeds);
            buildingData.put("emptyRooms", emptyRooms);
            buildingData.put("fullRooms", fullRooms);
            buildingData.put("occupancyRate", totalBeds > 0 ? Math.round((double) occupiedBeds / totalBeds * 100) : 0);
            
            result.add(buildingData);
        }
        
        return ResponseEntity.ok(result);
    }
}
