package com.bamikahub.inventorysystem.controllers;

import com.bamikahub.inventorysystem.dto.PasswordChangeRequest;
import com.bamikahub.inventorysystem.dto.ProfileUpdateRequest;
import com.bamikahub.inventorysystem.dto.UserProfileDto;
import com.bamikahub.inventorysystem.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserService userService;

    // Endpoint for a user to get their own profile
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()") // Any logged-in user can access this
    public UserProfileDto getMyProfile() {
        return userService.getCurrentUserProfile();
    }

    // Endpoint for a user to update their own profile
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserProfileDto updateMyProfile(@RequestBody ProfileUpdateRequest request) {
        return userService.updateCurrentUserProfile(request);
    }

    // Endpoint for a user to change their own password
    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> changeMyPassword(@RequestBody PasswordChangeRequest request) {
        userService.changeCurrentUserPassword(request);
        return ResponseEntity.ok("Password changed successfully.");
    }

    @PostMapping("/me/picture")
    @PreAuthorize("isAuthenticated()")
    public UserProfileDto uploadProfilePicture(@RequestParam("file") MultipartFile file) {
        return userService.updateProfilePicture(file);
    }
}