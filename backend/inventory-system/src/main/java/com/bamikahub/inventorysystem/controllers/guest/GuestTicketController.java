package com.bamikahub.inventorysystem.controllers.guest;

import com.bamikahub.inventorysystem.dto.guest.GuestTicketAssignmentRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketCreateRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketDto;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketMessageDto;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketMessageRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketStatusUpdateRequest;
import com.bamikahub.inventorysystem.models.guest.GuestTicketStatus;
import com.bamikahub.inventorysystem.services.guest.GuestPortalService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/guest/tickets")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
public class GuestTicketController {

    private final GuestPortalService guestPortalService;

    @GetMapping
    @PreAuthorize("hasAuthority('GUEST_TICKET_VIEW')")
    public List<GuestTicketDto> listTickets(@RequestParam(required = false) Long guestId,
                                            @RequestParam(required = false) GuestTicketStatus status) {
        return guestPortalService.listTickets(guestId, status);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GUEST_TICKET_VIEW')")
    public GuestTicketDto getTicket(@PathVariable Long id) {
        return guestPortalService.getTicket(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GUEST_TICKET_MANAGE')")
    public GuestTicketDto createTicket(@RequestBody GuestTicketCreateRequest request) {
        return guestPortalService.createTicket(request);
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAuthority('GUEST_TICKET_MANAGE')")
    public GuestTicketDto updateStatus(@PathVariable Long id, @RequestBody GuestTicketStatusUpdateRequest request) {
        request.setTicketId(id);
        return guestPortalService.updateTicketStatus(id, request);
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('GUEST_TICKET_MANAGE')")
    public GuestTicketDto assignTicket(@PathVariable Long id, @RequestBody GuestTicketAssignmentRequest request) {
        return guestPortalService.assignTicket(id, request);
    }

    @PostMapping("/{id}/messages")
    @PreAuthorize("hasAuthority('GUEST_TICKET_MANAGE')")
    public GuestTicketMessageDto addMessage(@PathVariable Long id, @RequestBody GuestTicketMessageRequest request) {
        request.setTicketId(id);
        return guestPortalService.addMessage(id, request);
    }
}
