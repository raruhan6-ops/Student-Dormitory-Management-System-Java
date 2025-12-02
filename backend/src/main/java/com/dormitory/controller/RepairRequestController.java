package com.dormitory.controller;

import com.dormitory.entity.RepairRequest;
import com.dormitory.entity.Student;
import com.dormitory.repository.RepairRequestRepository;
import com.dormitory.repository.StudentRepository;
import com.dormitory.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/repairs")
@CrossOrigin(origins = "*")
public class RepairRequestController {

    @Autowired
    private RepairRequestRepository repairRequestRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private EmailService emailService;

    @GetMapping
    public List<RepairRequest> getAllRequests() {
        return repairRequestRepository.findAll();
    }

    @GetMapping("/student/{studentId}")
    public List<RepairRequest> getRequestsByStudent(@PathVariable String studentId) {
        return repairRequestRepository.findBySubmitterStudentID(studentId);
    }

    @PostMapping
    public RepairRequest createRequest(@RequestBody RepairRequest request) {
        request.setSubmitTime(LocalDateTime.now());
        request.setStatus("Pending");
        RepairRequest saved = repairRequestRepository.save(request);

        // Send email notification
        Student student = studentRepository.findById(request.getSubmitterStudentID()).orElse(null);
        if (student != null) {
            emailService.sendRepairRequestSubmitted(student, saved);
        }

        return saved;
    }

    @PutMapping("/{id}")
    public RepairRequest updateRequest(@PathVariable Integer id, @RequestBody RepairRequest requestDetails) {
        return repairRequestRepository.findById(id).map(request -> {
            String oldStatus = request.getStatus();
            
            if (requestDetails.getStatus() != null) {
                request.setStatus(requestDetails.getStatus());
                if ("Finished".equals(requestDetails.getStatus())) {
                    request.setFinishTime(LocalDateTime.now());
                }
            }
            if (requestDetails.getHandler() != null) {
                request.setHandler(requestDetails.getHandler());
            }
            RepairRequest updated = repairRequestRepository.save(request);

            // Send email notification on status change
            if (requestDetails.getStatus() != null && !requestDetails.getStatus().equals(oldStatus)) {
                Student student = studentRepository.findById(request.getSubmitterStudentID()).orElse(null);
                if (student != null) {
                    emailService.sendRepairStatusUpdate(student, updated, oldStatus, requestDetails.getStatus());
                }
            }

            return updated;
        }).orElse(null);
    }
}
