package com.bamikahub.inventorysystem.controllers.guest;

import com.bamikahub.inventorysystem.dto.guest.GuestAuthResponse;
import com.bamikahub.inventorysystem.dto.guest.GuestMagicLinkRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestMagicLinkVerifyRequest;
import com.bamikahub.inventorysystem.dto.guest.GuestMagicLinkResponse;
import com.bamikahub.inventorysystem.dto.guest.GuestUserDto;
import com.bamikahub.inventorysystem.dto.guest.GuestUserRegistrationRequest;
import com.bamikahub.inventorysystem.services.guest.GuestPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/guest")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
public class GuestPortalPublicController {

    private final GuestPortalService guestPortalService;

    @PostMapping("/register")
    public GuestUserDto registerGuest(@RequestBody GuestUserRegistrationRequest request) {
        return guestPortalService.registerGuestSelf(request);
    }

    @PostMapping("/magic-link")
    public GuestMagicLinkResponse requestMagicLink(@RequestBody GuestMagicLinkRequest request) {
        return guestPortalService.requestMagicLink(request);
    }

    @PostMapping("/magic-link/verify")
    public GuestAuthResponse verifyMagicLink(@RequestBody GuestMagicLinkVerifyRequest request) {
        return guestPortalService.verifyMagicLink(request);
    }
}
