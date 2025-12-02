package com.dormitory.controller;

import com.dormitory.dto.DashboardStats;
import com.dormitory.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired private StudentRepository studentRepository;
    @Autowired private DormBuildingRepository buildingRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private BedRepository bedRepository;
    @Autowired private RepairRequestRepository repairRequestRepository;

    @GetMapping
    public DashboardStats getStats() {
        long totalStudents = studentRepository.count();
        long totalBuildings = buildingRepository.count();
        long totalRooms = roomRepository.count();
        long totalBeds = bedRepository.count();
        long occupiedBeds = bedRepository.countByStatus("Occupied");
        long pendingRepairs = repairRequestRepository.countByStatus("Pending");

        return new DashboardStats(totalStudents, totalBuildings, totalRooms, totalBeds, occupiedBeds, pendingRepairs);
    }
}
