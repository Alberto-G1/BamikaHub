package com.bamikahub.inventorysystem.controllers.support;

import com.bamikahub.inventorysystem.dao.support.SupportTicketRepository;
import com.bamikahub.inventorysystem.dto.support.CommentRequest;
import com.bamikahub.inventorysystem.dto.support.TicketRequest;
import com.bamikahub.inventorysystem.models.support.SupportTicket;
import com.bamikahub.inventorysystem.models.support.TicketComment;
import com.bamikahub.inventorysystem.services.support.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support/tickets")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SupportController {

    @Autowired private SupportService supportService;
    @Autowired private SupportTicketRepository ticketRepository;

    @PostMapping
    @PreAuthorize("hasAuthority('TICKET_CREATE') or isAuthenticated()") // Allow any logged-in user to create
    public SupportTicket createTicket(@RequestBody TicketRequest request) {
        return supportService.createTicket(request);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<SupportTicket> getAllTickets() {
        return ticketRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public SupportTicket getTicketById(@PathVariable Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found."));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public SupportTicket assignTicket(@PathVariable Long id) {
        return supportService.assignTicketToSelf(id);
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public TicketComment addComment(@PathVariable Long id, @RequestBody CommentRequest request) {
        return supportService.addComment(id, request);
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAuthority('TICKET_MANAGE')")
    public SupportTicket resolveTicket(@PathVariable Long id, @RequestBody CommentRequest request) {
        return supportService.resolveTicket(id, request.getComment());
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("isAuthenticated()")
    public SupportTicket closeTicket(@PathVariable Long id) {
        return supportService.closeTicket(id);
    }
}