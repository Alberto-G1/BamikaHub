package com.bamikahub.inventorysystem.dto.guest;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GuestAuthResponse {
    private String token;
    private LocalDateTime expiresAt;
    private GuestUserDto guest;
}
