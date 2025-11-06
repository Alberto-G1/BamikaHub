package com.bamikahub.inventorysystem.dto.user;

import lombok.Data;

@Data
public class UserCreateRequest {
    private String firstName;

    private String lastName;

    private String username;

    private String email;

    private String password;

    private Integer roleId;
}