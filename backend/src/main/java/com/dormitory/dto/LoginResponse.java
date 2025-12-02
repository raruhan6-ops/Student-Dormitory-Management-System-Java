package com.dormitory.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private Integer userID;
    private String username;
    private String role;
    private String relatedStudentID;
    private String token; // For MVP, this can be a dummy token or userID

    public LoginResponse(Integer userID, String username, String role, String relatedStudentID) {
        this.userID = userID;
        this.username = username;
        this.role = role;
        this.relatedStudentID = relatedStudentID;
        this.token = "dummy-token-" + userID;
    }

    public Integer getUserID() {
        return userID;
    }

    public void setUserID(Integer userID) {
        this.userID = userID;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getRelatedStudentID() {
        return relatedStudentID;
    }

    public void setRelatedStudentID(String relatedStudentID) {
        this.relatedStudentID = relatedStudentID;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
