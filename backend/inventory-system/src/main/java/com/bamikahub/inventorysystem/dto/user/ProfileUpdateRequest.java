package com.bamikahub.inventorysystem.dto.user;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ProfileUpdateRequest {
    // Only includes fields the user can actually edit
    private String firstName;

    private String lastName;
    private String gender;
    private LocalDate dateOfBirth;

    private String phoneNumber;

    private String address;

    private String city;

    private String country;
}