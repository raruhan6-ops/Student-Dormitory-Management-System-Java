package com.dormitory.service;

import com.dormitory.entity.*;
import com.dormitory.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Service for handling room/bed bookings with proper concurrency control.
 * 
 * CONCURRENCY SAFETY:
 * - Uses pessimistic locking (SELECT FOR UPDATE) when reading bed for modification
 * - Uses optimistic locking (@Version) as a fallback safety mechanism
 * - All booking operations are wrapped in SERIALIZABLE transactions
 * - Atomic status updates prevent race conditions
 * 
 * This ensures that two students CANNOT book the same bed simultaneously.
 */
@Service
public class RoomBookingService {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CheckInOutRepository checkInOutRepository;

    @Autowired
    private RoomApplicationRepository roomApplicationRepository;

    @Autowired
    private DormBuildingRepository buildingRepository;

    /**
     * Result object for booking operations
     */
    public static class BookingResult {
        private final boolean success;
        private final String message;
        private final String errorCode;

        private BookingResult(boolean success, String message, String errorCode) {
            this.success = success;
            this.message = message;
            this.errorCode = errorCode;
        }

        public static BookingResult success(String message) {
            return new BookingResult(true, message, null);
        }

        public static BookingResult failure(String message, String errorCode) {
            return new BookingResult(false, message, errorCode);
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public String getErrorCode() { return errorCode; }
    }

    /**
     * Reserve a bed for a student's application.
     * Uses pessimistic locking to prevent concurrent reservations.
     * 
     * @param studentID The student applying
     * @param bedID The bed to reserve
     * @return BookingResult indicating success or failure with reason
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public BookingResult reserveBedForApplication(String studentID, Integer bedID) {
        try {
            // Acquire pessimistic write lock on the bed row
            // This blocks other transactions from reading/modifying until we commit
            Bed bed = entityManager.find(Bed.class, bedID, LockModeType.PESSIMISTIC_WRITE);
            
            if (bed == null) {
                return BookingResult.failure("Bed not found", "BED_NOT_FOUND");
            }

            // Check bed availability while holding the lock
            if (!"Available".equalsIgnoreCase(bed.getStatus())) {
                return BookingResult.failure(
                    "This bed is no longer available. Someone else may have just booked it.",
                    "BED_NOT_AVAILABLE"
                );
            }

            // Check if student already has a pending application
            boolean hasPending = roomApplicationRepository.existsByStudentIDAndStatus(studentID, "Pending");
            if (hasPending) {
                return BookingResult.failure(
                    "You already have a pending room application",
                    "EXISTING_APPLICATION"
                );
            }

            // Mark bed as Reserved (not fully occupied yet, pending approval)
            // This prevents other students from applying for the same bed
            bed.setStatus("Reserved");
            bedRepository.save(bed);

            // Create the application
            RoomApplication application = new RoomApplication();
            application.setStudentID(studentID);
            application.setBedID(bedID);
            application.setStatus("Pending");
            application.setApplyTime(LocalDateTime.now());
            roomApplicationRepository.save(application);

            return BookingResult.success("Application submitted successfully");

        } catch (ObjectOptimisticLockingFailureException e) {
            // Another transaction modified the bed concurrently
            return BookingResult.failure(
                "This bed was just modified by another request. Please try again.",
                "CONCURRENT_MODIFICATION"
            );
        } catch (Exception e) {
            return BookingResult.failure(
                "An error occurred while processing your application: " + e.getMessage(),
                "SYSTEM_ERROR"
            );
        }
    }

    /**
     * Approve a room application and check in the student.
     * Uses pessimistic locking to ensure atomic bed assignment.
     * 
     * @param applicationID The application to approve
     * @param approverUsername Who is approving
     * @return BookingResult indicating success or failure
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public BookingResult approveApplicationAndCheckIn(Integer applicationID, String approverUsername) {
        try {
            // Get application
            RoomApplication application = roomApplicationRepository.findById(applicationID).orElse(null);
            if (application == null) {
                return BookingResult.failure("Application not found", "APPLICATION_NOT_FOUND");
            }

            if (!"Pending".equals(application.getStatus())) {
                return BookingResult.failure(
                    "This application has already been processed",
                    "ALREADY_PROCESSED"
                );
            }

            // Acquire pessimistic lock on the bed
            Bed bed = entityManager.find(Bed.class, application.getBedID(), LockModeType.PESSIMISTIC_WRITE);
            if (bed == null) {
                return BookingResult.failure("Bed no longer exists", "BED_NOT_FOUND");
            }

            // Bed should be either Reserved (by this application) or Available
            // It should NOT be Occupied
            if ("Occupied".equalsIgnoreCase(bed.getStatus())) {
                // Someone else already has this bed - reject the application
                application.setStatus("Rejected");
                application.setProcessTime(LocalDateTime.now());
                application.setProcessedBy(approverUsername);
                application.setRejectReason("Bed is no longer available");
                roomApplicationRepository.save(application);
                return BookingResult.failure(
                    "This bed has already been assigned to another student",
                    "BED_OCCUPIED"
                );
            }

            // Get related entities
            Room room = roomRepository.findById(bed.getRoomID()).orElse(null);
            if (room == null) {
                return BookingResult.failure("Room not found", "ROOM_NOT_FOUND");
            }

            DormBuilding building = buildingRepository.findById(room.getBuildingID()).orElse(null);
            if (building == null) {
                return BookingResult.failure("Building not found", "BUILDING_NOT_FOUND");
            }

            Student student = studentRepository.findById(application.getStudentID()).orElse(null);
            if (student == null) {
                return BookingResult.failure("Student not found", "STUDENT_NOT_FOUND");
            }

            // Perform atomic check-in
            // 1. Update bed status to Occupied
            bed.setStatus("Occupied");
            bedRepository.save(bed);

            // 2. Update room occupancy
            room.setCurrentOccupancy(room.getCurrentOccupancy() + 1);
            roomRepository.save(room);

            // 3. Update student record
            student.setDormBuilding(building.getBuildingName());
            student.setRoomNumber(room.getRoomNumber());
            student.setBedNumber(bed.getBedNumber());
            studentRepository.save(student);

            // 4. Create check-in record
            CheckInOut checkInOut = new CheckInOut();
            checkInOut.setStudentID(student.getStudentID());
            checkInOut.setBedID(bed.getBedID());
            checkInOut.setCheckInDate(LocalDate.now());
            checkInOut.setStatus("CurrentlyLiving");
            checkInOutRepository.save(checkInOut);

            // 5. Update application status
            application.setStatus("Approved");
            application.setProcessTime(LocalDateTime.now());
            application.setProcessedBy(approverUsername);
            roomApplicationRepository.save(application);

            return BookingResult.success(String.format(
                "Student %s successfully checked in to %s Room %s Bed %s",
                student.getName(), building.getBuildingName(), room.getRoomNumber(), bed.getBedNumber()
            ));

        } catch (ObjectOptimisticLockingFailureException e) {
            return BookingResult.failure(
                "Concurrent modification detected. Please try again.",
                "CONCURRENT_MODIFICATION"
            );
        } catch (Exception e) {
            return BookingResult.failure(
                "Error approving application: " + e.getMessage(),
                "SYSTEM_ERROR"
            );
        }
    }

    /**
     * Reject an application and release the reserved bed.
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public BookingResult rejectApplication(Integer applicationID, String rejectReason, String rejectorUsername) {
        try {
            RoomApplication application = roomApplicationRepository.findById(applicationID).orElse(null);
            if (application == null) {
                return BookingResult.failure("Application not found", "APPLICATION_NOT_FOUND");
            }

            if (!"Pending".equals(application.getStatus())) {
                return BookingResult.failure(
                    "This application has already been processed",
                    "ALREADY_PROCESSED"
                );
            }

            // Get bed with lock
            Bed bed = entityManager.find(Bed.class, application.getBedID(), LockModeType.PESSIMISTIC_WRITE);
            
            // If bed was reserved for this application, make it available again
            if (bed != null && "Reserved".equalsIgnoreCase(bed.getStatus())) {
                bed.setStatus("Available");
                bedRepository.save(bed);
            }

            // Update application
            application.setStatus("Rejected");
            application.setProcessTime(LocalDateTime.now());
            application.setProcessedBy(rejectorUsername);
            application.setRejectReason(rejectReason != null ? rejectReason : "Application rejected by manager");
            roomApplicationRepository.save(application);

            return BookingResult.success("Application rejected");

        } catch (Exception e) {
            return BookingResult.failure(
                "Error rejecting application: " + e.getMessage(),
                "SYSTEM_ERROR"
            );
        }
    }

    /**
     * Direct bed booking (for admin/manager direct check-in without application).
     * Uses atomic update to prevent race conditions.
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public BookingResult directCheckIn(String studentID, Integer bedID) {
        try {
            // Atomic update - only succeeds if bed is Available
            int rowsUpdated = bedRepository.occupyBed(bedID);
            
            if (rowsUpdated == 0) {
                return BookingResult.failure(
                    "Bed is not available. It may have been booked by someone else.",
                    "BED_NOT_AVAILABLE"
                );
            }

            // Bed is now occupied, proceed with check-in
            Bed bed = bedRepository.findById(bedID).orElse(null);
            Room room = roomRepository.findById(bed.getRoomID()).orElse(null);
            DormBuilding building = buildingRepository.findById(room.getBuildingID()).orElse(null);
            Student student = studentRepository.findById(studentID).orElse(null);

            if (student == null) {
                // Rollback - release the bed
                bed.setStatus("Available");
                bedRepository.save(bed);
                return BookingResult.failure("Student not found", "STUDENT_NOT_FOUND");
            }

            // Update room occupancy
            room.setCurrentOccupancy(room.getCurrentOccupancy() + 1);
            roomRepository.save(room);

            // Update student
            student.setDormBuilding(building.getBuildingName());
            student.setRoomNumber(room.getRoomNumber());
            student.setBedNumber(bed.getBedNumber());
            studentRepository.save(student);

            // Create check-in record
            CheckInOut checkInOut = new CheckInOut();
            checkInOut.setStudentID(studentID);
            checkInOut.setBedID(bedID);
            checkInOut.setCheckInDate(LocalDate.now());
            checkInOut.setStatus("CurrentlyLiving");
            checkInOutRepository.save(checkInOut);

            return BookingResult.success("Check-in successful");

        } catch (Exception e) {
            return BookingResult.failure(
                "Error during check-in: " + e.getMessage(),
                "SYSTEM_ERROR"
            );
        }
    }
}
