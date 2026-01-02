package com.bamikahub.inventorysystem.dto.privacy;

import com.bamikahub.inventorysystem.models.privacy.CookieConsent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CookieConsentDto {
    private Long id;
    private boolean essentialCookies;
    private boolean analyticsCookies;
    private boolean marketingCookies;
    private boolean functionalCookies;
    private LocalDateTime consentDate;
    private LocalDateTime expiryDate;
    private String consentVersion;
    private boolean isActive;

    public static CookieConsentDto fromEntity(CookieConsent consent) {
        return new CookieConsentDto(
            consent.getId(),
            consent.isEssentialCookies(),
            consent.isAnalyticsCookies(),
            consent.isMarketingCookies(),
            consent.isFunctionalCookies(),
            consent.getConsentDate(),
            consent.getExpiryDate(),
            consent.getConsentVersion(),
            consent.isActive()
        );
    }
}
