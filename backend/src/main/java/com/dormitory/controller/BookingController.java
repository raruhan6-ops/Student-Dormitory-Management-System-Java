package com.dormitory.controller;

import com.dormitory.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping("/book-bed")
    public ResponseEntity<?> bookBed(@RequestBody Map<String, Object> payload) {
        String studentId = (String) payload.get("studentId");
        Integer bedId = (Integer) payload.get("bedId");

        if (studentId == null || bedId == null) {
            return ResponseEntity.badRequest().body("Missing studentId or bedId");
        }

        boolean success = bookingService.bookBed(studentId, bedId);
        
        if (success) {
            return ResponseEntity.ok("Bed booked successfully");
        } else {
            return ResponseEntity.badRequest().body("Bed is already occupied or unavailable");
        }
    }
}
