package com.dormitory.dto;

import lombok.Data;

@Data
public class DashboardStats {
    private long totalStudents;
    private long totalBuildings;
    private long totalRooms;
    private long totalBeds;
    private long occupiedBeds;
    private long pendingRepairs;

    public DashboardStats(long totalStudents, long totalBuildings, long totalRooms, long totalBeds, long occupiedBeds, long pendingRepairs) {
        this.totalStudents = totalStudents;
        this.totalBuildings = totalBuildings;
        this.totalRooms = totalRooms;
        this.totalBeds = totalBeds;
        this.occupiedBeds = occupiedBeds;
        this.pendingRepairs = pendingRepairs;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getTotalBuildings() {
        return totalBuildings;
    }

    public void setTotalBuildings(long totalBuildings) {
        this.totalBuildings = totalBuildings;
    }

    public long getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(long totalRooms) {
        this.totalRooms = totalRooms;
    }

    public long getTotalBeds() {
        return totalBeds;
    }

    public void setTotalBeds(long totalBeds) {
        this.totalBeds = totalBeds;
    }

    public long getOccupiedBeds() {
        return occupiedBeds;
    }

    public void setOccupiedBeds(long occupiedBeds) {
        this.occupiedBeds = occupiedBeds;
    }

    public long getPendingRepairs() {
        return pendingRepairs;
    }

    public void setPendingRepairs(long pendingRepairs) {
        this.pendingRepairs = pendingRepairs;
    }
}
