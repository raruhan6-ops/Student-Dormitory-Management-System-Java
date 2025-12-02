package com.dormitory.repository;

import com.dormitory.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType);
    
    List<AuditLog> findByEntityIdOrderByTimestampDesc(String entityId);
    
    List<AuditLog> findByPerformedByOrderByTimestampDesc(String performedBy);
    
    List<AuditLog> findByActionOrderByTimestampDesc(String action);
    
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    
    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);
    
    List<AuditLog> findTop100ByOrderByTimestampDesc();
}
