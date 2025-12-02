package com.dormitory.repository;

import com.dormitory.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BedRepository extends JpaRepository<Bed, Integer> {
    Bed findByRoomIDAndBedNumber(Integer roomID, String bedNumber);
}
