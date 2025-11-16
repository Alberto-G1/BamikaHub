package com.bamikahub.inventorysystem.controllers.settings;

import com.bamikahub.inventorysystem.dto.settings.SystemSettingsDto;
import com.bamikahub.inventorysystem.dto.settings.SystemSettingsUpdateRequest;
import com.bamikahub.inventorysystem.dto.settings.UserSettingsDto;
import com.bamikahub.inventorysystem.dto.settings.UserSettingsUpdateRequest;
import com.bamikahub.inventorysystem.services.settings.SettingsService;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private SettingsService settingsService;

    @Autowired
    private UserRepository userRepository;

    // System Settings Endpoints (Admin only)

    @GetMapping("/system")
    @PreAuthorize("hasAuthority('SYSTEM_SETTINGS_READ')")
    public ResponseEntity<SystemSettingsDto> getSystemSettings() {
        SystemSettingsDto settings = settingsService.getSystemSettings();
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/system")
    @PreAuthorize("hasAuthority('SYSTEM_SETTINGS_UPDATE')")
    public ResponseEntity<SystemSettingsDto> updateSystemSettings(
            @Valid @RequestBody SystemSettingsUpdateRequest request) {
        SystemSettingsDto updated = settingsService.updateSystemSettings(request);
        return ResponseEntity.ok(updated);
    }

    // User Settings Endpoints (User can manage their own settings)

    @GetMapping("/user")
    public ResponseEntity<UserSettingsDto> getCurrentUserSettings() {
        // Get current user ID from security context
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        // For now, we'll need to get user ID from username - this would typically be handled by a UserDetailsService
        // For simplicity, let's assume we have a method to get current user ID
        Long userId = getCurrentUserId();
        UserSettingsDto settings = settingsService.getUserSettings(userId);
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/user")
    public ResponseEntity<UserSettingsDto> updateCurrentUserSettings(
            @Valid @RequestBody UserSettingsUpdateRequest request) {
        Long userId = getCurrentUserId();
        UserSettingsDto updated = settingsService.updateUserSettings(userId, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('USER_SETTINGS_READ')")
    public ResponseEntity<UserSettingsDto> getUserSettings(@PathVariable Long userId) {
        UserSettingsDto settings = settingsService.getUserSettings(userId);
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('USER_SETTINGS_UPDATE')")
    public ResponseEntity<UserSettingsDto> updateUserSettings(
            @PathVariable Long userId,
            @Valid @RequestBody UserSettingsUpdateRequest request) {
        UserSettingsDto updated = settingsService.updateUserSettings(userId, request);
        return ResponseEntity.ok(updated);
    }

    // Helper method to get current user ID
    // This would typically be implemented using UserDetailsService or similar
    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in database."));
        return user.getId();
    }
}