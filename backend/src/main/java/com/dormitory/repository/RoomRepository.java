package com.dormitory.repository;

import com.dormitory.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {
    Room findByBuildingIDAndRoomNumber(Integer buildingID, String roomNumber);
}
