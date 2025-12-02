package com.dormitory.controller;

import com.dormitory.entity.Bed;
import com.dormitory.entity.DormBuilding;
import com.dormitory.entity.Room;
import com.dormitory.repository.BedRepository;
import com.dormitory.repository.DormBuildingRepository;
import com.dormitory.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dormitories")
@CrossOrigin(origins = "*")
public class DormitoryController {

    @Autowired
    private DormBuildingRepository buildingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BedRepository bedRepository;

    @GetMapping
    public List<DormBuilding> getAllBuildings() {
        return buildingRepository.findAll();
    }

    @GetMapping("/{buildingId}/rooms")
    public List<Room> getRoomsByBuilding(@PathVariable Integer buildingId) {
        return roomRepository.findAll().stream()
                .filter(room -> room.getBuildingID().equals(buildingId))
                .collect(Collectors.toList());
        // Note: In a real app, you'd use a custom query in the repository
    }

    @GetMapping("/rooms/{roomId}/beds")
    public List<Bed> getBedsByRoom(@PathVariable Integer roomId) {
        return bedRepository.findAll().stream()
                .filter(bed -> bed.getRoomID().equals(roomId))
                .collect(Collectors.toList());
    }
}
