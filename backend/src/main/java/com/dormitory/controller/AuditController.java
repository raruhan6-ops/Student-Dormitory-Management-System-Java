package com.dormitory.controller;

import com.dormitory.entity.AuditLog;
import com.dormitory.repository.AuditLogRepository;
import com.dormitory.security.RequiresRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
@RequiresRole({"DormManager", "Admin"})  // Only managers/admins can view audit logs
public class AuditController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Get paginated audit logs
     */
    @GetMapping
    public Map<String, Object> getAuditLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size);
        Page<AuditLog> logPage = auditLogRepository.findAllByOrderByTimestampDesc(pageable);
        
        return Map.of(
            "items", logPage.getContent(),
            "total", logPage.getTotalElements(),
            "page", page,
            "size", size,
            "totalPages", logPage.getTotalPages()
        );
    }

    /**
     * Get recent audit logs (last 100)
     */
    @GetMapping("/recent")
    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }

    /**
     * Get logs by entity type
     */
    @GetMapping("/entity/{entityType}")
    public List<AuditLog> getLogsByEntityType(@PathVariable String entityType) {
        return auditLogRepository.findByEntityTypeOrderByTimestampDesc(entityType);
    }

    /**
     * Get logs by user
     */
    @GetMapping("/user/{username}")
    public List<AuditLog> getLogsByUser(@PathVariable String username) {
        return auditLogRepository.findByPerformedByOrderByTimestampDesc(username);
    }

    /**
     * Get logs by action
     */
    @GetMapping("/action/{action}")
    public List<AuditLog> getLogsByAction(@PathVariable String action) {
        return auditLogRepository.findByActionOrderByTimestampDesc(action);
    }

    /**
     * Get history for a specific entity
     */
    @GetMapping("/history/{entityId}")
    public List<AuditLog> getEntityHistory(@PathVariable String entityId) {
        return auditLogRepository.findByEntityIdOrderByTimestampDesc(entityId);
    }
}
