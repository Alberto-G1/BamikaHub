package com.bamikahub.inventorysystem.services.operations;

import com.bamikahub.inventorysystem.models.operations.DailyFieldReport;
import com.lowagie.text.*;
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
public class FieldReportExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public byte[] exportAsExcel(List<DailyFieldReport> reports) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Field Reports");
            String[] headers = {
                    "Project", "Site", "Location", "Report Date", "Submitted By",
                    "Weather", "Work Progress Update", "Materials Used", "Challenges", "Attachment"
            };

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
            for (DailyFieldReport r : reports) {
                Row row = sheet.createRow(rowIdx++);
                String projectName = r.getProject() != null ? r.getProject().getName() : "";
                String siteName = r.getSite() != null ? r.getSite().getName() : "Whole Project";
                String siteLocation = r.getSite() != null ? (r.getSite().getLocation() != null ? r.getSite().getLocation() : "") : "";
                String reportDate = r.getReportDate() != null ? DATE_FORMATTER.format(r.getReportDate()) : "";
                String submittedBy = r.getSubmittedBy() != null ? r.getSubmittedBy().getUsername() : "";
                String weather = r.getWeatherConditions() != null ? r.getWeatherConditions() : "";
                String progress = r.getWorkProgressUpdate() != null ? r.getWorkProgressUpdate() : "";
                String materials = r.getMaterialsUsed() != null ? r.getMaterialsUsed() : "";
                String challenges = r.getChallengesFaced() != null ? r.getChallengesFaced() : "";
                String attachment = r.getReportFileUrl() != null ? r.getReportFileUrl() : "";

                row.createCell(0).setCellValue(projectName);
                row.createCell(1).setCellValue(siteName);
                row.createCell(2).setCellValue(siteLocation);
                row.createCell(3).setCellValue(reportDate);
                row.createCell(4).setCellValue(submittedBy);
                row.createCell(5).setCellValue(weather);
                row.createCell(6).setCellValue(progress);
                row.createCell(7).setCellValue(materials);
                row.createCell(8).setCellValue(challenges);
                row.createCell(9).setCellValue(attachment);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to export field reports to Excel", e);
        }
    }

    public byte[] exportAsPdf(List<DailyFieldReport> reports) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph("Field Reports", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16)));
            document.add(new Paragraph(" "));

            // Use a concise table to keep PDF readable
            Table table = new Table(7);
            table.addCell("Project");
            table.addCell("Site");
            table.addCell("Location");
            table.addCell("Report Date");
            table.addCell("Submitted By");
            table.addCell("Weather");
            table.addCell("Summary");

            for (DailyFieldReport r : reports) {
                table.addCell(r.getProject() != null ? r.getProject().getName() : "");
                table.addCell(r.getSite() != null ? r.getSite().getName() : "Whole Project");
                table.addCell(r.getSite() != null && r.getSite().getLocation() != null ? r.getSite().getLocation() : "");
                table.addCell(r.getReportDate() != null ? DATE_FORMATTER.format(r.getReportDate()) : "");
                table.addCell(r.getSubmittedBy() != null ? r.getSubmittedBy().getUsername() : "");
                table.addCell(r.getWeatherConditions() != null ? r.getWeatherConditions() : "");
                // A brief summary of progress to keep cell sizes reasonable
                String summary = r.getWorkProgressUpdate() != null && r.getWorkProgressUpdate().length() > 120
                        ? r.getWorkProgressUpdate().substring(0, 117) + "..." : (r.getWorkProgressUpdate() != null ? r.getWorkProgressUpdate() : "");
                table.addCell(summary);
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (DocumentException | IOException e) {
            throw new RuntimeException("Failed to export field reports to PDF", e);
        }
    }
}
