package com.dormitory.service;

import com.dormitory.entity.RepairRequest;
import com.dormitory.entity.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.email.from:noreply@dormitory.edu}")
    private String fromEmail;

    /**
     * Send check-in confirmation email to student
     */
    @Async
    public void sendCheckInNotification(Student student, String building, String room, String bed) {
        if (!emailEnabled || student.getEmail() == null || student.getEmail().isBlank()) {
            System.out.println("[Email] Check-in notification skipped (email disabled or no email): " + student.getStudentID());
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(student.getEmail());
            message.setSubject("Dormitory Check-In Confirmation");
            message.setText(String.format("""
                Dear %s,

                You have been successfully checked into the dormitory.

                Assignment Details:
                - Building: %s
                - Room: %s
                - Bed: %s

                If you have any questions, please contact the dormitory management office.

                Best regards,
                Dormitory Management System
                """, student.getName(), building, room, bed));

            mailSender.send(message);
            System.out.println("[Email] Check-in notification sent to: " + student.getEmail());
        } catch (Exception e) {
            System.err.println("[Email] Failed to send check-in notification: " + e.getMessage());
        }
    }

    /**
     * Send check-out confirmation email to student
     */
    @Async
    public void sendCheckOutNotification(Student student) {
        if (!emailEnabled || student.getEmail() == null || student.getEmail().isBlank()) {
            System.out.println("[Email] Check-out notification skipped (email disabled or no email): " + student.getStudentID());
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(student.getEmail());
            message.setSubject("Dormitory Check-Out Confirmation");
            message.setText(String.format("""
                Dear %s,

                You have been successfully checked out from the dormitory.

                Thank you for staying with us. If you need to check in again, please contact the dormitory management office.

                Best regards,
                Dormitory Management System
                """, student.getName()));

            mailSender.send(message);
            System.out.println("[Email] Check-out notification sent to: " + student.getEmail());
        } catch (Exception e) {
            System.err.println("[Email] Failed to send check-out notification: " + e.getMessage());
        }
    }

    /**
     * Send repair request submission confirmation
     */
    @Async
    public void sendRepairRequestSubmitted(Student student, RepairRequest request) {
        if (!emailEnabled || student.getEmail() == null || student.getEmail().isBlank()) {
            System.out.println("[Email] Repair submission notification skipped: " + student.getStudentID());
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(student.getEmail());
            message.setSubject("Repair Request Submitted - #" + request.getRepairID());
            message.setText(String.format("""
                Dear %s,

                Your repair request has been submitted successfully.

                Request Details:
                - Request ID: %d
                - Description: %s
                - Status: Pending

                We will process your request as soon as possible. You will receive another email when there's an update.

                Best regards,
                Dormitory Management System
                """, student.getName(), request.getRepairID(), request.getDescription()));

            mailSender.send(message);
            System.out.println("[Email] Repair request notification sent to: " + student.getEmail());
        } catch (Exception e) {
            System.err.println("[Email] Failed to send repair request notification: " + e.getMessage());
        }
    }

    /**
     * Send repair request status update notification
     */
    @Async
    public void sendRepairStatusUpdate(Student student, RepairRequest request, String oldStatus, String newStatus) {
        if (!emailEnabled || student.getEmail() == null || student.getEmail().isBlank()) {
            System.out.println("[Email] Repair status update notification skipped: " + student.getStudentID());
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(student.getEmail());
            message.setSubject("Repair Request Update - #" + request.getRepairID());
            message.setText(String.format("""
                Dear %s,

                Your repair request status has been updated.

                Request Details:
                - Request ID: %d
                - Description: %s
                - Previous Status: %s
                - New Status: %s

                %s

                Best regards,
                Dormitory Management System
                """, 
                student.getName(), 
                request.getRepairID(), 
                request.getDescription(),
                oldStatus,
                newStatus,
                newStatus.equalsIgnoreCase("Finished") ? "Your repair has been completed. Thank you for your patience!" : "We are working on your request."
            ));

            mailSender.send(message);
            System.out.println("[Email] Repair status update sent to: " + student.getEmail());
        } catch (Exception e) {
            System.err.println("[Email] Failed to send repair status update: " + e.getMessage());
        }
    }
}
