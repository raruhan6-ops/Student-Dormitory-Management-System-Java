package com.dormitory.controller;

import com.dormitory.entity.Student;
import com.dormitory.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*") // Allow requests from any frontend for development
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @PostMapping
    public Student createStudent(@RequestBody Student student) {
        return studentRepository.save(student);
    }

    @GetMapping("/{id}")
    public Student getStudentById(@PathVariable String id) {
        return studentRepository.findById(id).orElse(null);
    }

    @PutMapping("/{id}")
    public Student updateStudent(@PathVariable String id, @RequestBody Student studentDetails) {
        return studentRepository.findById(id).map(student -> {
            student.setName(studentDetails.getName());
            student.setGender(studentDetails.getGender());
            student.setMajor(studentDetails.getMajor());
            student.setStudentClass(studentDetails.getStudentClass());
            student.setPhone(studentDetails.getPhone());
            student.setEnrollmentYear(studentDetails.getEnrollmentYear());
            student.setDormBuilding(studentDetails.getDormBuilding());
            student.setRoomNumber(studentDetails.getRoomNumber());
            student.setBedNumber(studentDetails.getBedNumber());
            return studentRepository.save(student);
        }).orElse(null);
    }

    @DeleteMapping("/{id}")
    public void deleteStudent(@PathVariable String id) {
        studentRepository.deleteById(id);
    }
}
