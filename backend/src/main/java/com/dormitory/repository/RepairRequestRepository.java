package com.dormitory.repository;

import com.dormitory.entity.RepairRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RepairRequestRepository extends JpaRepository<RepairRequest, Integer> {
    List<RepairRequest> findBySubmitterStudentID(String submitterStudentID);
    List<RepairRequest> findByStatus(String status);
    long countByStatus(String status);
}
