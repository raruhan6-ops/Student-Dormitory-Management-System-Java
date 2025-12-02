package com.dormitory.service;

import com.dormitory.entity.AuditLog;
import com.dormitory.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Log an action asynchronously
     */
    @Async
    public void log(String action, String entityType, String entityId, String details, String performedBy) {
        try {
            AuditLog log = new AuditLog(action, entityType, entityId, details, performedBy);
            auditLogRepository.save(log);
            System.out.println("[Audit] " + action + " " + entityType + " " + entityId + " by " + performedBy);
        } catch (Exception e) {
            System.err.println("[Audit] Failed to log: " + e.getMessage());
        }
    }

    /**
     * Log with IP address
     */
    @Async
    public void log(String action, String entityType, String entityId, String details, String performedBy, String ipAddress) {
        try {
            AuditLog log = new AuditLog(action, entityType, entityId, details, performedBy);
            log.setIpAddress(ipAddress);
            auditLogRepository.save(log);
            System.out.println("[Audit] " + action + " " + entityType + " " + entityId + " by " + performedBy + " from " + ipAddress);
        } catch (Exception e) {
            System.err.println("[Audit] Failed to log: " + e.getMessage());
        }
    }

    // Common log actions
    public void logCreate(String entityType, String entityId, String details, String performedBy) {
        log("CREATE", entityType, entityId, details, performedBy);
    }

    public void logUpdate(String entityType, String entityId, String details, String performedBy) {
        log("UPDATE", entityType, entityId, details, performedBy);
    }

    public void logDelete(String entityType, String entityId, String details, String performedBy) {
        log("DELETE", entityType, entityId, details, performedBy);
    }

    public void logCheckIn(String studentId, String details, String performedBy) {
        log("CHECK_IN", "Student", studentId, details, performedBy);
    }

    public void logCheckOut(String studentId, String details, String performedBy) {
        log("CHECK_OUT", "Student", studentId, details, performedBy);
    }

    public void logLogin(String username, String ipAddress) {
        log("LOGIN", "User", username, "User logged in", username, ipAddress);
    }

    public void logLogout(String username) {
        log("LOGOUT", "User", username, "User logged out", username);
    }
}
