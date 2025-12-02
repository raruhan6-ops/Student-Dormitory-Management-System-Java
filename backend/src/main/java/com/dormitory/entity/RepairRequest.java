package com.dormitory.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "RepairRequest")
@Data
public class RepairRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer repairID;

    private Integer roomID;
    private String submitterStudentID;
    private String description;
    private LocalDateTime submitTime;
    private String status; // Pending, Finished
    private String handler;
    private LocalDateTime finishTime;

    public Integer getRepairID() {
        return repairID;
    }

    public void setRepairID(Integer repairID) {
        this.repairID = repairID;
    }

    public Integer getRoomID() {
        return roomID;
    }

    public void setRoomID(Integer roomID) {
        this.roomID = roomID;
    }

    public String getSubmitterStudentID() {
        return submitterStudentID;
    }

    public void setSubmitterStudentID(String submitterStudentID) {
        this.submitterStudentID = submitterStudentID;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getSubmitTime() {
        return submitTime;
    }

    public void setSubmitTime(LocalDateTime submitTime) {
        this.submitTime = submitTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getHandler() {
        return handler;
    }

    public void setHandler(String handler) {
        this.handler = handler;
    }

    public LocalDateTime getFinishTime() {
        return finishTime;
    }

    public void setFinishTime(LocalDateTime finishTime) {
        this.finishTime = finishTime;
    }
}
