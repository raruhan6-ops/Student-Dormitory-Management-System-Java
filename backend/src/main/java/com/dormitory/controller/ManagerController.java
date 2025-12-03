package com.dormitory.controller;

import com.dormitory.dto.OccupancyRow;
import com.dormitory.entity.RepairRequest;
import com.dormitory.entity.Student;
import com.dormitory.repository.RepairRequestRepository;
import com.dormitory.repository.StudentRepository;
import com.dormitory.security.RequiresRole;
import com.dormitory.service.ExportService;
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

/**
 * Controller for manager-only operations.
 * All endpoints require DormManager or Admin role.
 */
@RestController
@RequestMapping("/api/manager")
@RequiresRole({"DormManager", "Admin"})
public class ManagerController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RepairRequestRepository repairRequestRepository;

    @Autowired
    private ExportService exportService;

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
    public com.dormitory.dto.OccupancyPage getOccupancy(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) String room,
            @RequestParam(required = false) Double minRate,
            @RequestParam(required = false) Double maxRate,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String order) {
        if (page < 1) page = 1;
        if (size < 1) size = 1;
        if (size > 100) size = 100;

        StringBuilder where = new StringBuilder(" WHERE 1=1");
        java.util.Map<String, Object> params = new java.util.HashMap<>();
        if (building != null && !building.isBlank()) {
            where.append(" AND BuildingName LIKE :building");
            params.put("building", "%" + building + "%");
        }
        if (room != null && !room.isBlank()) {
            where.append(" AND RoomNumber LIKE :room");
            params.put("room", "%" + room + "%");
        }
        if (minRate != null) {
            where.append(" AND OccupancyRate >= :minRate");
            params.put("minRate", minRate);
        }
        if (maxRate != null) {
            where.append(" AND OccupancyRate <= :maxRate");
            params.put("maxRate", maxRate);
        }

        // Count total with filters
        jakarta.persistence.Query countQuery = entityManager
                .createNativeQuery("SELECT COUNT(*) FROM vw_room_occupancy" + where);
        for (var e : params.entrySet()) countQuery.setParameter(e.getKey(), e.getValue());
        Number totalNum = (Number) countQuery.getSingleResult();
        long total = totalNum != null ? totalNum.longValue() : 0L;

        int offset = (page - 1) * size;

        String sortKey = (sort == null || sort.isBlank()) ? "building" : sort.toLowerCase();
        String sortCol;
        switch (sortKey) {
            case "room": sortCol = "RoomNumber"; break;
            case "capacity": sortCol = "capacity"; break;
            case "current": sortCol = "CurrentOccupancy"; break;
            case "rate": sortCol = "OccupancyRate"; break;
            default: sortCol = "BuildingName"; break;
        }
        String dir = (order != null && order.equalsIgnoreCase("desc")) ? "DESC" : "ASC";

        jakarta.persistence.Query dataQuery = entityManager
                .createNativeQuery(
                        "SELECT BuildingName, RoomNumber, capacity, CurrentOccupancy, OccupancyRate " +
                    "FROM vw_room_occupancy" + where + " ORDER BY " + sortCol + " " + dir + ", BuildingName, RoomNumber LIMIT :size OFFSET :offset");
        for (var e : params.entrySet()) dataQuery.setParameter(e.getKey(), e.getValue());
        dataQuery.setParameter("size", size);
        dataQuery.setParameter("offset", offset);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = (List<Object[]>) dataQuery.getResultList();

        List<OccupancyRow> items = new ArrayList<>();
        for (Object[] r : rows) {
            OccupancyRow o = new OccupancyRow();
            o.setBuildingName(r[0] != null ? r[0].toString() : null);
            o.setRoomNumber(r[1] != null ? r[1].toString() : null);
            o.setCapacity(r[2] != null ? ((Number) r[2]).intValue() : null);
            o.setCurrentOccupancy(r[3] != null ? ((Number) r[3]).intValue() : null);
            o.setOccupancyRate(r[4] != null ? ((Number) r[4]).doubleValue() : null);
            items.add(o);
        }

        return new com.dormitory.dto.OccupancyPage(items, total, page, size);
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

    // --- Excel Export Endpoints ---

    @GetMapping("/export/students/excel")
    public ResponseEntity<byte[]> exportStudentsExcel() {
        try {
            List<Student> students = studentRepository.findAll();
            byte[] excelData = exportService.exportStudentsToExcel(students);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/repairs/excel")
    public ResponseEntity<byte[]> exportRepairsExcel() {
        try {
            List<RepairRequest> repairs = repairRequestRepository.findAll();
            byte[] excelData = exportService.exportRepairsToExcel(repairs);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=repairs.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // --- PDF Export Endpoints ---

    @GetMapping("/export/students/pdf")
    public ResponseEntity<byte[]> exportStudentsPdf() {
        try {
            List<Student> students = studentRepository.findAll();
            byte[] pdfData = exportService.exportStudentsToPdf(students);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/repairs/pdf")
    public ResponseEntity<byte[]> exportRepairsPdf() {
        try {
            List<RepairRequest> repairs = repairRequestRepository.findAll();
            byte[] pdfData = exportService.exportRepairsToPdf(repairs);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=repairs.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
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
