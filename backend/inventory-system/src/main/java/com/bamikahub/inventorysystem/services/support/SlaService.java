package com.bamikahub.inventorysystem.services.support;

import com.bamikahub.inventorysystem.models.support.SupportTicket;
import com.bamikahub.inventorysystem.models.support.TicketActivity;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.Map;

@Service
public class SlaService {

    private final Map<SupportTicket.TicketPriority, Duration> responseTargets;
    private final Map<SupportTicket.TicketPriority, Duration> resolutionTargets;

    public SlaService() {
        responseTargets = new EnumMap<>(SupportTicket.TicketPriority.class);
        resolutionTargets = new EnumMap<>(SupportTicket.TicketPriority.class);

        responseTargets.put(SupportTicket.TicketPriority.URGENT, Duration.ofHours(1));
        responseTargets.put(SupportTicket.TicketPriority.HIGH, Duration.ofHours(4));
        responseTargets.put(SupportTicket.TicketPriority.MEDIUM, Duration.ofHours(8));
        responseTargets.put(SupportTicket.TicketPriority.LOW, Duration.ofHours(24));

        resolutionTargets.put(SupportTicket.TicketPriority.URGENT, Duration.ofHours(4));
        resolutionTargets.put(SupportTicket.TicketPriority.HIGH, Duration.ofHours(12));
        resolutionTargets.put(SupportTicket.TicketPriority.MEDIUM, Duration.ofHours(48));
        resolutionTargets.put(SupportTicket.TicketPriority.LOW, Duration.ofHours(72));
    }

    public void applyInitialSla(SupportTicket ticket) {
        LocalDateTime now = LocalDateTime.now();
        ticket.setResponseDueAt(now.plus(responseTargets.get(ticket.getPriority())));
        ticket.setResolutionDueAt(now.plus(resolutionTargets.get(ticket.getPriority())));
    }

    public void recalculateSlaForPriorityChange(SupportTicket ticket) {
        if (ticket.getCreatedAt() == null) {
            return;
        }
        ticket.setResponseDueAt(ticket.getCreatedAt().plus(responseTargets.get(ticket.getPriority())));
        ticket.setResolutionDueAt(ticket.getCreatedAt().plus(resolutionTargets.get(ticket.getPriority())));
    }

    public void handleResponseLogged(SupportTicket ticket, TicketActivity activity) {
        if (ticket.getFirstResponseAt() != null) {
            return;
        }
        if (activity.getPerformedBy() == null) {
            return;
        }
        if (ticket.getSubmittedBy() != null
                && activity.getPerformedBy().getId().equals(ticket.getSubmittedBy().getId())) {
            return;
        }
        ticket.setFirstResponseAt(activity.getCreatedAt());
        if (ticket.getResponseDueAt() != null && activity.getCreatedAt().isAfter(ticket.getResponseDueAt())) {
            ticket.setResponseBreached(true);
        }
    }

    public void handleResolution(SupportTicket ticket) {
        if (ticket.getResolutionDueAt() != null && ticket.getResolvedAt() != null
                && ticket.getResolvedAt().isAfter(ticket.getResolutionDueAt())) {
            ticket.setResolutionBreached(true);
        }
    }

    public boolean shouldEscalate(SupportTicket ticket) {
        if (ticket.getResolutionDueAt() == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(ticket.getResolutionDueAt())
                && (ticket.getLastEscalationAt() == null || Duration.between(ticket.getLastEscalationAt(), now).toHours() >= 4);
    }

    public void markEscalated(SupportTicket ticket) {
        ticket.setLastEscalationAt(LocalDateTime.now());
        ticket.setResolutionBreached(true);
    }

    public String buildSlaSummary(SupportTicket ticket) {
        StringBuilder builder = new StringBuilder();
        builder.append("Priority: ").append(ticket.getPriority());
        if (ticket.getResponseDueAt() != null) {
            builder.append(" | Response due: ").append(ticket.getResponseDueAt());
        }
        if (ticket.getResolutionDueAt() != null) {
            builder.append(" | Resolution due: ").append(ticket.getResolutionDueAt());
        }
        if (ticket.isResponseBreached()) {
            builder.append(" | Response SLA breached");
        }
        if (ticket.isResolutionBreached()) {
            builder.append(" | Resolution SLA breached");
        }
        return builder.toString();
    }

    public String buildEscalationDetails(SupportTicket ticket) {
        return "Ticket #" + ticket.getId() + " has breached its resolution SLA. Please review immediately.";
    }

    public TicketActivity createActivity(SupportTicket ticket, TicketActivity.ActionType type, String details, User actor) {
        TicketActivity activity = new TicketActivity();
        activity.setTicket(ticket);
        activity.setActionType(type);
        activity.setDetails(details);
        activity.setPerformedBy(actor);
        if (ticket.getActivities() == null) {
            ticket.setActivities(new java.util.ArrayList<>());
        }
        ticket.getActivities().add(activity);
        return activity;
    }
}
