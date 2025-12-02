package com.dormitory.controller;

import com.dormitory.dto.OccupancyRow;
import com.dormitory.entity.RepairRequest;
import com.dormitory.entity.Student;
import com.dormitory.repository.RepairRequestRepository;
import com.dormitory.repository.StudentRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/manager")
@CrossOrigin(origins = "*")
public class ManagerController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RepairRequestRepository repairRequestRepository;

    @PersistenceContext
    private EntityManager entityManager;

    // --- Search Endpoints ---

    @GetMapping("/students/search")
    public List<Student> searchStudents(@RequestParam(required = false) String studentId,
                                        @RequestParam(required = false) String q) {
        if (studentId != null && !studentId.isEmpty()) {
            java.util.List<Student> only = new java.util.ArrayList<>();
            studentRepository.findById(studentId).ifPresent(only::add);
            return only;
        }
        if (q != null && !q.isEmpty()) {
            return studentRepository.findByNameContainingOrMajorContainingOrStudentClassContaining(q, q, q);
        }
        return studentRepository.findAll();
    }

    @GetMapping("/repairs/search")
    public List<RepairRequest> searchRepairs(@RequestParam(required = false) String status,
                                             @RequestParam(required = false) String q) {
        if (status != null && !status.isEmpty() && q != null && !q.isEmpty()) {
            return repairRequestRepository.findByStatusAndDescriptionContaining(status, q);
        }
        if (status != null && !status.isEmpty()) {
            return repairRequestRepository.findByStatus(status);
        }
        if (q != null && !q.isEmpty()) {
            return repairRequestRepository.findByDescriptionContaining(q);
        }
        return repairRequestRepository.findAll();
    }

    // --- Occupancy from DB View ---
    @GetMapping("/occupancy")
    public List<OccupancyRow> getOccupancy() {
        // We read directly from the view to avoid complex joins here
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager
                .createNativeQuery("SELECT BuildingName, RoomNumber, capacity, CurrentOccupancy, OccupancyRate FROM vw_room_occupancy")
                .getResultList();

        List<OccupancyRow> result = new ArrayList<>();
        for (Object[] r : rows) {
            OccupancyRow o = new OccupancyRow();
            o.setBuildingName(r[0] != null ? r[0].toString() : null);
            o.setRoomNumber(r[1] != null ? r[1].toString() : null);
            o.setCapacity(r[2] != null ? ((Number) r[2]).intValue() : null);
            o.setCurrentOccupancy(r[3] != null ? ((Number) r[3]).intValue() : null);
            o.setOccupancyRate(r[4] != null ? ((Number) r[4]).doubleValue() : null);
            result.add(o);
        }
        return result;
    }

    // --- Export Endpoints (CSV) ---

    @GetMapping("/export/students")
    public ResponseEntity<byte[]> exportStudents() {
        List<Student> students = studentRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("Student ID,Name,Gender,Major,Class,Phone,Building,Room,Bed\n");
        
        for (Student s : students) {
            csv.append(escape(s.getStudentID())).append(",")
               .append(escape(s.getName())).append(",")
               .append(escape(s.getGender())).append(",")
               .append(escape(s.getMajor())).append(",")
               .append(escape(s.getStudentClass())).append(",")
               .append(escape(s.getPhone())).append(",")
               .append(escape(s.getDormBuilding())).append(",")
               .append(escape(s.getRoomNumber())).append(",")
               .append(escape(s.getBedNumber())).append("\n");
        }

        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }

    @GetMapping("/export/repairs")
    public ResponseEntity<byte[]> exportRepairs() {
        List<RepairRequest> repairs = repairRequestRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Room ID,Submitter,Description,Status,Submit Time\n");

        for (RepairRequest r : repairs) {
            csv.append(r.getRepairID()).append(",")
               .append(r.getRoomID()).append(",")
               .append(escape(r.getSubmitterStudentID())).append(",")
               .append(escape(r.getDescription())).append(",")
               .append(escape(r.getStatus())).append(",")
               .append(r.getSubmitTime()).append("\n");
        }

        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=repairs.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }

    private String escape(String data) {
        if (data == null) return "";
        String escapedData = data.replaceAll("\\R", " ");
        if (data.contains(",") || data.contains("\"") || data.contains("'")) {
            data = data.replace("\"", "\"\"");
            escapedData = "\"" + data + "\"";
        }
        return escapedData;
    }
}
