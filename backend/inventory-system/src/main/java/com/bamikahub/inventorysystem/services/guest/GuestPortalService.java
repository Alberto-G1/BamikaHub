package com.bamikahub.inventorysystem.services.guest;

import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketAssignmentRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketCreateRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketDto;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketMessageDto;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketMessageRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketStatusUpdateRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestUserDto;
import com.bamikahub.inventorysystem.dto.guest.GuestUserRegistrationRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestUserStatusUpdateRequest;
import com.bamikahub.inventorysystem.models.guest.GuestAccountStatus;
import com.bamikahub.inventorysystem.models.guest.GuestMessageSender;
import com.bamikahub.inventorysystem.models.guest.GuestTicket;
import com.bamikahub.inventorysystem.models.guest.GuestTicketMessage;
import com.bamikahub.inventorysystem.models.guest.GuestTicketStatus;
import com.bamikahub.inventorysystem.models.guest.GuestUser;
import com.bamikahub.inventorysystem.models.user.User;
import com.bamikahub.inventorysystem.repositories.guest.GuestTicketMessageRepository;
import com.bamikahub.inventorysystem.repositories.guest.GuestTicketRepository;
import com.bamikahub.inventorysystem.repositories.guest.GuestUserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class GuestPortalService {

    private final GuestUserRepository guestUserRepository;
    private final GuestTicketRepository guestTicketRepository;
    private final GuestTicketMessageRepository guestTicketMessageRepository;
    private final UserRepository userRepository;

    public GuestUserDto registerGuest(GuestUserRegistrationRequest request, String actorReference) {
        if (!StringUtils.hasText(request.getEmail())) {
            throw new IllegalArgumentException("Guest email is required");
        }
        if (!StringUtils.hasText(request.getFullName())) {
            throw new IllegalArgumentException("Guest name is required");
        }
        if (!StringUtils.hasText(request.getPhoneNumber())) {
            throw new IllegalArgumentException("Guest phone number is required");
        }
        Optional<GuestUser> existing = guestUserRepository.findByEmailIgnoreCase(request.getEmail().trim());
        if (existing.isPresent()) {
            throw new IllegalStateException("Guest with this email already exists");
        }

        GuestUser guest = GuestUser.builder()
        .fullName(request.getFullName().trim())
                .email(request.getEmail().trim())
        .phoneNumber(request.getPhoneNumber().trim())
                .companyName(StringUtils.hasText(request.getCompanyName()) ? request.getCompanyName().trim() : null)
                .category(StringUtils.hasText(request.getCategory()) ? request.getCategory().trim() : null)
                .status(GuestAccountStatus.PENDING_APPROVAL)
                .emailVerified(false)
                .build();

        if (StringUtils.hasText(actorReference)) {
            guest.setPendingApprovalBy(actorReference);
        }

        GuestUser saved = guestUserRepository.save(guest);
        return mapGuest(saved, true);
    }

    @Transactional(readOnly = true)
    public List<GuestUserDto> listGuests() {
        return guestUserRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(guest -> mapGuest(guest, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GuestUserDto getGuest(Long id) {
        GuestUser guest = guestUserRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Guest user not found"));
        return mapGuest(guest, true);
    }

    public GuestUserDto updateGuestStatus(Long id, GuestUserStatusUpdateRequest request, String actorReference) {
        GuestUser guest = guestUserRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Guest user not found"));

        GuestAccountStatus nextStatus = request.getStatus();
        if (nextStatus == null) {
            throw new IllegalArgumentException("Status is required");
        }

        switch (nextStatus) {
            case PENDING_APPROVAL -> guest.markPendingApproval(actorReference);
            case ACTIVE -> guest.markActive();
            case SUSPENDED -> guest.markSuspended(actorReference);
            case DEACTIVATED -> guest.markDeactivated(actorReference);
            default -> throw new IllegalArgumentException("Unsupported status transition");
        }

        GuestUser saved = guestUserRepository.save(guest);
        return mapGuest(saved, true);
    }

    public GuestTicketDto createTicket(GuestTicketCreateRequest request) {
        GuestUser guest = guestUserRepository.findById(request.getGuestId())
                .orElseThrow(() -> new EntityNotFoundException("Guest user not found"));

        if (!StringUtils.hasText(request.getSubject())) {
            throw new IllegalArgumentException("Ticket subject is required");
        }
        if (!StringUtils.hasText(request.getDescription())) {
            throw new IllegalArgumentException("Ticket description is required");
        }

    String subject = request.getSubject().trim();
    String description = request.getDescription().trim();

    List<String> attachments = request.getAttachmentPaths() != null
        ? new ArrayList<>(request.getAttachmentPaths())
        : new ArrayList<>();
    attachments.removeIf(item -> !StringUtils.hasText(item));

        GuestTicket ticket = GuestTicket.builder()
        .subject(subject)
        .description(description)
        .attachmentPaths(attachments)
                .guest(guest)
                .status(GuestTicketStatus.PENDING)
                .build();

        guest.addTicket(ticket);
        GuestTicket saved = guestTicketRepository.save(ticket);
        return mapTicket(saved, false);
    }

    @Transactional(readOnly = true)
    public List<GuestTicketDto> listTickets(Long guestId, GuestTicketStatus status) {
        List<GuestTicket> tickets;
        if (guestId != null) {
            tickets = guestTicketRepository.findAllByGuestIdOrderByCreatedAtDesc(guestId);
        } else if (status != null) {
            tickets = guestTicketRepository.findAllByStatusOrderByCreatedAtAsc(status);
        } else {
            tickets = guestTicketRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"));
        }

        return tickets.stream()
                .map(ticket -> mapTicket(ticket, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GuestTicketDto getTicket(Long id) {
        GuestTicket ticket = guestTicketRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Guest ticket not found"));
        return mapTicket(ticket, true);
    }

    public GuestTicketDto updateTicketStatus(Long id, GuestTicketStatusUpdateRequest request) {
        GuestTicket ticket = guestTicketRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Guest ticket not found"));
        GuestTicketStatus nextStatus = request.getNextStatus();
        if (nextStatus == null) {
            throw new IllegalArgumentException("Next status is required");
        }
        ticket.markStatus(nextStatus);
        GuestTicket saved = guestTicketRepository.save(ticket);
        return mapTicket(saved, true);
    }

    public GuestTicketDto assignTicket(Long id, GuestTicketAssignmentRequest request) {
        GuestTicket ticket = guestTicketRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Guest ticket not found"));
        if (request.getStaffUserId() == null) {
            throw new IllegalArgumentException("Staff user id is required");
        }
        User staff = userRepository.findById(request.getStaffUserId())
                .orElseThrow(() -> new EntityNotFoundException("Staff user not found"));
        ticket.setAssignedStaff(staff);
        ticket.touchConversation();
        GuestTicket saved = guestTicketRepository.save(ticket);
        return mapTicket(saved, true);
    }

    public GuestTicketMessageDto addMessage(Long ticketId, GuestTicketMessageRequest request) {
        GuestTicket ticket = guestTicketRepository.findById(ticketId)
                .orElseThrow(() -> new EntityNotFoundException("Guest ticket not found"));
        if (!StringUtils.hasText(request.getMessage())) {
            throw new IllegalArgumentException("Message content is required");
        }
        GuestMessageSender sender = request.getSender() != null ? request.getSender() : GuestMessageSender.STAFF;

    List<String> attachments = request.getAttachmentPaths() != null
        ? new ArrayList<>(request.getAttachmentPaths())
        : new ArrayList<>();
    attachments.removeIf(item -> !StringUtils.hasText(item));

        GuestTicketMessage message = GuestTicketMessage.builder()
                .sender(sender)
        .message(request.getMessage().trim())
        .attachmentPaths(attachments)
                .readByGuest(sender == GuestMessageSender.GUEST)
                .readByStaff(sender == GuestMessageSender.STAFF)
                .build();

        ticket.addMessage(message);
        ticket.touchConversation();
        GuestTicketMessage saved = guestTicketMessageRepository.save(message);
        saved.setReadByStaff(sender == GuestMessageSender.STAFF);
        saved.setReadByGuest(sender == GuestMessageSender.GUEST);
        guestTicketRepository.save(ticket);
        return mapMessage(saved);
    }

    private GuestUserDto mapGuest(GuestUser guest, boolean computeTicketCount) {
        GuestUserDto dto = new GuestUserDto();
        dto.setId(guest.getId());
        dto.setFullName(guest.getFullName());
        dto.setEmail(guest.getEmail());
        dto.setPhoneNumber(guest.getPhoneNumber());
        dto.setCompanyName(guest.getCompanyName());
        dto.setCategory(guest.getCategory());
        dto.setStatus(guest.getStatus());
        dto.setEmailVerified(guest.isEmailVerified());
        dto.setVerifiedAt(guest.getVerifiedAt());
        dto.setCreatedAt(guest.getCreatedAt());
        dto.setUpdatedAt(guest.getUpdatedAt());
        if (computeTicketCount) {
            dto.setTicketCount(guest.getTickets() != null ? guest.getTickets().size() : 0);
        }
        return dto;
    }

    private GuestTicketDto mapTicket(GuestTicket ticket, boolean includeMessages) {
        GuestTicketDto dto = new GuestTicketDto();
        dto.setId(ticket.getId());
        dto.setGuestId(ticket.getGuest() != null ? ticket.getGuest().getId() : null);
        dto.setGuestName(ticket.getGuest() != null ? ticket.getGuest().getFullName() : null);
        dto.setSubject(ticket.getSubject());
        dto.setDescription(ticket.getDescription());
        dto.setStatus(ticket.getStatus());
        dto.setAssignedStaffId(ticket.getAssignedStaff() != null ? ticket.getAssignedStaff().getId() : null);
        dto.setAssignedStaffName(ticket.getAssignedStaff() != null ? ticket.getAssignedStaff().getUsername() : null);
    dto.setAttachmentPaths(ticket.getAttachmentPaths() != null
        ? new ArrayList<>(ticket.getAttachmentPaths())
        : Collections.emptyList());
        dto.setDueAt(ticket.getDueAt());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        dto.setLastMessageAt(ticket.getLastMessageAt());
        if (includeMessages) {
            List<GuestTicketMessageDto> messages = ticket.getMessages().stream()
            .sorted(Comparator.comparing(GuestTicketMessage::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(this::mapMessage)
                    .collect(Collectors.toList());
            dto.setMessages(messages);
        } else {
            dto.setMessages(Collections.emptyList());
        }
        return dto;
    }

    private GuestTicketMessageDto mapMessage(GuestTicketMessage message) {
        GuestTicketMessageDto dto = new GuestTicketMessageDto();
        dto.setId(message.getId());
        dto.setTicketId(message.getTicket() != null ? message.getTicket().getId() : null);
        dto.setSender(message.getSender());
        dto.setMessage(message.getMessage());
        dto.setAttachmentPaths(message.getAttachmentPaths());
        dto.setReadByGuest(message.isReadByGuest());
        dto.setReadByStaff(message.isReadByStaff());
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }
}
