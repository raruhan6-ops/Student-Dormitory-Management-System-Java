package com.dormitory.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "DormBuilding")
@Data
public class DormBuilding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer buildingID;

    private String buildingName;
    private String location;
    private String managerName;
    private String managerPhone;

    public Integer getBuildingID() {
        return buildingID;
    }

    public void setBuildingID(Integer buildingID) {
        this.buildingID = buildingID;
    }

    public String getBuildingName() {
        return buildingName;
    }

    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public String getManagerPhone() {
        return managerPhone;
    }

    public void setManagerPhone(String managerPhone) {
        this.managerPhone = managerPhone;
    }
}
