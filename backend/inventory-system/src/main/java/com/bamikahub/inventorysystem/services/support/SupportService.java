package com.bamikahub.inventorysystem.services.support;

import com.bamikahub.inventorysystem.dao.support.SupportTicketRepository;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.support.CommentRequest;
import com.bamikahub.inventorysystem.dto.support.TicketRequest;
import com.bamikahub.inventorysystem.models.support.SupportTicket;
import com.bamikahub.inventorysystem.models.support.TicketComment;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class SupportService {

    @Autowired private SupportTicketRepository ticketRepository;
    @Autowired private UserRepository userRepository;

    @Transactional
    public SupportTicket createTicket(TicketRequest request) {
        User currentUser = getCurrentUser();
        SupportTicket ticket = new SupportTicket();
        ticket.setSubject(request.getSubject());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(request.getPriority());
        ticket.setSubmittedBy(currentUser);
        ticket.setStatus(SupportTicket.TicketStatus.OPEN);
        return ticketRepository.save(ticket);
    }

    @Transactional
    public SupportTicket assignTicketToSelf(Long ticketId) {
        User currentUser = getCurrentUser();
        SupportTicket ticket = findTicketById(ticketId);
        ticket.setAssignedTo(currentUser);
        ticket.setStatus(SupportTicket.TicketStatus.IN_PROGRESS);
        return ticketRepository.save(ticket);
    }

    @Transactional
    public TicketComment addComment(Long ticketId, CommentRequest request) {
        User currentUser = getCurrentUser();
        SupportTicket ticket = findTicketById(ticketId);

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setCommenter(currentUser);
        comment.setComment(request.getComment());

        ticket.getComments().add(comment);
        ticketRepository.save(ticket);
        return comment;
    }

    @Transactional
    public SupportTicket resolveTicket(Long ticketId, String resolutionNotes) {
        SupportTicket ticket = findTicketById(ticketId);
        ticket.setStatus(SupportTicket.TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());

        // Add resolution notes as a final comment
        addComment(ticketId, new CommentRequest() {{ setComment("Resolution: " + resolutionNotes); }});

        return ticketRepository.save(ticket);
    }

    @Transactional
    public SupportTicket closeTicket(Long ticketId) {
        User currentUser = getCurrentUser();
        SupportTicket ticket = findTicketById(ticketId);

        // Business Rule: Only the original submitter can close a resolved ticket
        if (!ticket.getSubmittedBy().getId().equals(currentUser.getId())) {
            throw new SecurityException("Only the user who submitted the ticket can close it.");
        }
        if (ticket.getStatus() != SupportTicket.TicketStatus.RESOLVED) {
            throw new IllegalStateException("Only a resolved ticket can be closed.");
        }

        ticket.setStatus(SupportTicket.TicketStatus.CLOSED);
        return ticketRepository.save(ticket);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
    }

    private SupportTicket findTicketById(Long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support ticket not found with id: " + ticketId));
    }
}