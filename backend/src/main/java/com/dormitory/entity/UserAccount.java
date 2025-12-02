package com.dormitory.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "UserAccount")
@Data
public class UserAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer userID;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String role; // Student, DormManager, Admin

    private String relatedStudentID;

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

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
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
}
