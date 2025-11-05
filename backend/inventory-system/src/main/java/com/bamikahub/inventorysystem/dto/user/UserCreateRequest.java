package com.bamikahub.inventorysystem.dto.user;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserCreateRequest {
    @NotBlank(message = "First name is required.")
    @Size(max = 100, message = "First name must be at most 100 characters.")
    private String firstName;

    @NotBlank(message = "Last name is required.")
    @Size(max = 100, message = "Last name must be at most 100 characters.")
    private String lastName;

    @NotBlank(message = "Username is required.")
    @Pattern(regexp = "^[A-Za-z0-9._-]{3,32}$", message = "Username must be 3-32 characters and contain only letters, numbers, dashes, underscores, or dots.")
    private String username;

    @NotBlank(message = "Email is required.")
    @Email(message = "Please provide a valid email address.")
    private String email;

    @NotBlank(message = "Password is required.")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters.")
    private String password;

    @NotNull(message = "Role is required.")
    private Integer roleId;
}