package com.bamikahub.inventorysystem.dto.guest;

import lombok.Data;

@Data
public class GuestUserRegistrationRequest {
    private String fullName;
    private String email;
    private String phoneNumber;
    private String companyName;
    private String category;
}
