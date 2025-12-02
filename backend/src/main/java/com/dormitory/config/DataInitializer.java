package com.dormitory.config;

import com.dormitory.entity.Bed;
import com.dormitory.entity.DormBuilding;
import com.dormitory.entity.Room;
import com.dormitory.entity.Student;
import com.dormitory.repository.BedRepository;
import com.dormitory.repository.DormBuildingRepository;
import com.dormitory.repository.RoomRepository;
import com.dormitory.repository.StudentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(StudentRepository studentRepository,
                                   DormBuildingRepository buildingRepository,
                                   RoomRepository roomRepository,
                                   BedRepository bedRepository) {
        return args -> {
            if (studentRepository.count() == 0) {
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
                            // 1. Save Student
                            Student student = new Student();
                            student.setStudentID(data[0].trim());
                            student.setName(data[1].trim());
                            student.setGender(data[2].trim());
                            student.setMajor(data[3].trim());
                            student.setStudentClass(data[4].trim());
                            student.setEnrollmentYear(Integer.parseInt(data[5].trim()));
                            student.setPhone(data[6].trim());
                            String buildingName = data[7].trim();
                            String roomNumber = data[8].trim();
                            String bedNumber = data[9].trim();
                            
                            student.setDormBuilding(buildingName);
                            student.setRoomNumber(roomNumber);
                            student.setBedNumber(bedNumber);
                            
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
                            Bed bed = bedRepository.findByRoomIDAndBedNumber(room.getRoomID(), bedNumber);
                            if (bed == null) {
                                bed = new Bed();
                                bed.setRoomID(room.getRoomID());
                                bed.setBedNumber(bedNumber);
                                bed.setStatus("Occupied");
                                bedRepository.save(bed);
                                
                                // Update room occupancy
                                room.setCurrentOccupancy(room.getCurrentOccupancy() + 1);
                                roomRepository.save(room);
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
}
