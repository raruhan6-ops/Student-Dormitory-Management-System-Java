package com.dormitory.controller;

import com.dormitory.entity.Student;
import com.dormitory.repository.StudentRepository;
import com.dormitory.security.RequiresRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/batch")
@RequiresRole({"DormManager", "Admin"})  // Only managers/admins can perform batch operations
public class BatchController {

    @Autowired
    private StudentRepository studentRepository;

    /**
     * Export all students as CSV
     */
    @GetMapping("/students/export")
    public ResponseEntity<byte[]> exportStudents() {
        List<Student> students = studentRepository.findAll();
        
        StringBuilder csv = new StringBuilder();
        // CSV Header
        csv.append("StudentID,Name,Gender,Major,Class,EnrollmentYear,Phone,Email,DormBuilding,RoomNumber,BedNumber\n");
        
        // CSV Data
        for (Student s : students) {
            csv.append(escapeCsv(s.getStudentID())).append(",");
            csv.append(escapeCsv(s.getName())).append(",");
            csv.append(escapeCsv(s.getGender())).append(",");
            csv.append(escapeCsv(s.getMajor())).append(",");
            csv.append(escapeCsv(s.getStudentClass())).append(",");
            csv.append(s.getEnrollmentYear() != null ? s.getEnrollmentYear() : "").append(",");
            csv.append(escapeCsv(s.getPhone())).append(",");
            csv.append(escapeCsv(s.getEmail())).append(",");
            csv.append(escapeCsv(s.getDormBuilding())).append(",");
            csv.append(escapeCsv(s.getRoomNumber())).append(",");
            csv.append(escapeCsv(s.getBedNumber())).append("\n");
        }
        
        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "students_export.csv");
        headers.setContentLength(bytes.length);
        
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    /**
     * Import students from CSV
     * Expected format: StudentID,Name,Gender,Major,Class,EnrollmentYear,Phone,Email
     */
    @PostMapping("/students/import")
    public ResponseEntity<?> importStudents(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));
        }

        List<String> errors = new ArrayList<>();
        List<Student> imported = new ArrayList<>();
        int lineNumber = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean isHeader = true;
            
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                
                // Skip header
                if (isHeader) {
                    isHeader = false;
                    continue;
                }
                
                // Skip empty lines
                if (line.trim().isEmpty()) continue;
                
                try {
                    String[] parts = parseCsvLine(line);
                    if (parts.length < 7) {
                        errors.add("Line " + lineNumber + ": Not enough columns (expected at least 7)");
                        continue;
                    }
                    
                    String studentId = parts[0].trim();
                    if (studentId.isEmpty()) {
                        errors.add("Line " + lineNumber + ": StudentID is required");
                        continue;
                    }
                    
                    // Check if student exists
                    Student student = studentRepository.findById(studentId).orElse(new Student());
                    student.setStudentID(studentId);
                    student.setName(parts.length > 1 ? parts[1].trim() : null);
                    student.setGender(parts.length > 2 ? parts[2].trim() : null);
                    student.setMajor(parts.length > 3 ? parts[3].trim() : null);
                    student.setStudentClass(parts.length > 4 ? parts[4].trim() : null);
                    
                    if (parts.length > 5 && !parts[5].trim().isEmpty()) {
                        try {
                            student.setEnrollmentYear(Integer.parseInt(parts[5].trim()));
                        } catch (NumberFormatException e) {
                            // Ignore invalid year
                        }
                    }
                    
                    student.setPhone(parts.length > 6 ? parts[6].trim() : null);
                    student.setEmail(parts.length > 7 ? parts[7].trim() : null);
                    
                    studentRepository.save(student);
                    imported.add(student);
                    
                } catch (Exception e) {
                    errors.add("Line " + lineNumber + ": " + e.getMessage());
                }
            }
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to read file: " + e.getMessage()));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("imported", imported.size());
        result.put("errors", errors);
        result.put("success", errors.isEmpty());
        
        return ResponseEntity.ok(result);
    }

    /**
     * Batch delete students
     */
    @PostMapping("/students/delete")
    public ResponseEntity<?> batchDeleteStudents(@RequestBody List<String> studentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No student IDs provided"));
        }

        List<String> deleted = new ArrayList<>();
        List<String> notFound = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (String id : studentIds) {
            try {
                if (studentRepository.existsById(id)) {
                    studentRepository.deleteById(id);
                    deleted.add(id);
                } else {
                    notFound.add(id);
                }
            } catch (Exception e) {
                errors.add(id + ": " + e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of(
            "deleted", deleted.size(),
            "notFound", notFound.size(),
            "errors", errors
        ));
    }

    /**
     * Batch check-in students
     */
    @PostMapping("/checkin")
    public ResponseEntity<?> batchCheckIn(@RequestBody List<Map<String, Object>> assignments) {
        // Each assignment: { studentID: "xxx", bedID: 123 }
        List<String> success = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Map<String, Object> assignment : assignments) {
            String studentId = (String) assignment.get("studentID");
            Integer bedId = (Integer) assignment.get("bedID");
            
            if (studentId == null || bedId == null) {
                errors.add("Invalid assignment: missing studentID or bedID");
                continue;
            }

            // This would call the check-in logic from DormitoryController
            // For simplicity, just record the intent
            // In production, you'd extract the check-in logic to a service
            success.add(studentId + " -> Bed " + bedId);
        }

        return ResponseEntity.ok(Map.of(
            "processed", success.size(),
            "errors", errors
        ));
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String[] parseCsvLine(String line) {
        List<String> parts = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                parts.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        parts.add(current.toString());
        
        return parts.toArray(new String[0]);
    }
}
