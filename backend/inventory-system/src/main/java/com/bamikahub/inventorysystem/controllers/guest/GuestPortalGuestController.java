package com.bamikahub.inventorysystem.controllers.guest;

import com.bamikahub.inventorysystem.dto.guest.GuestPortalMessageRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestPortalTicketCreateRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketDto;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketMessageDto;
import com.bamikahub.inventorysystem.dto.guest.GuestTicketRatingRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestUserDto;
import com.bamikahub.inventorysystem.security.services.GuestUserDetails;
import com.bamikahub.inventorysystem.services.guest.GuestPortalService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portal/guest")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
public class GuestPortalGuestController {

    private final GuestPortalService guestPortalService;

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('ROLE_GUEST')")
    public GuestUserDto currentGuest() {
        GuestUserDetails principal = requireGuestPrincipal();
        return guestPortalService.getGuest(principal.getId());
    }

    @GetMapping("/tickets")
    @PreAuthorize("hasAuthority('ROLE_GUEST')")
    public List<GuestTicketDto> listTickets() {
        GuestUserDetails principal = requireGuestPrincipal();
        return guestPortalService.listTicketsForGuest(principal.getId());
    }

    @PostMapping("/tickets")
    @PreAuthorize("hasAuthority('ROLE_GUEST')")
    public GuestTicketDto createTicket(@RequestBody GuestPortalTicketCreateRequest request) {
        GuestUserDetails principal = requireGuestPrincipal();
        return guestPortalService.createTicketForGuest(principal.getId(), request);
    }

    @GetMapping("/tickets/{id}")
    @PreAuthorize("hasAuthority('ROLE_GUEST')")
    public GuestTicketDto getTicket(@PathVariable Long id) {
        GuestUserDetails principal = requireGuestPrincipal();
        return guestPortalService.getTicketForGuest(principal.getId(), id);
    }

    @PostMapping("/tickets/{id}/messages")
    @PreAuthorize("hasAuthority('ROLE_GUEST')")
    public GuestTicketMessageDto addMessage(@PathVariable Long id, @RequestBody GuestPortalMessageRequest request) {
        GuestUserDetails principal = requireGuestPrincipal();
        return guestPortalService.addGuestMessage(principal.getId(), id, request);
    }

    @PostMapping("/tickets/{id}/rating")
    @PreAuthorize("hasAuthority('ROLE_GUEST')")
    public GuestTicketDto rateTicket(@PathVariable Long id, @RequestBody GuestTicketRatingRequest request) {
        GuestUserDetails principal = requireGuestPrincipal();
        return guestPortalService.rateTicket(principal.getId(), id, request);
    }

    private GuestUserDetails requireGuestPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof GuestUserDetails guestUserDetails)) {
            throw new IllegalStateException("Guest authentication required");
        }
        return guestUserDetails;
    }
}
