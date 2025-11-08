package com.bamikahub.inventorysystem.services.assignment;

import com.bamikahub.inventorysystem.models.assignment.Assignment;
import com.bamikahub.inventorysystem.models.assignment.AssignmentActivity;
import com.bamikahub.inventorysystem.models.assignment.AssignmentFinalReport;
import com.bamikahub.inventorysystem.models.user.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AssignmentNotificationService {

    public void notifyAssignmentCreated(Assignment assignment) {
        log.info("[Notify] Assignment Created -> assignee={} title={}", assignment.getAssignee().getEmail(), assignment.getTitle());
    }

    public void notifyAssignmentStarted(Assignment assignment, User actor) {
        log.info("[Notify] Assignment Started -> assignmentId={} by={}", assignment.getId(), actor.getEmail());
    }

    public void notifyActivityCompleted(Assignment assignment, AssignmentActivity activity, User actor) {
        log.info("[Notify] Activity Completed -> assignmentId={} activity={} by={}", assignment.getId(), activity.getTitle(), actor.getEmail());
    }

    public void notifyEvidenceSubmitted(Assignment assignment, AssignmentActivity activity, User actor) {
        log.info("[Notify] Evidence Submitted -> assignmentId={} activity={} by={}", assignment.getId(), activity.getTitle(), actor.getEmail());
    }

    public void notifyFinalReportSubmitted(Assignment assignment, AssignmentFinalReport report, User actor) {
        log.info("[Notify] Final Report Submitted -> assignmentId={} by={}", assignment.getId(), actor.getEmail());
    }

    public void notifyAssignmentApproved(Assignment assignment, User reviewer) {
        log.info("[Notify] Assignment Approved -> assignmentId={} reviewer={}", assignment.getId(), reviewer.getEmail());
    }

    public void notifyAssignmentRejected(Assignment assignment, User reviewer, String comments) {
        log.info("[Notify] Assignment Rejected -> assignmentId={} reviewer={} comments={}", assignment.getId(), reviewer.getEmail(), comments);
    }

    public void notifyAssignmentOverdue(Assignment assignment) {
        log.info("[Notify] Assignment Overdue -> assignmentId={} assignee={}", assignment.getId(), assignment.getAssignee().getEmail());
    }

    public void notifyDeadlineReminder(Assignment assignment, int daysRemaining) {
        log.info("[Notify] Deadline Reminder -> assignmentId={} daysRemaining={}", assignment.getId(), daysRemaining);
    }

    public void notifyAssignmentReturnedForRework(Assignment assignment, User reviewer) {
        log.info("[Notify] Assignment Returned -> assignmentId={} reviewer={}", assignment.getId(), reviewer.getEmail());
    }

    public void notifyAssignmentReopened(Assignment assignment, User actor) {
        log.info("[Notify] Assignment Reopened -> assignmentId={} actor={}", assignment.getId(), actor.getEmail());
    }
}
