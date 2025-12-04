package com.dormitory.controller;

import com.dormitory.dto.RoomApplicationRequest;
import com.dormitory.dto.StudentProfileRequest;
import com.dormitory.entity.*;
import com.dormitory.repository.*;
import com.dormitory.service.AuditService;
import com.dormitory.service.EmailService;
import com.dormitory.service.RoomBookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for student self-service operations:
 * - Create/update own profile
 * - View available rooms
 * - Apply for room/bed
 */
@RestController
@RequestMapping("/api/student-portal")
public class StudentPortalController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private DormBuildingRepository buildingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private CheckInOutRepository checkInOutRepository;

    @Autowired
    private RoomApplicationRepository roomApplicationRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private RoomBookingService roomBookingService;

    @Value("${app.auth.secret:change-me}")
    private String authSecret;

    /**
     * Get summary of all dormitory buildings (for homepage/visitors)
     */
    @GetMapping("/buildings/summary")
    public ResponseEntity<List<com.dormitory.dto.BuildingSummaryDTO>> getBuildingSummaries() {
        List<DormBuilding> buildings = buildingRepository.findAll();
        List<Room> rooms = roomRepository.findAll();
        List<Bed> beds = bedRepository.findAll();

        List<com.dormitory.dto.BuildingSummaryDTO> summaries = buildings.stream().map(building -> {
            com.dormitory.dto.BuildingSummaryDTO dto = new com.dormitory.dto.BuildingSummaryDTO();
            dto.setBuildingID(building.getBuildingID());
            dto.setBuildingName(building.getBuildingName());
            dto.setLocation(building.getLocation());

            // Calculate stats
            List<Room> buildingRooms = rooms.stream()
                    .filter(r -> r.getBuildingID().equals(building.getBuildingID()))
                    .collect(Collectors.toList());
            
            int totalCapacity = buildingRooms.stream()
                    .mapToInt(r -> r.getCapacity() != null ? r.getCapacity() : 0)
                    .sum();
            
            // Calculate available beds
            // A bed is available if its status is "Available"
            long availableBeds = beds.stream()
                    .filter(b -> {
                        // Check if bed belongs to a room in this building
                        boolean inBuilding = buildingRooms.stream()
                                .anyMatch(r -> r.getRoomID().equals(b.getRoomID()));
                        return inBuilding && "Available".equalsIgnoreCase(b.getStatus());
                    })
                    .count();

            dto.setTotalCapacity(totalCapacity);
            dto.setAvailableBeds((int) availableBeds);

            // Mock description and image based on building name
            String name = building.getBuildingName();
            if (name.contains("一号楼") || name.contains("1")) {
                dto.setDescription("一号楼位于校园中心，毗邻图书馆，环境安静，适合潜心学习。配备四人间，拥有独立卫浴和空调。");
                dto.setImageUrl("https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80");
            } else if (name.contains("二号楼") || name.contains("2")) {
                dto.setDescription("二号楼靠近运动场，视野开阔，采光充足。楼内设有公共洗衣房和自动售货机，生活便利。");
                dto.setImageUrl("https://images.unsplash.com/photo-1596276020587-8044fe049813?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80");
            } else if (name.contains("三号楼") || name.contains("3")) {
                dto.setDescription("三号楼为新建宿舍楼，设施一流，配备电梯和智能门禁系统。每层设有宽敞的公共活动区域。");
                dto.setImageUrl("https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80");
            } else if (name.contains("四号楼") || name.contains("4")) {
                dto.setDescription("四号楼环境优美，绿树环绕。房间宽敞明亮，配套设施完善，是理想的居住选择。");
                dto.setImageUrl("https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80");
            } else if (name.contains("五号楼") || name.contains("5")) {
                dto.setDescription("五号楼位于生活区核心位置，距离食堂和超市仅一步之遥。居住氛围浓厚，社区活动丰富。");
                dto.setImageUrl("https://images.unsplash.com/photo-1522771753037-63338189a855?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80");
            } else {
                dto.setDescription("标准学生公寓，提供舒适安全的居住环境，配备基础生活设施，满足日常需求。");
                dto.setImageUrl("https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80");
            }

            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(summaries);
    }

    /**
     * Create or update student profile (for the currently logged-in user)
     */
    @PostMapping("/profile")
    public ResponseEntity<?> createOrUpdateProfile(
            @CookieValue(name = "auth", required = false) String authToken,
            @RequestBody StudentProfileRequest request) {
        
        // Get current user from token
        String username = getUsernameFromToken(authToken);
        if (username == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        // Find user account
        UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        // Validate required fields
        if (request.getStudentID() == null || request.getStudentID().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Student ID is required");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Name is required");
        }

        // Check if this student ID already exists and belongs to someone else
        Student existing = studentRepository.findById(request.getStudentID()).orElse(null);
        if (existing != null && user.getRelatedStudentID() != null 
                && !user.getRelatedStudentID().equals(request.getStudentID())) {
            return ResponseEntity.badRequest().body("This Student ID is already taken");
        }

        // Check if another user already has this student ID linked
        if (existing != null) {
            UserAccount otherUser = userAccountRepository.findAll().stream()
                    .filter(u -> request.getStudentID().equals(u.getRelatedStudentID()) && !u.getUsername().equals(username))
                    .findFirst().orElse(null);
            if (otherUser != null) {
                return ResponseEntity.badRequest().body("This Student ID is already linked to another account");
            }
        }

        // Create or update student profile
        Student student = existing != null ? existing : new Student();
        student.setStudentID(request.getStudentID());
        student.setName(request.getName());
        student.setGender(request.getGender());
        student.setMajor(request.getMajor());
        student.setStudentClass(request.getStudentClass());
        student.setEnrollmentYear(request.getEnrollmentYear());
        student.setPhone(request.getPhone());
        student.setEmail(request.getEmail());
        
        studentRepository.save(student);

        // Link student to user account
        user.setRelatedStudentID(request.getStudentID());
        userAccountRepository.save(user);

        auditService.logCreate("Student", student.getStudentID(), 
            "Student created/updated profile: " + student.getName(), username);

        return ResponseEntity.ok(student);
    }

    /**
     * Get current student's profile
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile(@CookieValue(name = "auth", required = false) String authToken) {
        String username = getUsernameFromToken(authToken);
        if (username == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
        if (user == null || user.getRelatedStudentID() == null) {
            return ResponseEntity.ok(null); // No profile yet
        }

        Student student = studentRepository.findById(user.getRelatedStudentID()).orElse(null);
        return ResponseEntity.ok(student);
    }

    /**
     * Get all available rooms with all beds (showing status for each bed)
     * Available beds can be selected, Occupied/Reserved beds are shown as unavailable
     */
    @GetMapping("/available-rooms")
    public ResponseEntity<?> getAvailableRooms() {
        List<DormBuilding> buildings = buildingRepository.findAll();
        List<Room> rooms = roomRepository.findAll();
        List<Bed> beds = bedRepository.findAll();

        // Build response with building -> rooms -> all beds with status
        List<Map<String, Object>> result = buildings.stream().map(building -> {
            Map<String, Object> bldg = new HashMap<>();
            bldg.put("buildingID", building.getBuildingID());
            bldg.put("buildingName", building.getBuildingName());
            bldg.put("location", building.getLocation());

            List<Map<String, Object>> roomList = rooms.stream()
                    .filter(r -> r.getBuildingID().equals(building.getBuildingID()))
                    .map(room -> {
                        Map<String, Object> rm = new HashMap<>();
                        rm.put("roomID", room.getRoomID());
                        rm.put("roomNumber", room.getRoomNumber());
                        rm.put("roomType", room.getRoomType());
                        rm.put("capacity", room.getCapacity());
                        rm.put("currentOccupancy", room.getCurrentOccupancy());
                        rm.put("availableSpots", room.getCapacity() - room.getCurrentOccupancy());

                        // Get ALL beds for this room with their status
                        List<Map<String, Object>> allBeds = beds.stream()
                                .filter(b -> b.getRoomID().equals(room.getRoomID()))
                                .map(bed -> {
                                    Map<String, Object> bd = new HashMap<>();
                                    bd.put("bedID", bed.getBedID());
                                    bd.put("bedNumber", bed.getBedNumber());
                                    bd.put("status", bed.getStatus()); // Available, Occupied, Reserved
                                    bd.put("isAvailable", "Available".equalsIgnoreCase(bed.getStatus()));
                                    return bd;
                                }).collect(Collectors.toList());

                        // Also provide availableBeds for backward compatibility
                        List<Map<String, Object>> availableBeds = allBeds.stream()
                                .filter(b -> Boolean.TRUE.equals(b.get("isAvailable")))
                                .collect(Collectors.toList());

                        rm.put("allBeds", allBeds);
                        rm.put("availableBeds", availableBeds);
                        return rm;
                    })
                    .filter(rm -> !((List<?>) rm.get("allBeds")).isEmpty()) // Only rooms with beds
                    .collect(Collectors.toList());

            bldg.put("rooms", roomList);
            return bldg;
        }).filter(b -> !((List<?>) b.get("rooms")).isEmpty()) // Only buildings with rooms
          .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Apply for a room/bed (creates application for manager approval)
     * Uses RoomBookingService for thread-safe concurrent booking prevention
     */
    @PostMapping("/apply-room")
    public ResponseEntity<?> applyForRoom(
            @CookieValue(name = "auth", required = false) String authToken,
            @RequestBody RoomApplicationRequest request) {

        String username = getUsernameFromToken(authToken);
        if (username == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        // Check if student has profile
        if (user.getRelatedStudentID() == null) {
            return ResponseEntity.badRequest().body("Please create your profile first");
        }

        Student student = studentRepository.findById(user.getRelatedStudentID()).orElse(null);
        if (student == null) {
            return ResponseEntity.badRequest().body("Student profile not found");
        }

        // Check if already has a room
        if (student.getDormBuilding() != null && student.getRoomNumber() != null) {
            return ResponseEntity.badRequest().body("You already have a room assigned. Please check out first.");
        }

        // Check if there's an existing active check-in
        CheckInOut existing = checkInOutRepository.findByStudentIDAndStatus(student.getStudentID(), "CurrentlyLiving");
        if (existing != null) {
            return ResponseEntity.badRequest().body("You are already checked in");
        }

        // Use the booking service for thread-safe bed reservation
        // This prevents two students from applying for the same bed simultaneously
        RoomBookingService.BookingResult result = roomBookingService.reserveBedForApplication(
            student.getStudentID(), 
            request.getBedID()
        );

        if (!result.isSuccess()) {
            // Map error codes to user-friendly messages
            if ("BED_NOT_FOUND".equals(result.getErrorCode())) {
                return ResponseEntity.badRequest().body("Bed not found");
            }
            if ("BED_NOT_AVAILABLE".equals(result.getErrorCode())) {
                return ResponseEntity.status(409).body(Map.of(
                    "error", result.getMessage(),
                    "code", "BED_NOT_AVAILABLE"
                ));
            }
            if ("EXISTING_APPLICATION".equals(result.getErrorCode())) {
                return ResponseEntity.badRequest().body("You already have a pending room application. Please wait for manager approval.");
            }
            if ("CONCURRENT_MODIFICATION".equals(result.getErrorCode())) {
                return ResponseEntity.status(409).body(Map.of(
                    "error", "This bed was just taken by another student. Please select a different bed.",
                    "code", "CONCURRENT_BOOKING"
                ));
            }
            return ResponseEntity.status(500).body(result.getMessage());
        }

        // Get room and building info for response
        Bed bed = bedRepository.findById(request.getBedID()).orElse(null);
        Room room = roomRepository.findById(bed.getRoomID()).orElse(null);
        DormBuilding building = buildingRepository.findById(room.getBuildingID()).orElse(null);

        // Audit log
        auditService.log("ROOM_APPLICATION", "STUDENT", student.getStudentID(),
                String.format("Room application submitted for %s Room %s Bed %s", 
                        building.getBuildingName(), room.getRoomNumber(), bed.getBedNumber()),
                username);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Room application submitted! Please wait for manager approval.");
        response.put("building", building.getBuildingName());
        response.put("room", room.getRoomNumber());
        response.put("bed", bed.getBedNumber());
        response.put("status", "Pending");

        return ResponseEntity.ok(response);
    }

    /**
     * Get student's room applications
     */
    @GetMapping("/my-applications")
    public ResponseEntity<?> getMyApplications(
            @CookieValue(name = "auth", required = false) String authToken) {

        String username = getUsernameFromToken(authToken);
        if (username == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        if (user.getRelatedStudentID() == null) {
            return ResponseEntity.ok(List.of());
        }

        List<RoomApplication> applications = roomApplicationRepository.findByStudentID(user.getRelatedStudentID());

        // Enrich with room/building info
        List<Map<String, Object>> result = new ArrayList<>();
        for (RoomApplication app : applications) {
            Map<String, Object> appInfo = new HashMap<>();
            appInfo.put("applicationID", app.getApplicationID());
            appInfo.put("status", app.getStatus());
            appInfo.put("applyTime", app.getApplyTime());
            appInfo.put("processTime", app.getProcessTime());
            appInfo.put("processedBy", app.getProcessedBy());
            appInfo.put("rejectReason", app.getRejectReason());

            Bed bed = bedRepository.findById(app.getBedID()).orElse(null);
            if (bed != null) {
                appInfo.put("bedNumber", bed.getBedNumber());
                Room room = roomRepository.findById(bed.getRoomID()).orElse(null);
                if (room != null) {
                    appInfo.put("roomNumber", room.getRoomNumber());
                    DormBuilding building = buildingRepository.findById(room.getBuildingID()).orElse(null);
                    if (building != null) {
                        appInfo.put("buildingName", building.getBuildingName());
                    }
                }
            }
            result.add(appInfo);
        }

        return ResponseEntity.ok(result);
    }

    // Helper method to extract username from token
    private String getUsernameFromToken(String token) {
        if (token == null || token.isEmpty()) {
            return null;
        }
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 2) return null;

            String payloadB64 = parts[0];
            byte[] payloadBytes = java.util.Base64.getUrlDecoder().decode(payloadB64);
            String payload = new String(payloadBytes, java.nio.charset.StandardCharsets.UTF_8);

            // Simple JSON parsing
            int usernameStart = payload.indexOf("\"username\":\"") + 12;
            int usernameEnd = payload.indexOf("\"", usernameStart);
            return payload.substring(usernameStart, usernameEnd);
        } catch (Exception e) {
            return null;
        }
    }
}
