package com.dormitory.service;

import com.dormitory.entity.CheckInOut;
import com.dormitory.repository.BedRepository;
import com.dormitory.repository.CheckInOutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class BookingService {

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private CheckInOutRepository checkInOutRepository;

    @Transactional
    public boolean bookBed(String studentId, Integer bedId) {
        // 1. Atomic Update: Try to set Bed status to Occupied
        // This prevents race conditions where two students see the bed as 'Available'
        int rowsUpdated = bedRepository.occupyBed(bedId);
        
        if (rowsUpdated == 0) {
            // Bed was already occupied or didn't exist
            return false;
        }

        // 2. Create CheckInOut Record
        // Note: The database trigger 'trg_after_checkin' will handle Room occupancy update
        CheckInOut checkIn = new CheckInOut();
        checkIn.setStudentID(studentId);
        checkIn.setBedID(bedId);
        checkIn.setCheckInDate(LocalDate.now());
        checkIn.setStatus("CurrentlyLiving");
        
        checkInOutRepository.save(checkIn);
        
        return true;
    }
}
