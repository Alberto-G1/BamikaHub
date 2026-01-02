package com.bamikahub.inventorysystem.services.support;

import com.bamikahub.inventorysystem.dao.support.SupportTicketRepository;
import com.bamikahub.inventorysystem.models.support.SupportTicket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketEscalationScheduler {

    private final SupportTicketRepository ticketRepository;
    private final SlaService slaService;
    private final TicketNotificationService notificationService;

    /**
     * Runs every 15 minutes to check for tickets that need escalation
     */
    @Scheduled(fixedDelay = 900000) // 15 minutes
    @Transactional
    public void checkForEscalations() {
        log.info("Starting ticket escalation check...");
        
        // Find tickets that are not closed and have SLA issues
        List<SupportTicket> activeTickets = ticketRepository.findByStatusNot(SupportTicket.TicketStatus.CLOSED);
        
        int escalatedCount = 0;
        for (SupportTicket ticket : activeTickets) {
            if (slaService.shouldEscalate(ticket)) {
                escalateTicket(ticket);
                escalatedCount++;
            }
        }
        
        log.info("Ticket escalation check completed. Escalated {} tickets.", escalatedCount);
    }

    /**
     * Runs every hour to check for SLA breaches
     */
    @Scheduled(fixedDelay = 3600000) // 1 hour
    @Transactional
    public void checkSlaBreaches() {
        log.info("Starting SLA breach check...");
        
        List<SupportTicket> activeTickets = ticketRepository.findByStatusIn(
            List.of(SupportTicket.TicketStatus.OPEN, SupportTicket.TicketStatus.IN_PROGRESS)
        );
        
        int breachedCount = 0;
        LocalDateTime now = LocalDateTime.now();
        
        for (SupportTicket ticket : activeTickets) {
            boolean updated = false;
            
            // Check response SLA
            if (!ticket.isResponseBreached() && 
                ticket.getResponseDueAt() != null && 
                ticket.getFirstResponseAt() == null &&
                now.isAfter(ticket.getResponseDueAt())) {
                ticket.setResponseBreached(true);
                updated = true;
                breachedCount++;
                log.warn("Response SLA breached for ticket #{}", ticket.getId());
            }
            
            // Check resolution SLA
            if (!ticket.isResolutionBreached() && 
                ticket.getResolutionDueAt() != null && 
                ticket.getResolvedAt() == null &&
                now.isAfter(ticket.getResolutionDueAt())) {
                ticket.setResolutionBreached(true);
                updated = true;
                breachedCount++;
                log.warn("Resolution SLA breached for ticket #{}", ticket.getId());
            }
            
            if (updated) {
                ticketRepository.save(ticket);
                notificationService.notifySlaBreached(ticket);
            }
        }
        
        log.info("SLA breach check completed. {} breaches detected.", breachedCount);
    }

    private void escalateTicket(SupportTicket ticket) {
        log.info("Escalating ticket #{}: {}", ticket.getId(), ticket.getSubject());
        
        // Mark as escalated
        slaService.markEscalated(ticket);
        
        // Upgrade priority if possible
        if (ticket.getPriority() == SupportTicket.TicketPriority.LOW) {
            ticket.setPriority(SupportTicket.TicketPriority.MEDIUM);
        } else if (ticket.getPriority() == SupportTicket.TicketPriority.MEDIUM) {
            ticket.setPriority(SupportTicket.TicketPriority.HIGH);
        } else if (ticket.getPriority() == SupportTicket.TicketPriority.HIGH) {
            ticket.setPriority(SupportTicket.TicketPriority.URGENT);
        }
        
        ticketRepository.save(ticket);
        
        // Send escalation notifications
        notificationService.notifyEscalation(ticket);
    }
}
