package com.dormitory.controller;

import com.dormitory.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DormBuildingRepository buildingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private RepairRequestRepository repairRepository;

    @Autowired
    private CheckInOutRepository checkInOutRepository;

    /**
     * Dashboard summary stats
     */
    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalStudents = studentRepository.count();
        long totalBuildings = buildingRepository.count();
        long totalRooms = roomRepository.count();
        long totalBeds = bedRepository.count();
        
        long occupiedBeds = bedRepository.findAll().stream()
                .filter(b -> "Occupied".equalsIgnoreCase(b.getStatus()))
                .count();
        long availableBeds = totalBeds - occupiedBeds;
        
        long pendingRepairs = repairRepository.findAll().stream()
                .filter(r -> "Pending".equalsIgnoreCase(r.getStatus()))
                .count();
        long inProgressRepairs = repairRepository.findAll().stream()
                .filter(r -> "InProgress".equalsIgnoreCase(r.getStatus()))
                .count();
        
        stats.put("totalStudents", totalStudents);
        stats.put("totalBuildings", totalBuildings);
        stats.put("totalRooms", totalRooms);
        stats.put("totalBeds", totalBeds);
        stats.put("occupiedBeds", occupiedBeds);
        stats.put("availableBeds", availableBeds);
        stats.put("occupancyRate", totalBeds > 0 ? Math.round(occupiedBeds * 100.0 / totalBeds) : 0);
        stats.put("pendingRepairs", pendingRepairs);
        stats.put("inProgressRepairs", inProgressRepairs);
        
        return stats;
    }

    /**
     * Occupancy by building (for bar chart)
     */
    @GetMapping("/occupancy-by-building")
    public List<Map<String, Object>> getOccupancyByBuilding() {
        List<Map<String, Object>> data = new ArrayList<>();
        
        buildingRepository.findAll().forEach(building -> {
            Map<String, Object> item = new HashMap<>();
            item.put("name", building.getBuildingName());
            
            // Get all rooms in this building
            var rooms = roomRepository.findAll().stream()
                    .filter(r -> r.getBuildingID().equals(building.getBuildingID()))
                    .toList();
            
            int totalCapacity = rooms.stream().mapToInt(r -> r.getCapacity() != null ? r.getCapacity() : 0).sum();
            int currentOccupancy = rooms.stream().mapToInt(r -> r.getCurrentOccupancy() != null ? r.getCurrentOccupancy() : 0).sum();
            
            item.put("capacity", totalCapacity);
            item.put("occupied", currentOccupancy);
            item.put("available", totalCapacity - currentOccupancy);
            item.put("rate", totalCapacity > 0 ? Math.round(currentOccupancy * 100.0 / totalCapacity) : 0);
            
            data.add(item);
        });
        
        return data;
    }

    /**
     * Repair requests by status (for pie chart)
     */
    @GetMapping("/repairs-by-status")
    public List<Map<String, Object>> getRepairsByStatus() {
        List<Map<String, Object>> data = new ArrayList<>();
        
        Map<String, Long> statusCounts = new HashMap<>();
        repairRepository.findAll().forEach(r -> {
            String status = r.getStatus() != null ? r.getStatus() : "Unknown";
            statusCounts.merge(status, 1L, Long::sum);
        });
        
        statusCounts.forEach((status, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("status", status);
            item.put("count", count);
            data.add(item);
        });
        
        return data;
    }

    /**
     * Students by major (for pie/bar chart)
     */
    @GetMapping("/students-by-major")
    public List<Map<String, Object>> getStudentsByMajor() {
        List<Map<String, Object>> data = new ArrayList<>();
        
        Map<String, Long> majorCounts = new HashMap<>();
        studentRepository.findAll().forEach(s -> {
            String major = s.getMajor() != null ? s.getMajor() : "Unknown";
            majorCounts.merge(major, 1L, Long::sum);
        });
        
        majorCounts.forEach((major, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("major", major);
            item.put("count", count);
            data.add(item);
        });
        
        // Sort by count descending
        data.sort((a, b) -> Long.compare((Long) b.get("count"), (Long) a.get("count")));
        
        return data;
    }

    /**
     * Students by enrollment year (for line/bar chart)
     */
    @GetMapping("/students-by-year")
    public List<Map<String, Object>> getStudentsByYear() {
        List<Map<String, Object>> data = new ArrayList<>();
        
        Map<Integer, Long> yearCounts = new TreeMap<>();
        studentRepository.findAll().forEach(s -> {
            Integer year = s.getEnrollmentYear() != null ? s.getEnrollmentYear() : 0;
            yearCounts.merge(year, 1L, Long::sum);
        });
        
        yearCounts.forEach((year, count) -> {
            if (year > 0) {
                Map<String, Object> item = new HashMap<>();
                item.put("year", year);
                item.put("count", count);
                data.add(item);
            }
        });
        
        return data;
    }

    /**
     * Recent check-ins/check-outs (for activity timeline)
     */
    @GetMapping("/recent-activity")
    public List<Map<String, Object>> getRecentActivity() {
        List<Map<String, Object>> data = new ArrayList<>();
        
        checkInOutRepository.findAll().stream()
                .sorted((a, b) -> {
                    var dateA = a.getCheckOutDate() != null ? a.getCheckOutDate() : a.getCheckInDate();
                    var dateB = b.getCheckOutDate() != null ? b.getCheckOutDate() : b.getCheckInDate();
                    if (dateA == null) return 1;
                    if (dateB == null) return -1;
                    return dateB.compareTo(dateA);
                })
                .limit(20)
                .forEach(record -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("studentID", record.getStudentID());
                    item.put("status", record.getStatus());
                    item.put("checkInDate", record.getCheckInDate());
                    item.put("checkOutDate", record.getCheckOutDate());
                    
                    // Get student name
                    studentRepository.findById(record.getStudentID()).ifPresent(s -> 
                        item.put("studentName", s.getName())
                    );
                    
                    data.add(item);
                });
        
        return data;
    }

    /**
     * Gender distribution (for pie chart)
     */
    @GetMapping("/gender-distribution")
    public List<Map<String, Object>> getGenderDistribution() {
        List<Map<String, Object>> data = new ArrayList<>();
        
        Map<String, Long> genderCounts = new HashMap<>();
        studentRepository.findAll().forEach(s -> {
            String gender = s.getGender() != null ? s.getGender() : "Unknown";
            genderCounts.merge(gender, 1L, Long::sum);
        });
        
        genderCounts.forEach((gender, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("gender", gender);
            item.put("count", count);
            data.add(item);
        });
        
        return data;
    }
}
