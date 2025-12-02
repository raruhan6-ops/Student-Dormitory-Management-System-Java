package com.dormitory.repository;

import com.dormitory.entity.RoomApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomApplicationRepository extends JpaRepository<RoomApplication, Integer> {
    List<RoomApplication> findByStudentID(String studentID);
    List<RoomApplication> findByStatus(String status);
    List<RoomApplication> findByStudentIDAndStatus(String studentID, String status);
    boolean existsByStudentIDAndStatus(String studentID, String status);
}
