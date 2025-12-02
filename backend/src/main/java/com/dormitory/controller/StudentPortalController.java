package com.dormitory.controller;

import com.dormitory.dto.RoomApplicationRequest;
import com.dormitory.dto.StudentProfileRequest;
import com.dormitory.entity.*;
import com.dormitory.repository.*;
import com.dormitory.service.AuditService;
import com.dormitory.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
@CrossOrigin(origins = "*")
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

    @Value("${app.auth.secret:change-me}")
    private String authSecret;

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
     * Get all available rooms with available beds
     */
    @GetMapping("/available-rooms")
    public ResponseEntity<?> getAvailableRooms() {
        List<DormBuilding> buildings = buildingRepository.findAll();
        List<Room> rooms = roomRepository.findAll();
        List<Bed> beds = bedRepository.findAll();

        // Build response with building -> rooms -> available beds
        List<Map<String, Object>> result = buildings.stream().map(building -> {
            Map<String, Object> bldg = new HashMap<>();
            bldg.put("buildingID", building.getBuildingID());
            bldg.put("buildingName", building.getBuildingName());
            bldg.put("location", building.getLocation());

            List<Map<String, Object>> roomList = rooms.stream()
                    .filter(r -> r.getBuildingID().equals(building.getBuildingID()))
                    .filter(r -> r.getCurrentOccupancy() < r.getCapacity()) // Has space
                    .map(room -> {
                        Map<String, Object> rm = new HashMap<>();
                        rm.put("roomID", room.getRoomID());
                        rm.put("roomNumber", room.getRoomNumber());
                        rm.put("roomType", room.getRoomType());
                        rm.put("capacity", room.getCapacity());
                        rm.put("currentOccupancy", room.getCurrentOccupancy());
                        rm.put("availableSpots", room.getCapacity() - room.getCurrentOccupancy());

                        List<Map<String, Object>> availableBeds = beds.stream()
                                .filter(b -> b.getRoomID().equals(room.getRoomID()))
                                .filter(b -> "Available".equalsIgnoreCase(b.getStatus()))
                                .map(bed -> {
                                    Map<String, Object> bd = new HashMap<>();
                                    bd.put("bedID", bed.getBedID());
                                    bd.put("bedNumber", bed.getBedNumber());
                                    return bd;
                                }).collect(Collectors.toList());

                        rm.put("availableBeds", availableBeds);
                        return rm;
                    })
                    .filter(rm -> !((List<?>) rm.get("availableBeds")).isEmpty()) // Only rooms with available beds
                    .collect(Collectors.toList());

            bldg.put("rooms", roomList);
            return bldg;
        }).filter(b -> !((List<?>) b.get("rooms")).isEmpty()) // Only buildings with available rooms
          .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Apply for a room/bed (creates application for manager approval)
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

        // Check if student already has a pending application
        boolean hasPending = roomApplicationRepository.existsByStudentIDAndStatus(student.getStudentID(), "Pending");
        if (hasPending) {
            return ResponseEntity.badRequest().body("You already have a pending room application. Please wait for manager approval.");
        }

        // Validate bed
        Bed bed = bedRepository.findById(request.getBedID()).orElse(null);
        if (bed == null) {
            return ResponseEntity.badRequest().body("Bed not found");
        }
        if (!"Available".equalsIgnoreCase(bed.getStatus())) {
            return ResponseEntity.badRequest().body("This bed is no longer available");
        }

        // Get room and building for response
        Room room = roomRepository.findById(bed.getRoomID()).orElse(null);
        if (room == null) {
            return ResponseEntity.badRequest().body("Room not found");
        }
        DormBuilding building = buildingRepository.findById(room.getBuildingID()).orElse(null);
        if (building == null) {
            return ResponseEntity.badRequest().body("Building not found");
        }

        // Create room application (pending approval)
        RoomApplication application = new RoomApplication();
        application.setStudentID(student.getStudentID());
        application.setBedID(bed.getBedID());
        application.setStatus("Pending");
        application.setApplyTime(LocalDateTime.now());
        roomApplicationRepository.save(application);

        // Audit log
        auditService.log("ROOM_APPLICATION", "STUDENT", student.getStudentID(),
                String.format("Room application submitted for %s Room %s Bed %s", 
                        building.getBuildingName(), room.getRoomNumber(), bed.getBedNumber()),
                username);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Room application submitted! Please wait for manager approval.");
        response.put("applicationId", application.getApplicationID());
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
