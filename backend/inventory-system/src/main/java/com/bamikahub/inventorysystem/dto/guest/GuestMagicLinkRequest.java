package com.bamikahub.inventorysystem.dto.guest;

import lombok.Data;

@Data
public class GuestMagicLinkRequest {
    private String email;
    private String redirectUrl;
}
