package com.dormitory.config;

import com.dormitory.entity.Student;
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
    CommandLineRunner initDatabase(StudentRepository repository) {
        return args -> {
            if (repository.count() == 0) {
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
                            Student student = new Student();
                            student.setStudentID(data[0].trim());
                            student.setName(data[1].trim());
                            student.setGender(data[2].trim());
                            student.setMajor(data[3].trim());
                            student.setStudentClass(data[4].trim());
                            student.setEnrollmentYear(Integer.parseInt(data[5].trim()));
                            student.setPhone(data[6].trim());
                            student.setDormBuilding(data[7].trim());
                            student.setRoomNumber(data[8].trim());
                            student.setBedNumber(data[9].trim());
                            
                            repository.save(student);
                        }
                    }
                    System.out.println("Database initialized with Chinese dataset.");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        };
    }
}
