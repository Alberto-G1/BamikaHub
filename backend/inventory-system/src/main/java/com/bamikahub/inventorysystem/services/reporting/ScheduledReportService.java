package com.bamikahub.inventorysystem.services.reporting;

import com.bamikahub.inventorysystem.dto.reporting.*;
import com.bamikahub.inventorysystem.services.mail.TemplateMailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Automated report generation and email delivery service.
 */
@Service
public class ScheduledReportService {

    @Autowired
    private ReportingService reportingService;

    @Autowired
    private TemplateMailService mailService;

    @Value("${reports.scheduled.enabled:false}")
    private boolean scheduledReportsEnabled;

    @Value("${reports.scheduled.recipients}")
    private String recipients;

    @Value("${notifications.mail.from}")
    private String fromAddress;

    /**
     * Weekly project summary report - Runs every Monday at 8:00 AM
     */
    @Scheduled(cron = "0 0 8 * * MON")
    public void sendWeeklyProjectSummary() {
        if (!scheduledReportsEnabled) {
            return;
        }

        try {
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusWeeks(1);

            ReportRequestDto request = ReportRequestDto.builder()
                    .startDate(startDate)
                    .endDate(endDate)
                    .aggregationLevel("WEEKLY")
                    .build();

            List<ProjectPerformanceDto> performance = reportingService.getProjectPerformance(request);
            TrendReportDto completionTrend = reportingService.getProjectCompletionTrend(request);

            String emailBody = buildProjectSummaryEmail(performance, completionTrend, startDate, endDate);

            for (String recipient : recipients.split(",")) {
                sendEmail(recipient.trim(), "Weekly Project Summary Report", emailBody);
            }

            System.out.println("Weekly project summary sent successfully");
        } catch (Exception e) {
            System.err.println("Failed to send weekly project summary: " + e.getMessage());
        }
    }

    /**
     * Monthly finance report - Runs on the 1st of every month at 9:00 AM
     */
    @Scheduled(cron = "0 0 9 1 * *")
    public void sendMonthlyFinanceReport() {
        if (!scheduledReportsEnabled) {
            return;
        }

        try {
            LocalDate endDate = LocalDate.now().minusDays(1);
            LocalDate startDate = endDate.withDayOfMonth(1);

            ReportRequestDto request = ReportRequestDto.builder()
                    .startDate(startDate)
                    .endDate(endDate)
                    .aggregationLevel("MONTHLY")
                    .build();

            List<RequisitionStatusDto> requisitionStatus = reportingService.getRequisitionsByStatus(request);
            TrendReportDto expenditureTrend = reportingService.getMonthlyExpenditureTrend(request);
            List<BudgetVsActualDto> budgetAnalysis = reportingService.getBudgetVsActual(request);

            String emailBody = buildFinanceReportEmail(requisitionStatus, expenditureTrend, budgetAnalysis, startDate, endDate);

            for (String recipient : recipients.split(",")) {
                sendEmail(recipient.trim(), "Monthly Finance Report", emailBody);
            }

            System.out.println("Monthly finance report sent successfully");
        } catch (Exception e) {
            System.err.println("Failed to send monthly finance report: " + e.getMessage());
        }
    }

    /**
     * Monthly support SLA report - Runs on the 1st of every month at 10:00 AM
     */
    @Scheduled(cron = "0 0 10 1 * *")
    public void sendMonthlySupportReport() {
        if (!scheduledReportsEnabled) {
            return;
        }

        try {
            LocalDate endDate = LocalDate.now().minusDays(1);
            LocalDate startDate = endDate.withDayOfMonth(1);

            ReportRequestDto request = ReportRequestDto.builder()
                    .startDate(startDate)
                    .endDate(endDate)
                    .aggregationLevel("MONTHLY")
                    .build();

            List<SlaComplianceDto> slaCompliance = reportingService.getSlaComplianceReport(request);
            TrendReportDto ticketVolume = reportingService.getTicketVolumeTrend(request);

            String emailBody = buildSupportReportEmail(slaCompliance, ticketVolume, startDate, endDate);

            for (String recipient : recipients.split(",")) {
                sendEmail(recipient.trim(), "Monthly Support & SLA Report", emailBody);
            }

            System.out.println("Monthly support report sent successfully");
        } catch (Exception e) {
            System.err.println("Failed to send monthly support report: " + e.getMessage());
        }
    }

    private String buildProjectSummaryEmail(List<ProjectPerformanceDto> performance,
                                             TrendReportDto trend,
                                             LocalDate startDate,
                                             LocalDate endDate) {
        StringBuilder sb = new StringBuilder();
        sb.append("<h2>Weekly Project Summary</h2>");
        sb.append("<p>Report Period: ").append(startDate).append(" to ").append(endDate).append("</p>");
        sb.append("<hr>");

        sb.append("<h3>Project Performance</h3>");
        sb.append("<table border='1' cellpadding='8' style='border-collapse: collapse;'>");
        sb.append("<tr><th>Project</th><th>Status</th><th>Completion %</th><th>Duration (Days)</th></tr>");
        for (ProjectPerformanceDto p : performance) {
            sb.append("<tr>")
                    .append("<td>").append(p.getProjectName()).append("</td>")
                    .append("<td>").append(p.getStatus()).append("</td>")
                    .append("<td>").append(p.getCompletionPercentage()).append("%</td>")
                    .append("<td>").append(p.getDurationDays() != null ? p.getDurationDays() : "N/A").append("</td>")
                    .append("</tr>");
        }
        sb.append("</table>");

        sb.append("<h3>Completion Trend</h3>");
        sb.append("<p>").append(trend.getSummary()).append("</p>");

        return sb.toString();
    }

    private String buildFinanceReportEmail(List<RequisitionStatusDto> requisitions,
                                            TrendReportDto expenditure,
                                            List<BudgetVsActualDto> budgetAnalysis,
                                            LocalDate startDate,
                                            LocalDate endDate) {
        StringBuilder sb = new StringBuilder();
        sb.append("<h2>Monthly Finance Report</h2>");
        sb.append("<p>Report Period: ").append(startDate).append(" to ").append(endDate).append("</p>");
        sb.append("<hr>");

        sb.append("<h3>Requisitions by Status</h3>");
        sb.append("<table border='1' cellpadding='8' style='border-collapse: collapse;'>");
        sb.append("<tr><th>Status</th><th>Count</th><th>Total Value</th><th>Average Value</th></tr>");
        for (RequisitionStatusDto r : requisitions) {
            sb.append("<tr>")
                    .append("<td>").append(r.getStatus()).append("</td>")
                    .append("<td>").append(r.getCount()).append("</td>")
                    .append("<td>UGX ").append(String.format("%,.2f", r.getTotalValue())).append("</td>")
                    .append("<td>UGX ").append(String.format("%,.2f", r.getAverageValue())).append("</td>")
                    .append("</tr>");
        }
        sb.append("</table>");

        sb.append("<h3>Expenditure Trend</h3>");
        sb.append("<p>").append(expenditure.getSummary()).append("</p>");

        sb.append("<h3>Budget vs Actual</h3>");
        sb.append("<table border='1' cellpadding='8' style='border-collapse: collapse;'>");
        sb.append("<tr><th>Project</th><th>Budget</th><th>Actual</th><th>Variance</th><th>Status</th></tr>");
        for (BudgetVsActualDto b : budgetAnalysis) {
            sb.append("<tr>")
                    .append("<td>").append(b.getProjectName()).append("</td>")
                    .append("<td>UGX ").append(String.format("%,.2f", b.getBudgetedCost())).append("</td>")
                    .append("<td>UGX ").append(String.format("%,.2f", b.getActualCost())).append("</td>")
                    .append("<td>UGX ").append(String.format("%,.2f", b.getVariance())).append("</td>")
                    .append("<td>").append(b.getStatus()).append("</td>")
                    .append("</tr>");
        }
        sb.append("</table>");

        return sb.toString();
    }

    private String buildSupportReportEmail(List<SlaComplianceDto> slaCompliance,
                                            TrendReportDto ticketVolume,
                                            LocalDate startDate,
                                            LocalDate endDate) {
        StringBuilder sb = new StringBuilder();
        sb.append("<h2>Monthly Support & SLA Report</h2>");
        sb.append("<p>Report Period: ").append(startDate).append(" to ").append(endDate).append("</p>");
        sb.append("<hr>");

        sb.append("<h3>SLA Compliance by Priority</h3>");
        sb.append("<table border='1' cellpadding='8' style='border-collapse: collapse;'>");
        sb.append("<tr><th>Priority</th><th>Total Tickets</th><th>Response Compliance</th><th>Resolution Compliance</th><th>Avg Response (hrs)</th><th>Avg Resolution (hrs)</th></tr>");
        for (SlaComplianceDto s : slaCompliance) {
            sb.append("<tr>")
                    .append("<td>").append(s.getPriority()).append("</td>")
                    .append("<td>").append(s.getTotalTickets()).append("</td>")
                    .append("<td>").append(String.format("%.1f%%", s.getResponseCompliancePercentage())).append("</td>")
                    .append("<td>").append(String.format("%.1f%%", s.getResolutionCompliancePercentage())).append("</td>")
                    .append("<td>").append(String.format("%.1f", s.getAverageResponseHours())).append("</td>")
                    .append("<td>").append(String.format("%.1f", s.getAverageResolutionHours())).append("</td>")
                    .append("</tr>");
        }
        sb.append("</table>");

        sb.append("<h3>Ticket Volume Trend</h3>");
        sb.append("<p>").append(ticketVolume.getSummary()).append("</p>");

        return sb.toString();
    }

    private void sendEmail(String to, String subject, String htmlBody) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("subject", subject);
        variables.put("body", htmlBody);
        variables.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        mailService.sendTemplateMail(fromAddress, to, subject, variables);
    }
}
