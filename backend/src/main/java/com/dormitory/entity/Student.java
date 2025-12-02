package com.dormitory.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "Student")
@Data
public class Student {
    @Id
    private String studentID;
    private String name;
    private String gender;
    private String major;
    
    @jakarta.persistence.Column(name = "Class")
    private String studentClass; // 'class' is a reserved keyword in Java
    
    private Integer enrollmentYear;
    private String phone;

    private String dormBuilding;
    private String roomNumber;
    private String bedNumber;
    
    // Getters and Setters are handled by Lombok @Data
    // If Lombok is not working, you can generate them manually.
}
