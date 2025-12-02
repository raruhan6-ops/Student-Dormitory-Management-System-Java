package com.dormitory.controller;

import com.dormitory.dto.LoginRequest;
import com.dormitory.dto.LoginResponse;
import com.dormitory.entity.UserAccount;
import com.dormitory.repository.UserAccountRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        UserAccount user = userAccountRepository.findByUsername(request.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("Invalid username or password");
        }

        if (!verifyPassword(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest().body("Invalid username or password");
        }

        return ResponseEntity.ok(new LoginResponse(
                user.getUserID(),
                user.getUsername(),
                user.getRole(),
                user.getRelatedStudentID()
        ));
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

    @PostConstruct
    public void initUsers() {
        if (userAccountRepository.count() == 0) {
            // Create Admin
            UserAccount admin = new UserAccount();
            admin.setUsername("admin");
            admin.setPasswordHash(hashPassword("admin123"));
            admin.setRole("Admin");
            userAccountRepository.save(admin);

            // Create Manager
            UserAccount manager = new UserAccount();
            manager.setUsername("manager");
            manager.setPasswordHash(hashPassword("manager123"));
            manager.setRole("DormManager");
            userAccountRepository.save(manager);

            // Create Student
            UserAccount student = new UserAccount();
            student.setUsername("student");
            student.setPasswordHash(hashPassword("student123"));
            student.setRole("Student");
            student.setRelatedStudentID("20250001"); // Example ID
            userAccountRepository.save(student);
            
            System.out.println("Default users created: admin/admin123, manager/manager123, student/student123");
        }
    }
}
