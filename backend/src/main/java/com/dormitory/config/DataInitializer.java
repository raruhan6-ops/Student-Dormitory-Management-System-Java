package com.dormitory.config;

import com.dormitory.entity.*;
import com.dormitory.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(StudentRepository studentRepository,
                                   DormBuildingRepository buildingRepository,
                                   RoomRepository roomRepository,
                                   BedRepository bedRepository,
                                   UserAccountRepository userAccountRepository) {
        return args -> {
            System.out.println("Checking data initialization...");
            try (BufferedReader br = new BufferedReader(new InputStreamReader(
                    new ClassPathResource("student_dormitory_dataset_chinese.csv").getInputStream(), StandardCharsets.UTF_8))) {
                
                String line;
                boolean firstLine = true;
                while ((line = br.readLine()) != null) {
                    if (firstLine) {
                        firstLine = false;
                        continue;
                    }
                    String[] data = line.split(",");
                    if (data.length >= 10) {
                        String studentId = data[0].trim();
                        
                        // 1. Save Student (Check existence)
                        if (!studentRepository.existsById(studentId)) {
                            Student student = new Student();
                            student.setStudentID(studentId);
                            student.setName(data[1].trim());
                            student.setGender(data[2].trim());
                            student.setMajor(data[3].trim());
                            student.setStudentClass(data[4].trim());
                            student.setEnrollmentYear(Integer.parseInt(data[5].trim()));
                            student.setPhone(data[6].trim());
                            String buildingName = data[7].trim();
                            String roomNumber = data[8].trim();
                            String bedNumber = data[9].trim();
                            String cleanBedNum = bedNumber.replace("号床", "").trim();
                            
                            student.setDormBuilding(buildingName);
                            student.setRoomNumber(roomNumber);
                            student.setBedNumber(cleanBedNum);
                            
                            studentRepository.save(student);

                            // 2. Handle DormBuilding
                            DormBuilding building = buildingRepository.findByBuildingName(buildingName);
                            if (building == null) {
                                building = new DormBuilding();
                                building.setBuildingName(buildingName);
                                building = buildingRepository.save(building);
                            }

                            // 3. Handle Room
                            Room room = roomRepository.findByBuildingIDAndRoomNumber(building.getBuildingID(), roomNumber);
                            if (room == null) {
                                room = new Room();
                                room.setBuildingID(building.getBuildingID());
                                room.setRoomNumber(roomNumber);
                                room.setCapacity(4); // Default capacity
                                room.setCurrentOccupancy(0);
                                room.setRoomType("Standard");
                                room = roomRepository.save(room);
                            }

                            // 4. Handle Bed
                            Bed bed = bedRepository.findByRoomIDAndBedNumber(room.getRoomID(), cleanBedNum);
                            if (bed == null) {
                                bed = new Bed();
                                bed.setRoomID(room.getRoomID());
                                bed.setBedNumber(cleanBedNum);
                                bed.setStatus("Occupied");
                                bedRepository.save(bed);
                            }
                        }
                        
                        // 5. Create UserAccount (ALWAYS CHECK THIS, even if student exists)
                        if (userAccountRepository.findByUsername(studentId).isEmpty()) {
                            UserAccount user = new UserAccount();
                            user.setUsername(studentId);
                            user.setPasswordHash(hashPassword("student123"));
                            user.setRole("Student");
                            user.setRelatedStudentID(studentId);
                            userAccountRepository.save(user);
                            System.out.println("Created user for student: " + studentId);
                        }
                    }
                }
                
                // Sync room occupancy with actual occupied beds count
                syncRoomOccupancy(roomRepository, bedRepository);
                
                System.out.println("Database initialization check complete.");
            } catch (Exception e) {
                System.err.println("Error initializing data: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }

    /**
     * Sync room occupancy counts with actual occupied bed counts.
     * This ensures data consistency between Room.currentOccupancy and actual Bed status.
     */
    private void syncRoomOccupancy(RoomRepository roomRepository, BedRepository bedRepository) {
        System.out.println("Syncing room occupancy data...");
        List<Room> allRooms = roomRepository.findAll();
        int updatedCount = 0;
        
        for (Room room : allRooms) {
            // Count occupied beds for this room
            List<Bed> beds = bedRepository.findByRoomID(room.getRoomID());
            int occupiedCount = (int) beds.stream()
                    .filter(b -> "Occupied".equalsIgnoreCase(b.getStatus()))
                    .count();
            
            // Update if different
            if (room.getCurrentOccupancy() == null || room.getCurrentOccupancy() != occupiedCount) {
                room.setCurrentOccupancy(occupiedCount);
                roomRepository.save(room);
                updatedCount++;
            }
        }
        
        if (updatedCount > 0) {
            System.out.println("Updated occupancy for " + updatedCount + " rooms.");
        } else {
            System.out.println("Room occupancy data is consistent.");
        }
    }

    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }
}
