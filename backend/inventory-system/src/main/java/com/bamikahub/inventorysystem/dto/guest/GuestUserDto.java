package com.bamikahub.inventorysystem.dto.guest;

import com.bamikahub.inventorysystem.models.guest.GuestAccountStatus;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GuestUserDto {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String companyName;
    private String category;
    private GuestAccountStatus status;
    private boolean emailVerified;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    private Integer ticketCount;
}
