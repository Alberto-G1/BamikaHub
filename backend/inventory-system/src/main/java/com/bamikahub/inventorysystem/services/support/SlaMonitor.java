package com.bamikahub.inventorysystem.services.support;

import com.bamikahub.inventorysystem.dao.support.SupportTicketRepository;
import com.bamikahub.inventorysystem.models.support.SupportTicket;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SlaMonitor {

    private static final Logger log = LoggerFactory.getLogger(SlaMonitor.class);

    private final SupportTicketRepository ticketRepository;
    private final SlaService slaService;
    private final TicketNotificationService notificationService;

    @Scheduled(fixedDelay = 900_000L)
    public void checkBreaches() {
    List<SupportTicket> activeTickets = ticketRepository.findByStatusIn(
        EnumSet.of(
            SupportTicket.TicketStatus.OPEN,
            SupportTicket.TicketStatus.IN_PROGRESS
        ).stream().toList()
    );

        for (SupportTicket ticket : activeTickets) {
            if (slaService.shouldEscalate(ticket)) {
                log.warn("Escalating ticket {} due to SLA breach", ticket.getId());
                slaService.markEscalated(ticket);
                notificationService.notifyEscalation(ticket);
                ticketRepository.save(ticket);
            }
        }
    }
}
