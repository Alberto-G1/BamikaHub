package com.bamikahub.inventorysystem.services.support;

import com.bamikahub.inventorysystem.models.support.SupportTicket;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Table;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class TicketExportService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public byte[] exportAsExcel(List<SupportTicket> tickets) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Support Tickets");
            String[] headers = {"ID", "Subject", "Priority", "Status", "Category", "Assigned To", "Submitted By", "Created At", "Response Due", "Resolution Due", "SLA Breached"};

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (SupportTicket ticket : tickets) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue("TICKET-" + String.format("%04d", ticket.getId()));
                row.createCell(1).setCellValue(ticket.getSubject());
                row.createCell(2).setCellValue(ticket.getPriority().name());
                row.createCell(3).setCellValue(ticket.getStatus().name());
                row.createCell(4).setCellValue(ticket.getCategory() != null ? ticket.getCategory().getName() : "");
                row.createCell(5).setCellValue(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getUsername() : "Unassigned");
                row.createCell(6).setCellValue(ticket.getSubmittedBy() != null ? ticket.getSubmittedBy().getUsername() : "Unknown");
                row.createCell(7).setCellValue(ticket.getCreatedAt() != null ? DATE_TIME_FORMATTER.format(ticket.getCreatedAt()) : "");
                row.createCell(8).setCellValue(ticket.getResponseDueAt() != null ? DATE_TIME_FORMATTER.format(ticket.getResponseDueAt()) : "");
                row.createCell(9).setCellValue(ticket.getResolutionDueAt() != null ? DATE_TIME_FORMATTER.format(ticket.getResolutionDueAt()) : "");
                row.createCell(10).setCellValue(ticket.isResolutionBreached() ? "YES" : "NO");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to export tickets to Excel", e);
        }
    }

    public byte[] exportAsPdf(List<SupportTicket> tickets) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph("Support Ticket Report", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16)));
            document.add(new Paragraph(" "));

            Table table = new Table(8);
            table.addCell("ID");
            table.addCell("Subject");
            table.addCell("Priority");
            table.addCell("Status");
            table.addCell("Category");
            table.addCell("Assigned To");
            table.addCell("Submitted By");
            table.addCell("Created At");

            for (SupportTicket ticket : tickets) {
                table.addCell("TICKET-" + String.format("%04d", ticket.getId()));
                table.addCell(ticket.getSubject());
                table.addCell(ticket.getPriority().name());
                table.addCell(ticket.getStatus().name());
                table.addCell(ticket.getCategory() != null ? ticket.getCategory().getName() : "");
                table.addCell(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getUsername() : "Unassigned");
                table.addCell(ticket.getSubmittedBy() != null ? ticket.getSubmittedBy().getUsername() : "Unknown");
                table.addCell(ticket.getCreatedAt() != null ? DATE_TIME_FORMATTER.format(ticket.getCreatedAt()) : "");
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (DocumentException | IOException e) {
            throw new RuntimeException("Failed to export tickets to PDF", e);
        }
    }
}
