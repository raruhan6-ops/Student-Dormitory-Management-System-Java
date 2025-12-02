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

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(StudentRepository studentRepository,
                                   DormBuildingRepository buildingRepository,
                                   RoomRepository roomRepository,
                                   BedRepository bedRepository,
                                   UserAccountRepository userAccountRepository) {
        return args -> {
            // Run if we have fewer than 10 students (implies only defaults exist)
            if (studentRepository.count() < 10) {
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
                                    
                                    // Update room occupancy
                                    room.setCurrentOccupancy(room.getCurrentOccupancy() + 1);
                                    roomRepository.save(room);
                                }
                            }
                            
                            // 5. Create UserAccount
                            if (userAccountRepository.findByUsername(studentId).isEmpty()) {
                                UserAccount user = new UserAccount();
                                user.setUsername(studentId);
                                user.setPasswordHash(hashPassword("student123"));
                                user.setRole("Student");
                                user.setRelatedStudentID(studentId);
                                userAccountRepository.save(user);
                            }
                        }
                    }
                    System.out.println("Database initialized with Chinese dataset and relational tables.");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        };
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
