package com.bamikahub.inventorysystem.controllers.privacy;

import com.bamikahub.inventorysystem.dto.privacy.*;
import com.bamikahub.inventorysystem.services.privacy.PrivacyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/privacy")
public class PrivacyController {

    @Autowired
    private PrivacyService privacyService;

    // Privacy Settings

    @GetMapping("/settings")
    public ResponseEntity<PrivacySettingsDto> getPrivacySettings() {
        PrivacySettingsDto settings = privacyService.getPrivacySettings();
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/settings")
    public ResponseEntity<PrivacySettingsDto> updatePrivacySettings(@Valid @RequestBody PrivacySettingsDto settings) {
        PrivacySettingsDto updated = privacyService.updatePrivacySettings(settings);
        return ResponseEntity.ok(updated);
    }

    // Consent Management

    @GetMapping("/consents")
    public ResponseEntity<Map<String, ConsentRecordDto>> getUserConsents() {
        Map<String, ConsentRecordDto> consents = privacyService.getUserConsents();
        return ResponseEntity.ok(consents);
    }

    @PostMapping("/consents/{consentType}")
    public ResponseEntity<ConsentRecordDto> grantConsent(
            @PathVariable String consentType,
            @RequestParam String version,
            @RequestParam String consentText) {
        ConsentRecordDto consent = privacyService.grantConsent(consentType, version, consentText);
        return ResponseEntity.ok(consent);
    }

    @DeleteMapping("/consents/{consentType}")
    public ResponseEntity<Void> revokeConsent(@PathVariable String consentType) {
        privacyService.revokeConsent(consentType);
        return ResponseEntity.ok().build();
    }

    // Data Export Requests

    @PostMapping("/data/export")
    public ResponseEntity<DataExportRequestDto> requestDataExport(@Valid @RequestBody DataExportRequestDto request) {
        DataExportRequestDto created = privacyService.requestDataExport(request);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/data/export/requests")
    public ResponseEntity<Page<DataExportRequestDto>> getUserExportRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<DataExportRequestDto> requests = privacyService.getUserExportRequests(pageable);
        return ResponseEntity.ok(requests);
    }

    // Data Deletion Requests

    @PostMapping("/data/delete")
    public ResponseEntity<DataDeletionRequestDto> requestDataDeletion(@Valid @RequestBody DataDeletionRequestDto request) {
        DataDeletionRequestDto created = privacyService.requestDataDeletion(request);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/data/delete/requests")
    public ResponseEntity<Page<DataDeletionRequestDto>> getUserDeletionRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<DataDeletionRequestDto> requests = privacyService.getUserDeletionRequests(pageable);
        return ResponseEntity.ok(requests);
    }

    // Privacy Policy

    @GetMapping("/policy")
    public ResponseEntity<PrivacyPolicyDto> getCurrentPrivacyPolicy() {
        PrivacyPolicyDto policy = privacyService.getCurrentPrivacyPolicy();
        return ResponseEntity.ok(policy);
    }

    @GetMapping("/policy/all")
    public ResponseEntity<List<PrivacyPolicyDto>> getAllPrivacyPolicies() {
        List<PrivacyPolicyDto> policies = privacyService.getAllPrivacyPolicies();
        return ResponseEntity.ok(policies);
    }
}