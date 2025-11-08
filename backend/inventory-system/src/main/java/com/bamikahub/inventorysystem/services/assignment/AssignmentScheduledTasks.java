package com.bamikahub.inventorysystem.services.assignment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled tasks for the Assignments module
 * 
 * This component automatically marks assignments as overdue when their due date passes.
 * The task runs every hour to check and update assignment statuses.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AssignmentScheduledTasks {

    private final AssignmentService assignmentService;

    /**
     * Automatically mark overdue assignments
     * Runs every hour at the start of the hour (e.g., 1:00, 2:00, 3:00, etc.)
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void markOverdueAssignments() {
        log.info("Running scheduled task: Mark overdue assignments");
        try {
            assignmentService.markOverdueAssignments();
            log.info("Successfully marked overdue assignments");
        } catch (Exception e) {
            log.error("Error marking overdue assignments", e);
        }
    }

    /**
     * Optional: Daily summary of assignments
     * Runs every day at 8:00 AM
     * Uncomment and implement if you want daily reports
     */
    // @Scheduled(cron = "0 0 8 * * *") // Every day at 8 AM
    // public void sendDailySummary() {
    //     log.info("Running scheduled task: Send daily assignment summary");
    //     try {
    //         // Implement logic to send summary emails
    //         log.info("Daily summary sent successfully");
    //     } catch (Exception e) {
    //         log.error("Error sending daily summary", e);
    //     }
    // }

    /**
     * Optional: Reminder for assignments due soon
     * Runs every day at 9:00 AM
     * Uncomment and implement if you want deadline reminders
     */
    // @Scheduled(cron = "0 0 9 * * *") // Every day at 9 AM
    // public void sendDeadlineReminders() {
    //     log.info("Running scheduled task: Send deadline reminders");
    //     try {
    //         // Implement logic to send reminder notifications
    //         log.info("Deadline reminders sent successfully");
    //     } catch (Exception e) {
    //         log.error("Error sending deadline reminders", e);
    //     }
    // }
}
