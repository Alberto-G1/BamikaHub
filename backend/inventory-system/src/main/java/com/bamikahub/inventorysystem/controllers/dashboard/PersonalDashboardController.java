package com.bamikahub.inventorysystem.controllers.dashboard;

import com.bamikahub.inventorysystem.dto.assignment.AssignmentDTO;
import com.bamikahub.inventorysystem.dto.dashboard.PersonalSummaryDto;
import com.bamikahub.inventorysystem.dto.notification.NotificationDto;
import com.bamikahub.inventorysystem.dto.support.TicketListResponse;
import com.bamikahub.inventorysystem.security.services.UserDetailsImpl;
import com.bamikahub.inventorysystem.services.assignment.AssignmentService;
import com.bamikahub.inventorysystem.services.notification.NotificationService;
import com.bamikahub.inventorysystem.services.support.SupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class PersonalDashboardController {

    private final NotificationService notificationService;
    private final SupportService supportService;
    private final AssignmentService assignmentService;

    @GetMapping("/personal-summary")
    public ResponseEntity<PersonalSummaryDto> getPersonalSummary(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        Long userId = userDetails.getId();

        // Notifications (get all, then page in-memory)
        List<NotificationDto> notifications = notificationService.getUserNotifications(userId);
        int notifStart = Math.max(0, Math.min(notifications.size(), page * size));
        List<NotificationDto> notifPage = notifications.stream()
                .skip(notifStart)
                .limit(size)
                .collect(Collectors.toList());

        // Tickets submitted by this user
        List<TicketListResponse> tickets = supportService.findTickets(
                com.bamikahub.inventorysystem.dto.support.TicketFilterCriteria.builder()
                        .submittedById(userId)
                        .build()
        );
        int ticketStart = Math.max(0, Math.min(tickets.size(), page * size));
        List<TicketListResponse> ticketPage = tickets.stream().skip(ticketStart).limit(size).collect(Collectors.toList());

        // Assignments assigned to this user
        List<AssignmentDTO> assignments = Collections.emptyList();
        try {
            assignments = assignmentService.getMyAssignments(userId);
        } catch (Exception ex) {
            // assignment service may require permissions; ignore if not available
        }
        int assignStart = Math.max(0, Math.min(assignments.size(), page * size));
        List<AssignmentDTO> assignPage = assignments.stream().skip(assignStart).limit(size).collect(Collectors.toList());

        PersonalSummaryDto dto = new PersonalSummaryDto();
        dto.setNotifications(notifPage);
        dto.setNotificationsTotal(notifications.size());
        dto.setTickets(ticketPage);
        dto.setTicketsTotal(tickets.size());
        dto.setAssignments(assignPage);
        dto.setAssignmentsTotal(assignments.size());

        return ResponseEntity.ok(dto);
    }
}
