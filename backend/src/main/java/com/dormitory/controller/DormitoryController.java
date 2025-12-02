package com.dormitory.controller;

import com.dormitory.dto.BedDTO;
import com.dormitory.dto.CheckInRequest;
import com.dormitory.entity.Bed;
import com.dormitory.entity.CheckInOut;
import com.dormitory.entity.DormBuilding;
import com.dormitory.entity.Room;
import com.dormitory.entity.Student;
import com.dormitory.repository.BedRepository;
import com.dormitory.repository.CheckInOutRepository;
import com.dormitory.repository.DormBuildingRepository;
import com.dormitory.repository.RoomRepository;
import com.dormitory.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CheckInOutRepository checkInOutRepository;

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
    public List<BedDTO> getBedsByRoom(@PathVariable Integer roomId) {
        // 1. Get the Room to find building and room number
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) {
            return List.of();
        }

        // 2. Get Building to find building name
        DormBuilding building = buildingRepository.findById(room.getBuildingID()).orElse(null);
        if (building == null) {
            return List.of();
        }

        // 3. Get all beds in the room
        List<Bed> beds = bedRepository.findAll().stream()
                .filter(bed -> bed.getRoomID().equals(roomId))
                .collect(Collectors.toList());

        // 4. Get all students in the room
        List<Student> students = studentRepository.findByDormBuildingAndRoomNumber(building.getBuildingName(), room.getRoomNumber());

        // 5. Map Bed to BedDTO and attach student info
        return beds.stream().map(bed -> {
            BedDTO dto = new BedDTO();
            dto.setBedID(bed.getBedID());
            dto.setRoomID(bed.getRoomID());
            dto.setBedNumber(bed.getBedNumber());
            dto.setStatus(bed.getStatus());

            // Find student occupying this bed
            Student occupant = students.stream()
                    .filter(s -> s.getBedNumber().equals(bed.getBedNumber()))
                    .findFirst()
                    .orElse(null);

            if (occupant != null) {
                dto.setStudentID(occupant.getStudentID());
                dto.setStudentName(occupant.getName());
            }

            return dto;
        }).collect(Collectors.toList());
    }

    // --- Building Management ---

    @PostMapping
    public DormBuilding addBuilding(@RequestBody DormBuilding building) {
        return buildingRepository.save(building);
    }

    @PutMapping("/{id}")
    public DormBuilding updateBuilding(@PathVariable Integer id, @RequestBody DormBuilding buildingDetails) {
        return buildingRepository.findById(id).map(building -> {
            building.setBuildingName(buildingDetails.getBuildingName());
            building.setLocation(buildingDetails.getLocation());
            building.setManagerName(buildingDetails.getManagerName());
            building.setManagerPhone(buildingDetails.getManagerPhone());
            return buildingRepository.save(building);
        }).orElse(null);
    }

    // --- Room Management ---

    @PostMapping("/{buildingId}/rooms")
    public Room addRoom(@PathVariable Integer buildingId, @RequestBody Room room) {
        room.setBuildingID(buildingId);
        // Initialize occupancy if not provided
        if (room.getCurrentOccupancy() == null) {
            room.setCurrentOccupancy(0);
        }
        return roomRepository.save(room);
    }

    // --- Check-In / Check-Out ---

    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody CheckInRequest request) {
        // 1. Validate Student
        Student student = studentRepository.findById(request.getStudentID()).orElse(null);
        if (student == null) {
            return ResponseEntity.badRequest().body("Student not found");
        }

        // 2. Validate Bed
        Bed bed = bedRepository.findById(request.getBedID()).orElse(null);
        if (bed == null) {
            return ResponseEntity.badRequest().body("Bed not found");
        }
        if ("Occupied".equalsIgnoreCase(bed.getStatus())) {
            return ResponseEntity.badRequest().body("Bed is already occupied");
        }

        // 3. Validate Room and Building
        Room room = roomRepository.findById(bed.getRoomID()).orElse(null);
        if (room == null) {
            return ResponseEntity.badRequest().body("Room not found");
        }
        DormBuilding building = buildingRepository.findById(room.getBuildingID()).orElse(null);
        if (building == null) {
            return ResponseEntity.badRequest().body("Building not found");
        }

        // 4. Check if student is already living somewhere
        CheckInOut existing = checkInOutRepository.findByStudentIDAndStatus(student.getStudentID(), "CurrentlyLiving");
        if (existing != null) {
            return ResponseEntity.badRequest().body("Student is already checked in");
        }

        // 5. Perform Check-In
        // Update Bed
        bed.setStatus("Occupied");
        bedRepository.save(bed);

        // Update Room Occupancy
        room.setCurrentOccupancy(room.getCurrentOccupancy() + 1);
        roomRepository.save(room);

        // Update Student Location
        student.setDormBuilding(building.getBuildingName());
        student.setRoomNumber(room.getRoomNumber());
        student.setBedNumber(bed.getBedNumber());
        studentRepository.save(student);

        // Create CheckInOut Record
        CheckInOut checkInOut = new CheckInOut();
        checkInOut.setStudentID(student.getStudentID());
        checkInOut.setBedID(bed.getBedID());
        checkInOut.setCheckInDate(LocalDate.now());
        checkInOut.setStatus("CurrentlyLiving");
        checkInOutRepository.save(checkInOut);

        return ResponseEntity.ok("Check-in successful");
    }

    @PostMapping("/check-out/{studentId}")
    public ResponseEntity<?> checkOut(@PathVariable String studentId) {
        // 1. Find active check-in record
        CheckInOut record = checkInOutRepository.findByStudentIDAndStatus(studentId, "CurrentlyLiving");
        if (record == null) {
            return ResponseEntity.badRequest().body("Student is not currently checked in");
        }

        // 2. Find Bed
        Bed bed = bedRepository.findById(record.getBedID()).orElse(null);
        if (bed != null) {
            bed.setStatus("Available");
            bedRepository.save(bed);

            // Update Room Occupancy
            Room room = roomRepository.findById(bed.getRoomID()).orElse(null);
            if (room != null) {
                room.setCurrentOccupancy(Math.max(0, room.getCurrentOccupancy() - 1));
                roomRepository.save(room);
            }
        }

        // 3. Update Student Location
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student != null) {
            student.setDormBuilding(null);
            student.setRoomNumber(null);
            student.setBedNumber(null);
            studentRepository.save(student);
        }

        // 4. Update CheckInOut Record
        record.setCheckOutDate(LocalDate.now());
        record.setStatus("CheckedOut");
        checkInOutRepository.save(record);

        return ResponseEntity.ok("Check-out successful");
    }
}
