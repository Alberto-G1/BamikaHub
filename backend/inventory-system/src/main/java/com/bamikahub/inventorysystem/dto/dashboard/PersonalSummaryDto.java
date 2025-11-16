package com.bamikahub.inventorysystem.dto.dashboard;

import com.bamikahub.inventorysystem.dto.assignment.AssignmentDTO;
import com.bamikahub.inventorysystem.dto.notification.NotificationDto;
import com.bamikahub.inventorysystem.dto.support.TicketListResponse;
import lombok.Data;

import java.util.List;

@Data
public class PersonalSummaryDto {
    private List<NotificationDto> notifications;
    private int notificationsTotal;

    private List<TicketListResponse> tickets;
    private int ticketsTotal;

    private List<AssignmentDTO> assignments;
    private int assignmentsTotal;
}
