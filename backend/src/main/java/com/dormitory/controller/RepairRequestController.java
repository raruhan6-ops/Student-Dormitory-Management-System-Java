package com.dormitory.controller;

import com.dormitory.entity.RepairRequest;
import com.dormitory.repository.RepairRequestRepository;
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
        return repairRequestRepository.save(request);
    }

    @PutMapping("/{id}")
    public RepairRequest updateRequest(@PathVariable Integer id, @RequestBody RepairRequest requestDetails) {
        return repairRequestRepository.findById(id).map(request -> {
            if (requestDetails.getStatus() != null) {
                request.setStatus(requestDetails.getStatus());
                if ("Finished".equals(requestDetails.getStatus())) {
                    request.setFinishTime(LocalDateTime.now());
                }
            }
            if (requestDetails.getHandler() != null) {
                request.setHandler(requestDetails.getHandler());
            }
            return repairRequestRepository.save(request);
        }).orElse(null);
    }
}
