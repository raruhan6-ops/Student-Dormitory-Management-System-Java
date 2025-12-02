package com.dormitory.repository;

import com.dormitory.entity.CheckInOut;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CheckInOutRepository extends JpaRepository<CheckInOut, Integer> {
    List<CheckInOut> findByStudentID(String studentID);
    List<CheckInOut> findByStatus(String status);
    CheckInOut findByStudentIDAndStatus(String studentID, String status);
}
