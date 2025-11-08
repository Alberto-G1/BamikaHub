package com.bamikahub.inventorysystem.services.assignment;

import com.bamikahub.inventorysystem.models.assignment.Assignment;
import com.bamikahub.inventorysystem.models.assignment.AssignmentActivity;
import com.bamikahub.inventorysystem.models.assignment.AssignmentAuditLog;
import com.bamikahub.inventorysystem.models.assignment.AssignmentAuditLog.AuditAction;
import com.bamikahub.inventorysystem.models.assignment.AssignmentFinalReport;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.dao.assignment.AssignmentAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentAuditService {

    private final AssignmentAuditLogRepository auditLogRepository;

    private void persist(AuditAction action, Assignment assignment, User actor, Map<String, Object> meta) {
        try {
            AssignmentAuditLog logEntry = new AssignmentAuditLog();
            logEntry.setActionType(action);
            logEntry.setAssignment(assignment);
            logEntry.setActor(actor);
            logEntry.setMetadataJson(meta == null ? null : AuditJsonUtil.toJson(meta));
            auditLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Failed to persist audit log action={} assignmentId={} error={}", action, assignment.getId(), e.getMessage(), e);
        }
    }

    private Map<String, Object> baseMeta() {
        return new HashMap<>();
    }

    public void logAssignmentCreated(Assignment assignment, User actor) {
        Map<String, Object> m = baseMeta();
        m.put("title", assignment.getTitle());
        persist(AssignmentAuditLog.AuditAction.ASSIGNMENT_CREATED, assignment, actor, m);
    }

    public void logActivityCreated(Assignment assignment, AssignmentActivity activity, User actor) {
        Map<String, Object> m = baseMeta();
        m.put("activityId", activity.getId());
        m.put("activityTitle", activity.getTitle());
        persist(AssignmentAuditLog.AuditAction.ACTIVITY_CREATED, assignment, actor, m);
    }

    public void logActivityCompleted(Assignment assignment, AssignmentActivity activity, User actor) {
        Map<String, Object> m = baseMeta();
        m.put("activityId", activity.getId());
        m.put("activityTitle", activity.getTitle());
        persist(AssignmentAuditLog.AuditAction.ACTIVITY_COMPLETED, assignment, actor, m);
    }

    public void logEvidenceSubmitted(Assignment assignment, AssignmentActivity activity, User actor) {
        Map<String, Object> m = baseMeta();
        m.put("activityId", activity.getId());
        m.put("activityTitle", activity.getTitle());
        m.put("evidenceType", activity.getEvidenceType());
        persist(AssignmentAuditLog.AuditAction.EVIDENCE_SUBMITTED, assignment, actor, m);
    }

    public void logFinalReportSubmitted(Assignment assignment, AssignmentFinalReport report, User actor) {
        Map<String, Object> m = baseMeta();
        m.put("reportId", report.getId());
        m.put("status", report.getStatus());
        persist(AssignmentAuditLog.AuditAction.FINAL_REPORT_SUBMITTED, assignment, actor, m);
    }

    public void logAssignmentApproved(Assignment assignment, User reviewer) {
        persist(AssignmentAuditLog.AuditAction.ASSIGNMENT_APPROVED, assignment, reviewer, baseMeta());
    }

    public void logAssignmentRejected(Assignment assignment, User reviewer, String comments) {
        Map<String, Object> m = baseMeta();
        m.put("comments", comments);
        persist(AssignmentAuditLog.AuditAction.ASSIGNMENT_REJECTED, assignment, reviewer, m);
    }

    public void logAssignmentReturnedForRework(Assignment assignment, User reviewer) {
        persist(AssignmentAuditLog.AuditAction.ASSIGNMENT_RETURNED, assignment, reviewer, baseMeta());
    }

    public void logAssignmentReopened(Assignment assignment, User actor) {
        persist(AssignmentAuditLog.AuditAction.ASSIGNMENT_REOPENED, assignment, actor, baseMeta());
    }

    public void logOverdue(Assignment assignment) {
        persist(AssignmentAuditLog.AuditAction.ASSIGNMENT_OVERDUE, assignment, null, baseMeta());
    }

    // Simple JSON util (avoids extra dependency). Could swap for Jackson's ObjectMapper if available.
    static class AuditJsonUtil {
        static String toJson(Map<String, Object> meta) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<String, Object> e : meta.entrySet()) {
                if (!first) sb.append(',');
                sb.append('"').append(escape(e.getKey())).append('"').append(':');
                Object v = e.getValue();
                if (v == null) {
                    sb.append("null");
                } else if (v instanceof Number || v instanceof Boolean) {
                    sb.append(v.toString());
                } else {
                    sb.append('"').append(escape(String.valueOf(v))).append('"');
                }
                first = false;
            }
            sb.append('}');
            return sb.toString();
        }
        private static String escape(String s) {
            return s.replace("\\", "\\\\").replace("\"", "\\\"");
        }
    }
}
