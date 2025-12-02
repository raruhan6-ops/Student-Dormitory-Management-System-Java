package com.dormitory.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "AuditLog")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // CREATE, UPDATE, DELETE, CHECK_IN, CHECK_OUT, etc.

    @Column(nullable = false)
    private String entityType; // Student, Building, Room, Bed, RepairRequest, etc.

    private String entityId; // ID of the affected entity

    @Column(length = 2000)
    private String details; // JSON or description of changes

    private String performedBy; // Username who performed the action

    @Column(nullable = false)
    private LocalDateTime timestamp;

    private String ipAddress;

    // Constructors
    public AuditLog() {
        this.timestamp = LocalDateTime.now();
    }

    public AuditLog(String action, String entityType, String entityId, String details, String performedBy) {
        this();
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
        this.performedBy = performedBy;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}
