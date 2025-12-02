package com.dormitory.controller;

import com.dormitory.entity.*;
import com.dormitory.repository.*;
import com.dormitory.service.AuditService;
import com.dormitory.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Controller for manager/admin to handle room applications
 */
@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class RoomApplicationController {

    @Value("${app.auth.secret:change-me}")
    private String jwtSecret;

    @Autowired
    private RoomApplicationRepository roomApplicationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private DormBuildingRepository buildingRepository;

    @Autowired
    private CheckInOutRepository checkInOutRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AuditService auditService;

    /**
     * Get all room applications (for managers/admins)
     */
    @GetMapping
    public ResponseEntity<?> getAllApplications(
            @CookieValue(name = "auth", required = false) String authToken,
            @RequestParam(required = false) String status) {

        String username = getUsernameFromToken(authToken);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        // Check if user is manager or admin
        UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
        if (user == null || (!"DormManager".equals(user.getRole()) && !"Admin".equals(user.getRole()))) {
            return ResponseEntity.status(403).body(Map.of("error", "Only managers and admins can view applications"));
        }

        List<RoomApplication> applications;
        if (status != null && !status.isEmpty()) {
            applications = roomApplicationRepository.findByStatus(status);
        } else {
            applications = roomApplicationRepository.findAll();
        }

        // Enrich with student and room info
        List<Map<String, Object>> result = new ArrayList<>();
        for (RoomApplication app : applications) {
            Map<String, Object> appInfo = new HashMap<>();
            appInfo.put("applicationID", app.getApplicationID());
            appInfo.put("studentID", app.getStudentID());
            appInfo.put("status", app.getStatus());
            appInfo.put("applyTime", app.getApplyTime());
            appInfo.put("processTime", app.getProcessTime());
            appInfo.put("processedBy", app.getProcessedBy());
            appInfo.put("rejectReason", app.getRejectReason());

            // Get student info
            Student student = studentRepository.findById(app.getStudentID()).orElse(null);
            if (student != null) {
                appInfo.put("studentName", student.getName());
                appInfo.put("major", student.getMajor());
                appInfo.put("gender", student.getGender());
            }

            // Get bed/room/building info
            Bed bed = bedRepository.findById(app.getBedID()).orElse(null);
            if (bed != null) {
                appInfo.put("bedID", bed.getBedID());
                appInfo.put("bedNumber", bed.getBedNumber());
                appInfo.put("bedStatus", bed.getStatus());
                Room room = roomRepository.findById(bed.getRoomID()).orElse(null);
                if (room != null) {
                    appInfo.put("roomNumber", room.getRoomNumber());
                    appInfo.put("roomType", room.getRoomType());
                    DormBuilding building = buildingRepository.findById(room.getBuildingID()).orElse(null);
                    if (building != null) {
                        appInfo.put("buildingName", building.getBuildingName());
                    }
                }
            }

            result.add(appInfo);
        }

        // Sort by apply time desc (most recent first)
        result.sort((a, b) -> {
            LocalDateTime timeA = (LocalDateTime) a.get("applyTime");
            LocalDateTime timeB = (LocalDateTime) b.get("applyTime");
            if (timeA == null) return 1;
            if (timeB == null) return -1;
            return timeB.compareTo(timeA);
        });

        return ResponseEntity.ok(result);
    }

    /**
     * Approve a room application
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveApplication(
            @CookieValue(name = "auth", required = false) String authToken,
            @PathVariable Integer id) {

        String username = getUsernameFromToken(authToken);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
        if (user == null || (!"DormManager".equals(user.getRole()) && !"Admin".equals(user.getRole()))) {
            return ResponseEntity.status(403).body(Map.of("error", "Only managers and admins can approve applications"));
        }

        RoomApplication application = roomApplicationRepository.findById(id).orElse(null);
        if (application == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Application not found"));
        }

        if (!"Pending".equals(application.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This application has already been processed"));
        }

        // Validate bed is still available
        Bed bed = bedRepository.findById(application.getBedID()).orElse(null);
        if (bed == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bed not found"));
        }
        if (!"Available".equalsIgnoreCase(bed.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This bed is no longer available. Please reject this application."));
        }

        // Get room and building
        Room room = roomRepository.findById(bed.getRoomID()).orElse(null);
        if (room == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Room not found"));
        }
        DormBuilding building = buildingRepository.findById(room.getBuildingID()).orElse(null);
        if (building == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Building not found"));
        }

        // Get student
        Student student = studentRepository.findById(application.getStudentID()).orElse(null);
        if (student == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student not found"));
        }

        // Perform check-in
        bed.setStatus("Occupied");
        bedRepository.save(bed);

        room.setCurrentOccupancy(room.getCurrentOccupancy() + 1);
        roomRepository.save(room);

        student.setDormBuilding(building.getBuildingName());
        student.setRoomNumber(room.getRoomNumber());
        student.setBedNumber(bed.getBedNumber());
        studentRepository.save(student);

        CheckInOut checkInOut = new CheckInOut();
        checkInOut.setStudentID(student.getStudentID());
        checkInOut.setBedID(bed.getBedID());
        checkInOut.setCheckInDate(LocalDate.now());
        checkInOut.setStatus("CurrentlyLiving");
        checkInOutRepository.save(checkInOut);

        // Update application
        application.setStatus("Approved");
        application.setProcessTime(LocalDateTime.now());
        application.setProcessedBy(username);
        roomApplicationRepository.save(application);

        // Send email notification
        emailService.sendCheckInNotification(student, building.getBuildingName(), room.getRoomNumber(), bed.getBedNumber());

        // Audit log
        auditService.log("APPROVE_APPLICATION", "ROOM_APPLICATION", id.toString(),
                String.format("Approved room application for student %s (%s) - %s Room %s Bed %s",
                        student.getStudentID(), student.getName(),
                        building.getBuildingName(), room.getRoomNumber(), bed.getBedNumber()),
                username);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Application approved! Student has been checked in.");
        response.put("studentID", student.getStudentID());
        response.put("building", building.getBuildingName());
        response.put("room", room.getRoomNumber());
        response.put("bed", bed.getBedNumber());

        return ResponseEntity.ok(response);
    }

    /**
     * Reject a room application
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectApplication(
            @CookieValue(name = "auth", required = false) String authToken,
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body) {

        String username = getUsernameFromToken(authToken);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
        if (user == null || (!"DormManager".equals(user.getRole()) && !"Admin".equals(user.getRole()))) {
            return ResponseEntity.status(403).body(Map.of("error", "Only managers and admins can reject applications"));
        }

        RoomApplication application = roomApplicationRepository.findById(id).orElse(null);
        if (application == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Application not found"));
        }

        if (!"Pending".equals(application.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This application has already been processed"));
        }

        String reason = body != null ? body.get("reason") : null;

        // Update application
        application.setStatus("Rejected");
        application.setProcessTime(LocalDateTime.now());
        application.setProcessedBy(username);
        application.setRejectReason(reason != null ? reason : "Application rejected by manager");
        roomApplicationRepository.save(application);

        // Get student info for logging
        Student student = studentRepository.findById(application.getStudentID()).orElse(null);

        // Audit log
        auditService.log("REJECT_APPLICATION", "ROOM_APPLICATION", id.toString(),
                String.format("Rejected room application for student %s - Reason: %s",
                        application.getStudentID(),
                        reason != null ? reason : "No reason provided"),
                username);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Application rejected");
        response.put("applicationID", id);
        response.put("reason", application.getRejectReason());

        return ResponseEntity.ok(response);
    }

    /**
     * Get pending applications count (for dashboard)
     */
    @GetMapping("/pending-count")
    public ResponseEntity<?> getPendingCount(
            @CookieValue(name = "auth", required = false) String authToken) {

        String username = getUsernameFromToken(authToken);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
        if (user == null || (!"DormManager".equals(user.getRole()) && !"Admin".equals(user.getRole()))) {
            return ResponseEntity.status(403).body(Map.of("error", "Only managers and admins can view pending count"));
        }

        List<RoomApplication> pending = roomApplicationRepository.findByStatus("Pending");
        return ResponseEntity.ok(Map.of("count", pending.size()));
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
            String signatureB64 = parts[1];

            // Verify signature
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(keySpec);
            byte[] expectedSig = hmac.doFinal(payloadB64.getBytes(StandardCharsets.UTF_8));
            String expectedSigB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(expectedSig);
            if (!expectedSigB64.equals(signatureB64)) {
                return null;
            }

            byte[] payloadBytes = Base64.getUrlDecoder().decode(payloadB64);
            String payload = new String(payloadBytes, StandardCharsets.UTF_8);

            // Simple JSON parsing
            int usernameStart = payload.indexOf("\"username\":\"") + 12;
            int usernameEnd = payload.indexOf("\"", usernameStart);
            return payload.substring(usernameStart, usernameEnd);
        } catch (Exception e) {
            return null;
        }
    }
}
