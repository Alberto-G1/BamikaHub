package com.bamikahub.inventorysystem.dto;

import lombok.Data;

import java.util.Set;

@Data
public class RoleRequest {
    private String name;
    private Set<Integer> permissionIds;
}