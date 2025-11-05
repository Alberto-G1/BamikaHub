package com.bamikahub.inventorysystem.dto.user;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserUpdateRequest {
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

    @NotNull(message = "Role is required.")
    private Integer roleId;

    @NotNull(message = "Status is required.")
    private Integer statusId;

    @NotNull(message = "Version is required for optimistic locking.")
    private Integer version;
}