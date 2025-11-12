package com.bamikahub.inventorysystem.controllers.guest;

import com.bamikahub.inventorysystem.dto.guest.GuestUserDto;
import com.bamikahub.inventorysystem.dto.guest.GuestUserRegistrationRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestUserStatusUpdateRequest;
import com.bamikahub.inventorysystem.services.guest.GuestPortalService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/guest/users")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
public class GuestUserController {

    private final GuestPortalService guestPortalService;

    @GetMapping
    @PreAuthorize("hasAuthority('GUEST_USER_MANAGE') or hasAuthority('GUEST_TICKET_VIEW')")
    public List<GuestUserDto> listGuests() {
        return guestPortalService.listGuests();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GUEST_USER_MANAGE') or hasAuthority('GUEST_TICKET_VIEW')")
    public GuestUserDto getGuest(@PathVariable Long id) {
        return guestPortalService.getGuest(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GUEST_USER_MANAGE')")
    public GuestUserDto registerGuest(@RequestBody GuestUserRegistrationRequest request) {
        return guestPortalService.registerGuest(request, currentActorReference());
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAuthority('GUEST_USER_MANAGE')")
    public GuestUserDto updateStatus(@PathVariable Long id, @RequestBody GuestUserStatusUpdateRequest request) {
        return guestPortalService.updateGuestStatus(id, request, currentActorReference());
    }

    private String currentActorReference() {
        return SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : null;
    }
}
