package com.dormitory.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Bed")
@Data
public class Bed {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer bedID;

    private Integer roomID;
    private String bedNumber;
    private String status; // Available, Occupied, Reserved

    /**
     * Optimistic locking version field.
     * Prevents concurrent modifications - if two transactions try to modify the same bed,
     * only the first one will succeed, the second will get OptimisticLockException.
     * Initialized to 0 to handle existing database rows with NULL version.
     */
    @Version
    @Column(columnDefinition = "INT DEFAULT 0")
    private Integer version = 0;

    public Integer getBedID() {
        return bedID;
    }

    public void setBedID(Integer bedID) {
        this.bedID = bedID;
    }

    public Integer getRoomID() {
        return roomID;
    }

    public void setRoomID(Integer roomID) {
        this.roomID = roomID;
    }

    public String getBedNumber() {
        return bedNumber;
    }

    public void setBedNumber(String bedNumber) {
        this.bedNumber = bedNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }
}
