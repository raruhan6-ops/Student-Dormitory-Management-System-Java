package com.dormitory.repository;

import com.dormitory.entity.DormBuilding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DormBuildingRepository extends JpaRepository<DormBuilding, Integer> {
    DormBuilding findByBuildingName(String buildingName);
}
