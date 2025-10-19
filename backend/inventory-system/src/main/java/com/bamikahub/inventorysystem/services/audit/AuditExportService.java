package com.bamikahub.inventorysystem.services.audit;

import com.bamikahub.inventorysystem.dto.audit.AuditLogDto;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service for exporting audit logs to various formats
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditExportService {

    /**
     * Export audit logs to CSV format
     */
    public byte[] exportToCsv(List<AuditLogDto> logs) {
        StringBuilder csv = new StringBuilder();
        
        // CSV Header
        csv.append("ID,Timestamp,Actor,Email,Action,Severity,Entity Type,Entity ID,Entity Name,IP Address,Details\n");
        
        // CSV Rows
        for (AuditLogDto log : logs) {
            csv.append(escapeCsv(log.getId()))
                    .append(",")
                    .append(escapeCsv(log.getTimestamp()))
                    .append(",")
                    .append(escapeCsv(log.getActorName()))
                    .append(",")
                    .append(escapeCsv(log.getActorEmail()))
                    .append(",")
                    .append(escapeCsv(log.getAction()))
                    .append(",")
                    .append(escapeCsv(log.getSeverity()))
                    .append(",")
                    .append(escapeCsv(log.getEntityType()))
                    .append(",")
                    .append(escapeCsv(log.getEntityId()))
                    .append(",")
                    .append(escapeCsv(log.getEntityName()))
                    .append(",")
                    .append(escapeCsv(log.getIpAddress()))
                    .append(",")
                    .append(escapeCsv(log.getDetails()))
                    .append("\n");
        }
        
        return csv.toString().getBytes();
    }

    /**
     * Export audit logs to Excel format
     */
    public byte[] exportToExcel(List<AuditLogDto> logs) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Audit Logs");
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = createHeaderStyle(workbook);
            
            String[] headers = {"ID", "Timestamp", "Actor", "Email", "Action", "Severity", 
                              "Entity Type", "Entity ID", "Entity Name", "IP Address", "Details"};
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Create data rows
            int rowNum = 1;
            for (AuditLogDto log : logs) {
                Row row = sheet.createRow(rowNum++);
                
                row.createCell(0).setCellValue(log.getId() != null ? log.getId() : 0);
                row.createCell(1).setCellValue(log.getTimestamp() != null ? log.getTimestamp() : "");
                row.createCell(2).setCellValue(log.getActorName() != null ? log.getActorName() : "");
                row.createCell(3).setCellValue(log.getActorEmail() != null ? log.getActorEmail() : "");
                row.createCell(4).setCellValue(log.getAction() != null ? log.getAction() : "");
                row.createCell(5).setCellValue(log.getSeverity() != null ? log.getSeverity() : "");
                row.createCell(6).setCellValue(log.getEntityType() != null ? log.getEntityType() : "");
                row.createCell(7).setCellValue(log.getEntityId() != null ? log.getEntityId() : 0);
                row.createCell(8).setCellValue(log.getEntityName() != null ? log.getEntityName() : "");
                row.createCell(9).setCellValue(log.getIpAddress() != null ? log.getIpAddress() : "");
                row.createCell(10).setCellValue(log.getDetails() != null ? log.getDetails() : "");
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
     * Export audit logs to PDF format
     */
    public byte[] exportToPdf(List<AuditLogDto> logs) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            
            document.open();
            
            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Paragraph title = new Paragraph("Audit Log Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);
            
            // Generated date
            Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Paragraph date = new Paragraph("Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), dateFont);
            date.setAlignment(Element.ALIGN_CENTER);
            date.setSpacingAfter(20);
            document.add(date);
            
            // Table
            PdfPTable table = new PdfPTable(8); // 8 columns
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);
            
            // Set column widths
            float[] columnWidths = {1f, 2.5f, 2f, 2f, 2f, 1.5f, 2f, 2f};
            table.setWidths(columnWidths);
            
            // Header cells
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
            addTableHeader(table, "ID", headerFont);
            addTableHeader(table, "Timestamp", headerFont);
            addTableHeader(table, "Actor", headerFont);
            addTableHeader(table, "Action", headerFont);
            addTableHeader(table, "Severity", headerFont);
            addTableHeader(table, "Entity Type", headerFont);
            addTableHeader(table, "Entity Name", headerFont);
            addTableHeader(table, "IP Address", headerFont);
            
            // Data rows
            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
            for (AuditLogDto log : logs) {
                addTableCell(table, String.valueOf(log.getId()), cellFont);
                addTableCell(table, log.getTimestamp() != null ? log.getTimestamp().substring(0, 19) : "", cellFont);
                addTableCell(table, log.getActorName() != null ? log.getActorName() : "", cellFont);
                addTableCell(table, log.getAction() != null ? log.getAction() : "", cellFont);
                addTableCell(table, log.getSeverity() != null ? log.getSeverity() : "", cellFont);
                addTableCell(table, log.getEntityType() != null ? log.getEntityType() : "", cellFont);
                addTableCell(table, log.getEntityName() != null ? log.getEntityName() : "", cellFont);
                addTableCell(table, log.getIpAddress() != null ? log.getIpAddress() : "", cellFont);
            }
            
            document.add(table);
            
            // Footer
            Paragraph footer = new Paragraph("Total Records: " + logs.size(), dateFont);
            footer.setAlignment(Element.ALIGN_RIGHT);
            footer.setSpacingBefore(10);
            document.add(footer);
            
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF export", e);
            throw new RuntimeException("PDF export failed", e);
        }
    }

    /**
     * Helper: Escape CSV values
     */
    private String escapeCsv(Object value) {
        if (value == null) {
            return "";
        }
        String str = value.toString();
        if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }

    /**
     * Helper: Create Excel header style
     */
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    /**
     * Helper: Add PDF table header cell
     */
    private void addTableHeader(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(new Color(200, 200, 200));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(5);
        table.addCell(cell);
    }

    /**
     * Helper: Add PDF table cell
     */
    private void addTableCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        table.addCell(cell);
    }
}
