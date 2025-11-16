package com.bamikahub.inventorysystem.dto.security;

import lombok.Data;

@Data
public class TwoFactorSetupDto {
    private boolean enabled;
    private String secretKey;
    private String qrCodeUrl;
    private String backupCodes;
    private boolean verified;
}