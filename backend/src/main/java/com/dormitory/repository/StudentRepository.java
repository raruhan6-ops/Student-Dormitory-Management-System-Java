package com.dormitory.repository;

import com.dormitory.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {
    // Custom query methods can be defined here
}
