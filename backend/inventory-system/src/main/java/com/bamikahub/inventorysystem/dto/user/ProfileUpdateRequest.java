package com.bamikahub.inventorysystem.dto.user;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProfileUpdateRequest {
    // Only includes fields the user can actually edit
    @Size(max = 100, message = "First name must be at most 100 characters.")
    private String firstName;

    @Size(max = 100, message = "Last name must be at most 100 characters.")
    private String lastName;
    private String gender;
    private LocalDate dateOfBirth;

    @Size(max = 30, message = "Phone number must be at most 30 characters.")
    private String phoneNumber;

    @Size(max = 255, message = "Address must be at most 255 characters.")
    private String address;

    @Size(max = 100, message = "City must be at most 100 characters.")
    private String city;

    @Size(max = 100, message = "Country must be at most 100 characters.")
    private String country;
}