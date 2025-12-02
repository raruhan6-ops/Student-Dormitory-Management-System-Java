package com.dormitory.dto;

import lombok.Data;

@Data
public class RoomApplicationRequest {
    private Integer bedID;

    public Integer getBedID() {
        return bedID;
    }

    public void setBedID(Integer bedID) {
        this.bedID = bedID;
    }
}
