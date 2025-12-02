package com.dormitory.dto;

import lombok.Data;

@Data
public class CheckInRequest {
    private String studentID;
    private Integer bedID;

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
}
