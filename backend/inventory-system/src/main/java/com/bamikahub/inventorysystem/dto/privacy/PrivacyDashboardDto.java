package com.bamikahub.inventorysystem.dto.privacy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrivacyDashboardDto {
    private long totalConsents;
    private long analyticsConsents;
    private long marketingConsents;
    private long pendingRequests;
    private long completedRequests;
    private long overdueRequests;
    private long activePolicies;
    private CookieConsentDto userConsent;
    private boolean has2FAEnabled;
}
