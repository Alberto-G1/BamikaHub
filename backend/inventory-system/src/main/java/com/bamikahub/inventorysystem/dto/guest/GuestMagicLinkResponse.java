package com.bamikahub.inventorysystem.dto.guest;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GuestMagicLinkResponse {
    private boolean emailSent;
    private String token;
}
