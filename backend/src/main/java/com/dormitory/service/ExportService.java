package com.dormitory.service;

import com.dormitory.entity.RepairRequest;
import com.dormitory.entity.Student;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

/**
 * Service for exporting data to Excel and PDF formats.
 * Supports Student and Repair Request data exports.
 */
@Service
public class ExportService {

    // ==================== EXCEL EXPORTS ====================

    /**
     * Export students to Excel (.xlsx) format
     */
    public byte[] exportStudentsToExcel(List<Student> students) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Students");

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Create data style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Student ID", "Name", "Gender", "Major", "Class", "Enrollment Year", "Phone", "Email", "Building", "Room", "Bed"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (Student s : students) {
                Row row = sheet.createRow(rowNum++);
                createCell(row, 0, s.getStudentID(), dataStyle);
                createCell(row, 1, s.getName(), dataStyle);
                createCell(row, 2, s.getGender(), dataStyle);
                createCell(row, 3, s.getMajor(), dataStyle);
                createCell(row, 4, s.getStudentClass(), dataStyle);
                createCell(row, 5, s.getEnrollmentYear() != null ? s.getEnrollmentYear().toString() : "", dataStyle);
                createCell(row, 6, s.getPhone(), dataStyle);
                createCell(row, 7, s.getEmail(), dataStyle);
                createCell(row, 8, s.getDormBuilding(), dataStyle);
                createCell(row, 9, s.getRoomNumber(), dataStyle);
                createCell(row, 10, s.getBedNumber(), dataStyle);
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Export repair requests to Excel (.xlsx) format
     */
    public byte[] exportRepairsToExcel(List<RepairRequest> repairs) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Repair Requests");

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Create data style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Repair ID", "Room ID", "Submitter ID", "Description", "Status", "Handler", "Submit Time", "Finish Time"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (RepairRequest r : repairs) {
                Row row = sheet.createRow(rowNum++);
                createCell(row, 0, r.getRepairID() != null ? r.getRepairID().toString() : "", dataStyle);
                createCell(row, 1, r.getRoomID() != null ? r.getRoomID().toString() : "", dataStyle);
                createCell(row, 2, r.getSubmitterStudentID(), dataStyle);
                createCell(row, 3, r.getDescription(), dataStyle);
                createCell(row, 4, r.getStatus(), dataStyle);
                createCell(row, 5, r.getHandler(), dataStyle);
                createCell(row, 6, r.getSubmitTime() != null ? r.getSubmitTime().toString() : "", dataStyle);
                createCell(row, 7, r.getFinishTime() != null ? r.getFinishTime().toString() : "", dataStyle);
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void createCell(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    // ==================== PDF EXPORTS ====================

    /**
     * Export students to PDF format
     */
    public byte[] exportStudentsToPdf(List<Student> students) throws DocumentException, IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate()); // Landscape for more columns
            PdfWriter.getInstance(document, out);
            document.open();

            // Title
            com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Paragraph title = new Paragraph("Student List Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Subtitle with timestamp
            com.lowagie.text.Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Paragraph subtitle = new Paragraph("Generated: " + java.time.LocalDateTime.now().toString(), subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Table
            PdfPTable table = new PdfPTable(9); // 9 columns
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 1.5f, 0.8f, 1.5f, 1f, 0.8f, 1.2f, 1f, 0.7f});

            // Header
            addTableHeader(table, new String[]{"Student ID", "Name", "Gender", "Major", "Class", "Year", "Phone", "Building", "Room"});

            // Data
            com.lowagie.text.Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (Student s : students) {
                addCell(table, s.getStudentID(), dataFont);
                addCell(table, s.getName(), dataFont);
                addCell(table, s.getGender(), dataFont);
                addCell(table, s.getMajor(), dataFont);
                addCell(table, s.getStudentClass(), dataFont);
                addCell(table, s.getEnrollmentYear() != null ? s.getEnrollmentYear().toString() : "", dataFont);
                addCell(table, s.getPhone(), dataFont);
                addCell(table, s.getDormBuilding(), dataFont);
                addCell(table, s.getRoomNumber(), dataFont);
            }

            document.add(table);

            // Footer
            Paragraph footer = new Paragraph("Total Students: " + students.size(), subtitleFont);
            footer.setSpacingBefore(20);
            document.add(footer);

            document.close();
            return out.toByteArray();
        }
    }

    /**
     * Export repair requests to PDF format
     */
    public byte[] exportRepairsToPdf(List<RepairRequest> repairs) throws DocumentException, IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            // Title
            com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Paragraph title = new Paragraph("Repair Requests Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Subtitle
            com.lowagie.text.Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Paragraph subtitle = new Paragraph("Generated: " + java.time.LocalDateTime.now().toString(), subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Statistics
            long pending = repairs.stream().filter(r -> "Pending".equals(r.getStatus())).count();
            long finished = repairs.stream().filter(r -> "Finished".equals(r.getStatus())).count();
            Paragraph stats = new Paragraph(String.format("Pending: %d | Finished: %d | Total: %d", pending, finished, repairs.size()), subtitleFont);
            stats.setAlignment(Element.ALIGN_CENTER);
            stats.setSpacingAfter(15);
            document.add(stats);

            // Table
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{0.8f, 0.8f, 1.2f, 2.5f, 1f, 1.2f, 1.5f});

            // Header
            addTableHeader(table, new String[]{"ID", "Room", "Submitter", "Description", "Status", "Handler", "Submit Time"});

            // Data
            com.lowagie.text.Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (RepairRequest r : repairs) {
                addCell(table, r.getRepairID() != null ? r.getRepairID().toString() : "", dataFont);
                addCell(table, r.getRoomID() != null ? r.getRoomID().toString() : "", dataFont);
                addCell(table, r.getSubmitterStudentID(), dataFont);
                addCell(table, truncate(r.getDescription(), 50), dataFont);
                addCell(table, r.getStatus(), dataFont);
                addCell(table, r.getHandler(), dataFont);
                addCell(table, r.getSubmitTime() != null ? r.getSubmitTime().toLocalDate().toString() : "", dataFont);
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        }
    }

    private void addTableHeader(PdfPTable table, String[] headers) {
        com.lowagie.text.Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(new Color(63, 81, 181)); // Material blue
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setPadding(8);
            table.addCell(cell);
        }
    }

    private void addCell(PdfPTable table, String value, com.lowagie.text.Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(value != null ? value : "", font));
        cell.setPadding(5);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() > maxLength ? text.substring(0, maxLength) + "..." : text;
    }
}
