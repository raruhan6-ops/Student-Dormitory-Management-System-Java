package com.dormitory.repository;

import com.dormitory.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, Integer> {
    Bed findByRoomIDAndBedNumber(Integer roomID, String bedNumber);
    List<Bed> findByRoomID(Integer roomID);
    long countByStatus(String status);
    long countByRoomIDAndStatus(Integer roomID, String status);

    /**
     * Atomically occupy a bed - only succeeds if bed is Available.
     * Uses optimistic locking via WHERE clause to prevent race conditions.
     * 
     * @param bedId The bed to occupy
     * @return Number of rows updated (1 if successful, 0 if bed was not available)
     */
    @Modifying
    @Query("UPDATE Bed b SET b.status = 'Occupied' WHERE b.bedID = :bedId AND b.status = 'Available'")
    int occupyBed(@Param("bedId") Integer bedId);

    /**
     * Atomically reserve a bed for a pending application.
     * Reserved beds are not available to other students but not yet fully occupied.
     * 
     * @param bedId The bed to reserve
     * @return Number of rows updated (1 if successful, 0 if bed was not available)
     */
    @Modifying
    @Query("UPDATE Bed b SET b.status = 'Reserved' WHERE b.bedID = :bedId AND b.status = 'Available'")
    int reserveBed(@Param("bedId") Integer bedId);

    /**
     * Release a reserved bed back to Available status.
     * Used when an application is rejected.
     * 
     * @param bedId The bed to release
     * @return Number of rows updated
     */
    @Modifying
    @Query("UPDATE Bed b SET b.status = 'Available' WHERE b.bedID = :bedId AND b.status = 'Reserved'")
    int releaseBed(@Param("bedId") Integer bedId);

    /**
     * Occupy a reserved bed (change from Reserved to Occupied).
     * Used when approving an application.
     * 
     * @param bedId The bed to occupy
     * @return Number of rows updated
     */
    @Modifying
    @Query("UPDATE Bed b SET b.status = 'Occupied' WHERE b.bedID = :bedId AND (b.status = 'Reserved' OR b.status = 'Available')")
    int occupyReservedBed(@Param("bedId") Integer bedId);
}
