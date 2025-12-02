package com.dormitory.repository;

import com.dormitory.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BedRepository extends JpaRepository<Bed, Integer> {
    Bed findByRoomIDAndBedNumber(Integer roomID, String bedNumber);
    long countByStatus(String status);

    @Modifying
    @Query("UPDATE Bed b SET b.status = 'Occupied' WHERE b.bedID = :bedId AND b.status = 'Available'")
    int occupyBed(@Param("bedId") Integer bedId);
}
