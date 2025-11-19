package com.bamikahub.inventorysystem.controllers.admin;

import com.bamikahub.inventorysystem.dto.email.SendCustomEmailRequest;
import com.bamikahub.inventorysystem.dto.email.SendCustomEmailResponse;
import com.bamikahub.inventorysystem.services.email.AdminEmailService;
import com.bamikahub.inventorysystem.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;
import com.bamikahub.inventorysystem.services.FileStorageService;

@RestController
@RequestMapping("/internal/admin/email")
@RequiredArgsConstructor
public class AdminEmailController {

    private final AdminEmailService adminEmailService;
    private final FileStorageService fileStorageService;

    @PostMapping("/send")
    @PreAuthorize("hasAuthority('EMAIL_SEND')")
    public ResponseEntity<SendCustomEmailResponse> sendCustomEmail(
            @RequestBody SendCustomEmailRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        // Retrieve current authenticated user id and pass to service for auditing/rate-limiting
        Long actorId = userDetails != null ? userDetails.getId() : null;
        SendCustomEmailResponse response = adminEmailService.sendCustomEmail(actorId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/attachments")
    @PreAuthorize("hasAuthority('EMAIL_SEND')")
    public ResponseEntity<?> uploadAttachment(@RequestParam("file") MultipartFile file) {
        String filename = fileStorageService.storeAdminEmailAttachment(file);
        String path = "/uploads/email-attachments/" + filename;
        return ResponseEntity.ok(Map.of("path", path));
    }
}
