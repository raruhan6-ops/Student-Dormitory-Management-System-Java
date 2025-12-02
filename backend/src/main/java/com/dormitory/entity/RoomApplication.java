package com.dormitory.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_application")
@Data
public class RoomApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer applicationID;

    private String studentID;
    private Integer bedID;
    
    @Column(length = 20)
    private String status; // Pending, Approved, Rejected
    
    private LocalDateTime applyTime;
    private LocalDateTime processTime;
    private String processedBy; // username of manager who processed
    private String rejectReason;

    // Getters and setters
    public Integer getApplicationID() {
        return applicationID;
    }

    public void setApplicationID(Integer applicationID) {
        this.applicationID = applicationID;
    }

    public String getStudentID() {
        return studentID;
    }

    public void setStudentID(String studentID) {
        this.studentID = studentID;
    }

    public Integer getBedID() {
        return bedID;
    }

    public void setBedID(Integer bedID) {
        this.bedID = bedID;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getApplyTime() {
        return applyTime;
    }

    public void setApplyTime(LocalDateTime applyTime) {
        this.applyTime = applyTime;
    }

    public LocalDateTime getProcessTime() {
        return processTime;
    }

    public void setProcessTime(LocalDateTime processTime) {
        this.processTime = processTime;
    }

    public String getProcessedBy() {
        return processedBy;
    }

    public void setProcessedBy(String processedBy) {
        this.processedBy = processedBy;
    }

    public String getRejectReason() {
        return rejectReason;
    }

    public void setRejectReason(String rejectReason) {
        this.rejectReason = rejectReason;
    }
}
