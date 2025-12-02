package com.dormitory.controller;

import com.dormitory.dto.LoginRequest;
import com.dormitory.dto.LoginResponse;
import com.dormitory.dto.ChangePasswordRequest;
import com.dormitory.dto.ResetPasswordRequest;
import com.dormitory.entity.UserAccount;
import com.dormitory.entity.Student;
import com.dormitory.repository.StudentRepository;
import com.dormitory.repository.UserAccountRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private com.dormitory.service.CaptchaService captchaService;

    @Value("${app.auth.secret:change-me}")
    private String authSecret;

    @GetMapping("/users")
    public List<UserAccount> getAllUsers() {
        return userAccountRepository.findAll();
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@CookieValue(name = "auth", required = false) String authToken) {
        if (authToken == null || authToken.isEmpty()) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        
        try {
            // Verify and decode token
            String[] parts = authToken.split("\\.");
            if (parts.length != 2) {
                return ResponseEntity.status(401).body("Invalid token format");
            }
            
            String payloadB64 = parts[0];
            String sigB64 = parts[1];
            
            // Verify signature
            byte[] expectedSig = hmacSha256(payloadB64.getBytes(java.nio.charset.StandardCharsets.UTF_8), 
                                           authSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            String expectedSigB64 = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(expectedSig);
            
            if (!sigB64.equals(expectedSigB64)) {
                return ResponseEntity.status(401).body("Invalid token signature");
            }
            
            // Decode payload
            byte[] payloadBytes = java.util.Base64.getUrlDecoder().decode(payloadB64);
            String payload = new String(payloadBytes, java.nio.charset.StandardCharsets.UTF_8);
            
            // Parse JSON manually (simple approach)
            String username = extractJsonValue(payload, "username");
            String role = extractJsonValue(payload, "role");
            String expStr = extractJsonValue(payload, "exp");
            
            // Check expiration
            long exp = Long.parseLong(expStr);
            if (System.currentTimeMillis() / 1000L > exp) {
                return ResponseEntity.status(401).body("Token expired");
            }
            
            // Get user from database
            UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
            if (user == null) {
                return ResponseEntity.status(401).body("User not found");
            }
            
            return ResponseEntity.ok(new LoginResponse(
                user.getUserID(),
                user.getUsername(),
                user.getRole(),
                user.getRelatedStudentID()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid token");
        }
    }
    
    private String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\":";
        int keyIndex = json.indexOf(searchKey);
        if (keyIndex == -1) return null;
        
        int valueStart = keyIndex + searchKey.length();
        if (json.charAt(valueStart) == '"') {
            // String value
            valueStart++;
            int valueEnd = json.indexOf('"', valueStart);
            return json.substring(valueStart, valueEnd);
        } else {
            // Number or other value
            int valueEnd = valueStart;
            while (valueEnd < json.length() && 
                   (Character.isDigit(json.charAt(valueEnd)) || json.charAt(valueEnd) == '-')) {
                valueEnd++;
            }
            return json.substring(valueStart, valueEnd);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Validate Captcha
        if (!captchaService.validateCaptcha(request.getCaptchaId(), request.getCaptchaText())) {
            return ResponseEntity.badRequest().body("Invalid or expired captcha");
        }

        UserAccount user = userAccountRepository.findByUsername(request.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("Invalid username or password");
        }

        if (!verifyPassword(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest().body("Invalid username or password");
        }

        LoginResponse resp = new LoginResponse(
            user.getUserID(),
            user.getUsername(),
            user.getRole(),
            user.getRelatedStudentID()
        );

        // Build signed token and set HttpOnly cookie
        String token = buildSignedToken(resp.getUsername(), resp.getRole(), 24 * 60 * 60);
        String tokenValue = (token == null ? "" : token);
        ResponseCookie cookie = ResponseCookie.from("auth", tokenValue)
            .httpOnly(true)
            .sameSite("Lax")
            .path("/")
            .maxAge(24 * 60 * 60)
            .build();

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(resp);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserAccount user) {
        if (userAccountRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        user.setPasswordHash(hashPassword(user.getPasswordHash())); // Assume frontend sends raw password in this field for register
        userAccountRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        UserAccount user = userAccountRepository.findByUsername(request.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        if (!verifyPassword(request.getOldPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest().body("Invalid old password");
        }

        user.setPasswordHash(hashPassword(request.getNewPassword()));
        userAccountRepository.save(user);
        return ResponseEntity.ok("Password changed successfully");
    }

    @PostMapping("/admin/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        UserAccount user = userAccountRepository.findByUsername(request.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }
        user.setPasswordHash(hashPassword(request.getNewPassword()));
        userAccountRepository.save(user);
        return ResponseEntity.ok("Password reset successfully");
    }

    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }

    private boolean verifyPassword(String rawPassword, String hashedPassword) {
        return hashPassword(rawPassword).equals(hashedPassword);
    }

    private String buildSignedToken(String username, String role, int maxAgeSeconds) {
        long now = System.currentTimeMillis() / 1000L;
        long exp = now + maxAgeSeconds;
        String payload = String.format("{\"username\":\"%s\",\"role\":\"%s\",\"exp\":%d}",
                username.replace("\"", "\""), role.replace("\"", "\""), exp);
        byte[] payloadBytes = payload.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        String payloadB64 = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(payloadBytes);
        byte[] sig = hmacSha256(payloadB64.getBytes(java.nio.charset.StandardCharsets.UTF_8), authSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        String sigB64 = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
        return payloadB64 + "." + sigB64;
    }

    private byte[] hmacSha256(byte[] data, byte[] key) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKeySpec = new javax.crypto.spec.SecretKeySpec(key, "HmacSHA256");
            mac.init(secretKeySpec);
            return mac.doFinal(data);
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign token", e);
        }
    }

    @PostConstruct
    public void initUsers() {
        // Create Admin
        if (userAccountRepository.findByUsername("admin").isEmpty()) {
            UserAccount admin = new UserAccount();
            admin.setUsername("admin");
            admin.setPasswordHash(hashPassword("admin123"));
            admin.setRole("Admin");
            userAccountRepository.save(admin);
        }

        // Create Manager
        if (userAccountRepository.findByUsername("manager").isEmpty()) {
            UserAccount manager = new UserAccount();
            manager.setUsername("manager");
            manager.setPasswordHash(hashPassword("manager123"));
            manager.setRole("DormManager");
            userAccountRepository.save(manager);
        }

        // Create Student
        String studentId = "20250001";
        if (userAccountRepository.findByUsername(studentId).isEmpty()) {
            // Create Student Entity if not exists
            if (!studentRepository.existsById(studentId)) {
                Student s = new Student();
                s.setStudentID(studentId);
                s.setName("John Doe");
                s.setGender("Male");
                s.setMajor("Computer Science");
                s.setStudentClass("CS-2025");
                s.setPhone("1234567890");
                s.setEnrollmentYear(2025);
                studentRepository.save(s);
            }

            UserAccount student = new UserAccount();
            student.setUsername(studentId); // Use Student ID as username
            student.setPasswordHash(hashPassword("student123"));
            student.setRole("Student");
            student.setRelatedStudentID(studentId);
            userAccountRepository.save(student);
            
            System.out.println("Created student user: " + studentId);
        }
    }
}
