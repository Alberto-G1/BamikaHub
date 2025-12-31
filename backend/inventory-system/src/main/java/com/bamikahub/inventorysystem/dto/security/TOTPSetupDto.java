package com.bamikahub.inventorysystem.dto.security;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TOTPSetupDto {
    private String secret;
    private String qrCodeBase64;
    private String manualEntryKey;
}
