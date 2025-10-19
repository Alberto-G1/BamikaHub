package com.bamikahub.inventorysystem.services.support;

import com.bamikahub.inventorysystem.models.support.SupportTicket;
import com.bamikahub.inventorysystem.models.support.TicketActivity;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.services.mail.TemplateMailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TicketNotificationService {

    private final TemplateMailService mailService;
    private final SlaService slaService;

    @Value("${notifications.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${notifications.mail.from}")
    private String fromAddress;

    @Value("${notifications.mail.escalation-recipients:}")
    private String escalationRecipientsConfig;

    public void notifyTicketCreated(SupportTicket ticket) {
    slaService.createActivity(ticket, TicketActivity.ActionType.CREATED,
        "Ticket created by " + ticket.getSubmittedBy().getUsername(), ticket.getSubmittedBy());
        if (!mailEnabled) {
            return;
        }
        sendEmail(ticket.getSubmittedBy().getEmail(), "Support Ticket Created",
                "A new support ticket has been created.", ticket);
        if (ticket.getAssignedTo() != null) {
            sendEmail(ticket.getAssignedTo().getEmail(), "Ticket Assigned",
                    "Ticket has been assigned to you.", ticket);
        }
    }

    public void notifyAssignment(SupportTicket ticket, User assignee, User actor) {
        slaService.createActivity(ticket, TicketActivity.ActionType.ASSIGNED,
                "Assigned to " + assignee.getUsername(), actor);
        if (!mailEnabled) {
            return;
        }
        sendEmail(assignee.getEmail(), "Support Ticket Assigned",
                "You have been assigned ticket " + ticket.getSubject(), ticket);
    }

    public void notifyComment(SupportTicket ticket, User actor, String commentSummary) {
        TicketActivity activity = slaService.createActivity(ticket, TicketActivity.ActionType.COMMENTED,
                actor.getUsername() + " commented", actor);
        slaService.handleResponseLogged(ticket, activity);
        if (!mailEnabled) {
            return;
        }
        User submitter = ticket.getSubmittedBy();
        if (submitter != null && !submitter.getId().equals(actor.getId())) {
            sendEmail(submitter.getEmail(), "Update on your Support Ticket", commentSummary, ticket);
        }
        if (ticket.getAssignedTo() != null && !ticket.getAssignedTo().getId().equals(actor.getId())) {
            sendEmail(ticket.getAssignedTo().getEmail(), "Comment Posted", commentSummary, ticket);
        }
    }

    public void notifyStatusChange(SupportTicket ticket, SupportTicket.TicketStatus previousStatus, User actor) {
        slaService.createActivity(ticket, TicketActivity.ActionType.STATUS_CHANGED,
                actor.getUsername() + " changed status from " + previousStatus + " to " + ticket.getStatus(), actor);
        if (!mailEnabled) {
            return;
        }
        sendEmail(ticket.getSubmittedBy().getEmail(), "Ticket Status Updated",
                "Status changed to " + ticket.getStatus(), ticket);
        if (ticket.getAssignedTo() != null) {
            sendEmail(ticket.getAssignedTo().getEmail(), "Ticket Status Updated",
                    "Status changed to " + ticket.getStatus(), ticket);
        }
    }

    public void notifyResolution(SupportTicket ticket, User actor) {
        slaService.createActivity(ticket, TicketActivity.ActionType.RESOLVED,
                actor.getUsername() + " resolved the ticket", actor);
        slaService.handleResolution(ticket);
        if (!mailEnabled) {
            return;
        }
        sendEmail(ticket.getSubmittedBy().getEmail(), "Your Ticket has been Resolved",
                "Resolution notes are available in the ticket.", ticket);
    }

    public void notifyClosure(SupportTicket ticket, User actor) {
        slaService.createActivity(ticket, TicketActivity.ActionType.CLOSED,
                actor.getUsername() + " closed the ticket", actor);
        if (!mailEnabled) {
            return;
        }
        if (ticket.getAssignedTo() != null) {
            sendEmail(ticket.getAssignedTo().getEmail(), "Ticket Closed",
                    "Ticket has been closed by the submitter.", ticket);
        }
    }

    public void notifyEscalation(SupportTicket ticket) {
        slaService.createActivity(ticket, TicketActivity.ActionType.ESCALATED,
                slaService.buildEscalationDetails(ticket), ticket.getAssignedTo());
        List<String> recipients = parseEscalationRecipients();
        if (!mailEnabled || recipients.isEmpty()) {
            return;
        }
        for (String recipient : recipients) {
            sendEmail(recipient, "Escalation: Support Ticket Breached SLA",
                    slaService.buildEscalationDetails(ticket), ticket);
        }
    }

    public void notifyAttachment(SupportTicket ticket, User actor, String filename) {
        slaService.createActivity(ticket, TicketActivity.ActionType.ATTACHMENT_ADDED,
                actor.getUsername() + " uploaded " + filename, actor);
    }

    public void notifyExport(User actor, String format) {
        TicketActivity activity = new TicketActivity();
        activity.setActionType(TicketActivity.ActionType.NOTIFICATION_SENT);
        activity.setDetails(actor.getUsername() + " exported tickets to " + format);
    }

    private void sendEmail(String to, String subject, String message, SupportTicket ticket) {
        mailService.sendTemplateMail(fromAddress, to, subject,
                Map.of(
                        "subject", subject,
                        "message", message,
                        "ticketId", ticket.getId(),
                        "ticketSubject", ticket.getSubject(),
                        "ticketStatus", ticket.getStatus(),
                        "slaSummary", slaService.buildSlaSummary(ticket)
                ));
    }

    private List<String> parseEscalationRecipients() {
        if (!StringUtils.hasText(escalationRecipientsConfig)) {
            return List.of();
        }
        return Arrays.stream(escalationRecipientsConfig.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
    }
}
