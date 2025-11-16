package com.bamikahub.inventorysystem.services.privacy;

import com.bamikahub.inventorysystem.dao.privacy.*;
import com.bamikahub.inventorysystem.dao.user.UserRepository;
import com.bamikahub.inventorysystem.dto.privacy.*;
import com.bamikahub.inventorysystem.models.privacy.*;
import com.bamikahub.inventorysystem.models.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class PrivacyService {

    @Autowired
    private PrivacySettingsRepository privacySettingsRepository;

    @Autowired
    private ConsentRecordRepository consentRecordRepository;

    @Autowired
    private DataExportRequestRepository dataExportRequestRepository;

    @Autowired
    private DataDeletionRequestRepository dataDeletionRequestRepository;

    @Autowired
    private PrivacyPolicyRepository privacyPolicyRepository;

    @Autowired
    private UserRepository userRepository;

    // Privacy Settings Management

    public PrivacySettingsDto getPrivacySettings() {
        User currentUser = getCurrentUser();
        PrivacySettings settings = privacySettingsRepository.findByUser(currentUser)
                .orElseGet(() -> createDefaultPrivacySettings(currentUser));

        return convertToPrivacySettingsDto(settings);
    }

    public PrivacySettingsDto updatePrivacySettings(PrivacySettingsDto dto) {
        User currentUser = getCurrentUser();
        PrivacySettings settings = privacySettingsRepository.findByUser(currentUser)
                .orElseGet(() -> createDefaultPrivacySettings(currentUser));

        // Update settings
        settings.setProfileVisible(dto.isProfileVisible());
        settings.setActivityVisible(dto.isActivityVisible());
        settings.setStatisticsVisible(dto.isStatisticsVisible());
        settings.setEssentialCookies(dto.isEssentialCookies());
        settings.setAnalyticsCookies(dto.isAnalyticsCookies());
        settings.setMarketingCookies(dto.isMarketingCookies());
        settings.setFunctionalCookies(dto.isFunctionalCookies());
        settings.setAutoDeleteOldData(dto.isAutoDeleteOldData());
        settings.setDataRetentionDays(dto.getDataRetentionDays());

        PrivacySettings saved = privacySettingsRepository.save(settings);
        return convertToPrivacySettingsDto(saved);
    }

    private PrivacySettings createDefaultPrivacySettings(User user) {
        PrivacySettings settings = PrivacySettings.builder()
                .user(user)
                .profileVisible(true)
                .activityVisible(true)
                .statisticsVisible(false)
                .essentialCookies(true)
                .analyticsCookies(false)
                .marketingCookies(false)
                .functionalCookies(false)
                .autoDeleteOldData(false)
                .dataRetentionDays(365)
                .build();

        return privacySettingsRepository.save(settings);
    }

    // Consent Management

    public Map<String, ConsentRecordDto> getUserConsents() {
        User currentUser = getCurrentUser();
        List<ConsentRecord> consents = consentRecordRepository.findByUser(currentUser);

        return consents.stream()
                .collect(Collectors.toMap(
                    ConsentRecord::getConsentType,
                    this::convertToConsentRecordDto
                ));
    }

    public ConsentRecordDto grantConsent(String consentType, String consentVersion, String consentText) {
        User currentUser = getCurrentUser();

        ConsentRecord consent = ConsentRecord.builder()
                .user(currentUser)
                .consentType(consentType)
                .consentVersion(consentVersion)
                .consentText(consentText)
                .granted(true)
                .grantedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusYears(1)) // Default 1 year expiry
                .ipAddress(getCurrentUserIp())
                .userAgent(getCurrentUserAgent())
                .build();

        ConsentRecord saved = consentRecordRepository.save(consent);
        return convertToConsentRecordDto(saved);
    }

    public void revokeConsent(String consentType) {
        User currentUser = getCurrentUser();
        List<ConsentRecord> consents = consentRecordRepository.findByUserAndConsentType(currentUser, consentType);

        for (ConsentRecord consent : consents) {
            consent.setGranted(false);
            consentRecordRepository.save(consent);
        }
    }

    // Data Export Requests

    public DataExportRequestDto requestDataExport(DataExportRequestDto request) {
        User currentUser = getCurrentUser();

        DataExportRequest exportRequest = DataExportRequest.builder()
                .user(currentUser)
                .requestType(request.getRequestType())
                .format(request.getFormat())
                .reason(request.getReason())
                .status("PENDING")
                .build();

        DataExportRequest saved = dataExportRequestRepository.save(exportRequest);
        return convertToDataExportRequestDto(saved);
    }

    public Page<DataExportRequestDto> getUserExportRequests(Pageable pageable) {
        User currentUser = getCurrentUser();
        return dataExportRequestRepository.findByUser(currentUser, pageable)
                .map(this::convertToDataExportRequestDto);
    }

    // Data Deletion Requests

    public DataDeletionRequestDto requestDataDeletion(DataDeletionRequestDto request) {
        User currentUser = getCurrentUser();

        DataDeletionRequest deletionRequest = DataDeletionRequest.builder()
                .user(currentUser)
                .deletionType(request.getDeletionType())
                .dataCategories(request.getDataCategories())
                .reason(request.getReason())
                .status("PENDING")
                .build();

        DataDeletionRequest saved = dataDeletionRequestRepository.save(deletionRequest);
        return convertToDataDeletionRequestDto(saved);
    }

    public Page<DataDeletionRequestDto> getUserDeletionRequests(Pageable pageable) {
        User currentUser = getCurrentUser();
        return dataDeletionRequestRepository.findByUser(currentUser, pageable)
                .map(this::convertToDataDeletionRequestDto);
    }

    // Privacy Policy Management

    public PrivacyPolicyDto getCurrentPrivacyPolicy() {
        PrivacyPolicy policy = privacyPolicyRepository.findFirstByIsActiveTrueOrderByEffectiveDateDesc()
                .orElse(null);

        if (policy == null) {
            // No active policy configured yet – return null so the API responds with 200 and an empty body
            // and the frontend can show a friendly "No privacy policy available" message instead of failing.
            return null;
        }

        return convertToPrivacyPolicyDto(policy);
    }

    public List<PrivacyPolicyDto> getAllPrivacyPolicies() {
        return privacyPolicyRepository.findAllByOrderByEffectiveDateDesc().stream()
                .map(this::convertToPrivacyPolicyDto)
                .collect(Collectors.toList());
    }

    // Helper Methods

    private User getCurrentUser() {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String getCurrentUserIp() {
        // In a real implementation, this would be extracted from the HTTP request
        return "127.0.0.1";
    }

    private String getCurrentUserAgent() {
        // In a real implementation, this would be extracted from the HTTP request
        return "Web Browser";
    }

    // Conversion Methods

    private PrivacySettingsDto convertToPrivacySettingsDto(PrivacySettings settings) {
        Map<String, ConsentRecordDto> consents = getUserConsents();

        return PrivacySettingsDto.builder()
                .userId(settings.getUser().getId())
                .email(settings.getUser().getEmail())
                .profileVisible(settings.isProfileVisible())
                .activityVisible(settings.isActivityVisible())
                .statisticsVisible(settings.isStatisticsVisible())
                .essentialCookies(settings.isEssentialCookies())
                .analyticsCookies(settings.isAnalyticsCookies())
                .marketingCookies(settings.isMarketingCookies())
                .functionalCookies(settings.isFunctionalCookies())
                .autoDeleteOldData(settings.isAutoDeleteOldData())
                .dataRetentionDays(settings.getDataRetentionDays())
                .consents(consents)
                .lastUpdated(settings.getLastUpdated())
                .build();
    }

    private ConsentRecordDto convertToConsentRecordDto(ConsentRecord consent) {
        return ConsentRecordDto.builder()
                .consentType(consent.getConsentType())
                .consentText(consent.getConsentText())
                .granted(consent.isGranted())
                .grantedAt(consent.getGrantedAt())
                .expiresAt(consent.getExpiresAt())
                .consentVersion(consent.getConsentVersion())
                .build();
    }

    private DataExportRequestDto convertToDataExportRequestDto(DataExportRequest request) {
        return DataExportRequestDto.builder()
                .requestType(request.getRequestType())
                .format(request.getFormat())
                .reason(request.getReason())
                .requestedAt(request.getRequestedAt())
                .status(request.getStatus())
                .downloadUrl(request.getDownloadUrl())
                .build();
    }

    private DataDeletionRequestDto convertToDataDeletionRequestDto(DataDeletionRequest request) {
        return DataDeletionRequestDto.builder()
                .deletionType(request.getDeletionType())
                .dataCategories(request.getDataCategories())
                .reason(request.getReason())
                .requestedAt(request.getRequestedAt())
                .status(request.getStatus())
                .adminNotes(request.getAdminNotes())
                .build();
    }

    private PrivacyPolicyDto convertToPrivacyPolicyDto(PrivacyPolicy policy) {
        return PrivacyPolicyDto.builder()
                .id(policy.getId())
                .version(policy.getVersion())
                .title(policy.getTitle())
                .content(policy.getContent())
                .effectiveDate(policy.getEffectiveDate())
                .createdAt(policy.getCreatedAt())
                .isActive(policy.isActive())
                .requiresConsent(policy.isRequiresConsent())
                .build();
    }
}